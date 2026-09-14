# Hybrid Autocomplete

A small experimental project for learning and comparing different approaches to autocomplete and search:

* **Elasticsearch** — lexical search + prefix autocomplete
* **Qdrant BM25** — lexical/token-based search
* **Hybrid Search** — dense embeddings + BM25 + Reciprocal Rank Fusion (RRF)

The project uses a Vue frontend, Fastify backend, Elasticsearch, and Qdrant.

## Architecture

```text
                         ┌─────────────────────┐
                         │      Vue Client     │
                         │   Autocomplete UI   │
                         └──────────┬──────────┘
                                    │
                                    │ HTTP
                                    ▼
                         ┌─────────────────────┐
                         │    Fastify Server   │
                         │                     │
                         │ /api/suggestions    │
                         └───────┬─────┬───────┘
                                 │     │
                    ┌────────────┘     └──────────────┐
                    ▼                                 ▼
          ┌──────────────────┐              ┌──────────────────┐
          │  Elasticsearch   │              │      Qdrant      │
          │                  │              │                  │
          │ search_as_you_type│             │ Dense embeddings │
          │ bool_prefix      │              │ BM25 sparse      │
          └──────────────────┘              └────────┬─────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │     RRF      │
                                              │    Fusion    │
                                              └──────────────┘
```

## Why this project?

Autocomplete looks simple, but different search methods behave very differently.

For example, given:

```text
how to cook
```

a lexical autocomplete engine is very good at finding:

```text
How to cook rice?
How to cook pasta?
How to cook vegetables?
```

But semantic search can also find results based on meaning.

For example:

```text
how to cook rice
```

may retrieve:

```text
What is the best way to prepare rice?
```

even though the words are different.

This project is intended to make those differences visible and measurable.

---

# Search Modes

The frontend provides three modes.

## 1. Elasticsearch

Elasticsearch uses a `search_as_you_type` field with `bool_prefix`.

```text
User input
    │
    ▼
Elasticsearch
    │
    ▼
Lexical / prefix matching
    │
    ▼
Suggestions
```

It is designed for fast autocomplete.

Example:

```text
Input:
what is a good mov
```

Possible results:

```text
What is a good movie?
What is a good movie for a rainy evening?
```

### Strengths

* Very fast
* Excellent for prefix autocomplete
* Good lexical matching
* Suitable for interactive search boxes

### Limitations

The current configuration is lexical rather than semantic.

For example:

```text
how to cook rice
```

and:

```text
how to prepare rice
```

are not considered equivalent simply because they have similar meanings.

Also, `bool_prefix` is not the same thing as fuzzy search. Typo tolerance requires additional fuzzy-search configuration.

---

# 2. Qdrant BM25

Qdrant stores a sparse BM25 representation alongside the dense vector.

```text
User input
    │
    ▼
Qdrant BM25
    │
    ▼
Token-based lexical matching
    │
    ▼
Suggestions
```

BM25 is a lexical ranking algorithm. It scores documents based on term statistics rather than understanding the semantic meaning of a sentence.

For example:

```text
Input:
healthy breakfast
```

can match documents containing:

```text
healthy
breakfast
```

and rank them according to BM25.

### Strengths

* Very fast
* Good exact/token-level lexical matching
* Useful as a sparse retrieval signal

### Limitations

The current Qdrant BM25 setup is not designed specifically for prefix autocomplete.

For example:

```text
postgre
```

does not automatically behave like:

```text
postgresql
```

unless the indexing/tokenization strategy is designed to support that behavior.

BM25 also does not require the entire query to exactly match a document. It can rank documents that contain only some of the query terms.

---

# 3. Hybrid Search

Hybrid search combines:

* Dense semantic search
* Sparse BM25 search

The project uses **Reciprocal Rank Fusion (RRF)** to combine the two result lists.

```text
                         Query
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       Dense Embedding              BM25
              │                         │
              ▼                         ▼
        Semantic results          Lexical results
              │                         │
              └────────────┬────────────┘
                           ▼
                          RRF
                           │
                           ▼
                    Final suggestions
```

The idea is simple:

* BM25 is good at exact lexical signals.
* Dense embeddings are good at semantic similarity.
* RRF combines their rankings without requiring the two scores to be directly comparable.

Example:

```text
Query:
how to learn japanese
```

BM25 may prioritize:

```text
How can I learn a language faster?
How to learn Japanese?
```

while semantic search may discover related results with different wording.

The hybrid result combines both signals.

---

# Multilingual Search

One of the main reasons for including dense embeddings is multilingual semantic retrieval.

A lexical search engine generally works with tokens and analyzers.

For example:

```text
English:
How to cook rice?

Japanese:
ご飯の炊き方は？
```

These queries use completely different tokens.

A multilingual embedding model can potentially map semantically related texts into a similar vector space.

Therefore, dense retrieval can provide a capability that ordinary lexical matching does not provide naturally:

```text
different language
        ↓
different words
        ↓
similar semantic representation
        ↓
semantic retrieval
```

The quality of this behavior depends heavily on the embedding model.

---

# Tech Stack

## Frontend

* Vue
* Vite

## Backend

* Node.js
* Fastify
* `@qdrant/js-client-rest`
* `@elastic/elasticsearch`

## Search

* Qdrant
* Elasticsearch

## Embeddings

OpenRouter Embeddings API:

```text
qwen/qwen3-embedding-8b
```

The current Qdrant collection uses a vector size of:

```text
4096
```

---

# Project Structure

```text
HybridAutocomplete/
│
├── client/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── index.js
│   │   ├── elasticsearch.js
│   │   └── routes/
│   │       ├── hybrid.js
│   │       ├── bm25.js
│   │       └── elasticsearch.js
│   │
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

# Requirements

Install:

* Node.js
* Docker
* Docker Compose

The backend currently uses Node.js 24.x.

You also need an OpenRouter API key for generating dense embeddings.

---

# Environment Variables

Create:

```text
server/.env
```

with:

```env
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=hybrid_autocomplete

OPENROUTER_API_KEY=your_key_here
EMBEDDING_MODEL=qwen/qwen3-embedding-8b
VECTOR_SIZE=4096

ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=autocomplete

PORT=3000
```

Do not commit the API key to Git.

---

# Installation

## 1. Install frontend dependencies

```bash
cd client
npm install
```

## 2. Install backend dependencies

```bash
cd ../server
npm install
```

## 3. Start Qdrant and Elasticsearch

From the project root:

```bash
docker compose up -d
```

Check Qdrant:

```bash
curl http://localhost:6333
```

Check Elasticsearch:

```bash
curl http://localhost:9200
```

---

# Start the Backend

```bash
cd server
npm run dev
```

The API runs on:

```text
http://localhost:3000
```

Health check:

```text
GET /health
```

---

# Start the Frontend

In another terminal:

```bash
cd client
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

Open the URL in a browser.

---

# Initialize the Search Indexes

The application creates the required Qdrant collection and Elasticsearch index when the server starts.

It does **not** automatically reseed the data every time the server restarts.

To recreate both indexes and seed the dataset:

```text
POST /api/recreate
```

For example:

```bash
curl -X POST http://localhost:3000/api/recreate
```

This operation:

1. Deletes the existing Qdrant collection.
2. Creates the Qdrant collection again.
3. Generates dense embeddings.
4. Inserts dense + BM25 vectors into Qdrant.
5. Deletes the Elasticsearch index.
6. Creates the Elasticsearch index again.
7. Seeds the Elasticsearch documents.

Embedding generation requires the configured OpenRouter API key.

---

# API

## Health

```http
GET /health
```

Example:

```bash
curl http://localhost:3000/health
```

---

## Suggestions

```http
GET /api/suggestions?q=<query>&mode=<mode>&limit=<limit>
```

### Parameters

| Parameter | Description       | Example       |
| --------- | ----------------- | ------------- |
| `q`       | User query        | `how to cook` |
| `mode`    | Search strategy   | `hybrid`      |
| `limit`   | Number of results | `5`           |

Supported modes:

```text
hybrid
bm25
elasticsearch
```

Example:

```bash
curl "http://localhost:3000/api/suggestions?q=how%20to%20cook&mode=hybrid&limit=5"
```

Example response:

```json
{
  "mode": "hybrid",
  "query": "how to cook",
  "latencyMs": 42,
  "results": [
    {
      "id": 12,
      "text": "How do I make fried rice?",
      "score": 0.92
    }
  ]
}
```

---

# Dataset

The project uses a small general-pu
