import "dotenv/config";

export const PORT = Number(process.env.PORT || 3000);

export const QDRANT_URL =
  process.env.QDRANT_URL || "http://localhost:6333";

export const QDRANT_COLLECTION =
  process.env.QDRANT_COLLECTION || "hybrid_autocomplete";

export const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY;

export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL ||
  "qwen/qwen3-embedding-8b";

export const VECTOR_SIZE =
  Number(process.env.VECTOR_SIZE || 4096);

export const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL ||
  "http://localhost:9200";

export const ELASTICSEARCH_INDEX =
  process.env.ELASTICSEARCH_INDEX ||
  "autocomplete";