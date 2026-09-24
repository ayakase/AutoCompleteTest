import "dotenv/config";

export const PORT = Number(process.env.PORT || 3000);

export const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";

export const QDRANT_COLLECTION =
  process.env.QDRANT_COLLECTION || "hybrid_autocomplete";

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || "qwen/qwen3-embedding-8b";

export const VECTOR_SIZE = Number(process.env.VECTOR_SIZE || 4096);

export const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9200";

export const ELASTICSEARCH_INDEX =
  process.env.ELASTICSEARCH_INDEX || "autocomplete";

export const DEFAULT_SEARCH_LIMIT = Number(
  process.env.DEFAULT_SEARCH_LIMIT || 15,
);

export const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

export const PINECONE_INDEX = process.env.PINECONE_INDEX;

export const PINECONE_URL = process.env.PINECONE_URL;

