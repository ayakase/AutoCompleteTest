<script setup>
import { ref, watch } from "vue";
import axios from "axios";

const API_URL = "http://localhost:3000";

const MODE_STORAGE_KEY = "autocomplete-mode";

const validModes = [
  "hybrid",
  "bm25",
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

let debounceTimer = null;
let requestId = 0;

async function fetchSuggestions() {
  const currentQuery = query.value.trim();

  if (currentQuery.length < 2) {
    suggestions.value = [];
    latency.value = null;
    error.value = "";
    return;
  }

  const currentRequestId = ++requestId;

  loading.value = true;
  error.value = "";

  try {
    const response = await axios.get(
      `${API_URL}/api/suggestions`,
      {
        params: {
          q: currentQuery,
          mode: mode.value,
        },
      }
    );

    if (currentRequestId !== requestId) {
      return;
    }

    suggestions.value =
      response.data.suggestions || [];

    latency.value =
      response.data.latency_ms;
  } catch (err) {
    if (currentRequestId !== requestId) {
      return;
    }

    error.value =
      err.response?.data?.error ||
      err.message ||
      "Request failed";
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false;
    }
  }
}

function scheduleSearch() {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    fetchSuggestions();
  }, 250);
}

function changeMode() {
  localStorage.setItem(
    MODE_STORAGE_KEY,
    mode.value
  );

  suggestions.value = [];
  latency.value = null;
  error.value = "";

  if (query.value.trim().length >= 2) {
    fetchSuggestions();
  }
}

watch(query, () => {
  scheduleSearch();
});

watch(mode, () => {
  changeMode();
});
</script>

<template>
  <main class="page">
    <section class="card">
      <h1>Hybrid Autocomplete</h1>

      <div class="modes">
        <label>
          <input
            v-model="mode"
            type="radio"
            value="hybrid"
          />
          Hybrid
        </label>

        <label>
          <input
            v-model="mode"
            type="radio"
            value="bm25"
          />
          BM25
        </label>

        <label>
          <input
            v-model="mode"
            type="radio"
            value="elasticsearch"
          />
          Elasticsearch
        </label>
      </div>

      <input
        v-model="query"
        class="search-input"
        type="text"
        placeholder="Type something..."
        autofocus
      />

      <div class="meta">
        <span>
          Mode: <strong>{{ mode }}</strong>
        </span>

        <span v-if="latency !== null">
          {{ latency }} ms
        </span>

        <span v-if="loading">
          Searching...
        </span>
      </div>

      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>

      <div
        v-if="suggestions.length"
        class="suggestions"
      >
        <div
          v-for="item in suggestions"
          :key="item.id"
          class="suggestion"
        >
          <span class="text">
            {{ item.text }}
          </span>

          <span class="score">
            {{ item.score?.toFixed?.(4) ?? item.score }}
          </span>
        </div>
      </div>

      <p
        v-else-if="
          query.trim().length >= 2 &&
          !loading &&
          !error
        "
        class="empty"
      >
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