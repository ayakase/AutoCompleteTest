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
  justify-content: center;
  padding: 80px 20px;
}

.card {
  width: 100%;
  max-width: 720px;
}

h1 {
  margin: 0 0 24px;
  font-size: 28px;
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
