<script setup>
import { ref, watch, onBeforeUnmount } from "vue";
import axios from "axios";

const API_URL = "http://localhost:3000";
const MODE_STORAGE_KEY = "autocomplete-mode";
const DEBOUNCE_MS = 2000;
const RESULT_LIMIT = 15;

const validModes = [
  "hybrid",
  "bm25",
  "dense",
  "elasticsearch",
  "pinecone",
];

const savedMode =
  localStorage.getItem(MODE_STORAGE_KEY);

const mode = ref(
  validModes.includes(savedMode)
    ? savedMode
    : "hybrid"
);

const query = ref("");
const suggestions = ref([]);
const latency = ref(null);
const error = ref("");
const loading = ref(false);
const countdown = ref(0);

const newQuestion = ref("");
const upserting = ref(false);
const upsertMessage = ref("");
const upsertError = ref("");

let debounceTimer = null;
let countdownTimer = null;
let abortController = null;

function clearTimers() {
  clearTimeout(debounceTimer);
  clearInterval(countdownTimer);

  debounceTimer = null;
  countdownTimer = null;
}

function startCountdown() {
  clearInterval(countdownTimer);

  countdown.value = DEBOUNCE_MS / 1000;

  countdownTimer = setInterval(() => {
    countdown.value -= 0.1;

    if (countdown.value <= 0) {
      countdown.value = 0;
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 100);
}

async function fetchSuggestions() {
  const currentQuery = query.value.trim();

  countdown.value = 0;

  if (currentQuery.length < 2) {
    suggestions.value = [];
    latency.value = null;
    error.value = "";
    loading.value = false;
    return;
  }

  abortController?.abort();

  abortController = new AbortController();

  loading.value = true;
  error.value = "";

  try {
    const response = await axios.get(
      `${API_URL}/api/suggestions`,
      {
        params: {
          q: currentQuery,
          mode: mode.value,
          limit: RESULT_LIMIT,
        },
        signal: abortController.signal,
      }
    );

    suggestions.value =
      response.data.results || [];

    latency.value =
      response.data.latencyMs ?? null;
  } catch (err) {
    if (
      err.code === "ERR_CANCELED" ||
      err.name === "CanceledError"
    ) {
      return;
    }

    suggestions.value = [];
    latency.value = null;

    error.value =
      err.response?.data?.error ||
      err.message ||
      "Request failed";
  } finally {
    if (!abortController.signal.aborted) {
      loading.value = false;
    }
  }
}

function scheduleSearch() {
  clearTimers();

  const currentQuery = query.value.trim();

  if (currentQuery.length < 2) {
    countdown.value = 0;
    suggestions.value = [];
    latency.value = null;
    error.value = "";
    return;
  }

  startCountdown();

  debounceTimer = setTimeout(() => {
    fetchSuggestions();
  }, DEBOUNCE_MS);
}

function searchNow() {
  if (query.value.trim().length < 2) {
    return;
  }

  clearTimers();

  fetchSuggestions();
}

function changeMode() {
  localStorage.setItem(
    MODE_STORAGE_KEY,
    mode.value
  );

  clearTimers();
  abortController?.abort();

  suggestions.value = [];
  latency.value = null;
  error.value = "";
  countdown.value = 0;

  if (query.value.trim().length >= 2) {
    scheduleSearch();
  }
}

async function submitQuestion() {
  const question = newQuestion.value.trim();

  if (!question) {
    return;
  }

  upserting.value = true;
  upsertMessage.value = "";
  upsertError.value = "";

  try {
    const response = await axios.post(
      `${API_URL}/api/upsert`,
      { question }
    );

    upsertMessage.value =
      `Added: ${response.data.text ?? question}`;

    newQuestion.value = "";
  } catch (err) {
    upsertError.value =
      err.response?.data?.error ||
      err.message ||
      "Upsert failed";
  } finally {
    upserting.value = false;
  }
}

watch(query, () => {
  scheduleSearch();
});

watch(mode, () => {
  changeMode();
});

onBeforeUnmount(() => {
  clearTimers();
  abortController?.abort();
});
</script>

<template>
  <main class="page">
    <section class="card">
      <h1>Hybrid Autocomplete</h1>

      <div class="modes">
        <label>
          <input v-model="mode" type="radio" value="hybrid" />
          Hybrid
        </label>

        <label>
          <input v-model="mode" type="radio" value="bm25" />
          BM25
        </label>

        <label>
          <input v-model="mode" type="radio" value="dense" />
          Dense
        </label>

        <label>
          <input v-model="mode" type="radio" value="elasticsearch" />
          Elasticsearch
        </label>

        <label>
          <input v-model="mode" type="radio" value="pinecone" />
          Pinecone FTS
        </label>
      </div>

      <input
        v-model="query"
        class="search-input"
        type="text"
        placeholder="Type something..."
        autofocus
        @keydown.enter.prevent="searchNow"
      />

      <div class="meta">
        <span>
          Mode: <strong>{{ mode }}</strong>
        </span>

        <span v-if="countdown > 0">
          Searching in {{ countdown.toFixed(1) }}s
        </span>

        <span v-else-if="loading">
          Searching...
        </span>

        <span v-if="latency !== null && !loading">
          {{ latency }} ms
        </span>
      </div>

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <div v-if="suggestions.length" class="suggestions">
        <div v-for="item in suggestions" :key="item.id" class="suggestion">
          <span class="text">
            {{ item.text }}
          </span>

          <span class="score">
            {{
              item.score?.toFixed?.(4) ??
              item.score
            }}
          </span>
        </div>
      </div>

      <p v-else-if="
        query.trim().length >= 2 &&
        countdown === 0 &&
        !loading &&
        !error
      " class="empty">
        No suggestions
      </p>
    </section>

    <section class="card">
      <h2>Add a question</h2>

      <form class="upsert-form" @submit.prevent="submitQuestion">
        <input
          v-model="newQuestion"
          class="upsert-input"
          type="text"
          placeholder="What do you want to add?"
        />

        <button
          class="upsert-button"
          type="submit"
          :disabled="upserting"
        >
          {{ upserting ? "Adding..." : "Add" }}
        </button>
      </form>

      <p v-if="upsertMessage" class="upsert-message">
        {{ upsertMessage }}
      </p>

      <p v-if="upsertError" class="error">
        {{ upsertError }}
      </p>
    </section>
  </main>
</template>



<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background: #f5f5f5;
  color: #222;
}

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  justify-content: center;
  padding: 80px 20px;
}

.upsert-form {
  display: flex;
  gap: 12px;
}

.upsert-input {
  flex: 1;
  padding: 14px 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
}

.upsert-input:focus {
  border-color: #777;
}

.upsert-button {
  padding: 14px 24px;
  border: 1px solid #222;
  border-radius: 8px;
  background: #222;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.upsert-button:disabled {
  opacity: 0.6;
  cursor: default;
}

.upsert-message {
  margin: 16px 0 0;
  color: #2a7d4f;
}

.card {
  width: 100%;
  max-width: 720px;
}

h1 {
  margin: 0 0 24px;
  font-size: 28px;
}

h2 {
  margin: 0 0 16px;
  font-size: 18px;
}

.modes {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.modes label {
  cursor: pointer;
}

.search-input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
}

.search-input:focus {
  border-color: #777;
}

.meta {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  font-size: 13px;
  color: #666;
}

.suggestions {
  margin-top: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid #eee;
}

.suggestion:last-child {
  border-bottom: none;
}

.text {
  flex: 1;
}

.score {
  color: #888;
  font-size: 12px;
}

.error {
  margin-top: 16px;
  color: #c00;
}

.empty {
  margin-top: 16px;
  color: #888;
}
</style>
