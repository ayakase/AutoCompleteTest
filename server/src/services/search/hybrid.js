import {
  DEFAULT_SEARCH_LIMIT,
  QDRANT_COLLECTION,
} from "../../config.js";

import { embedText } from "../../infrastructure/embeddings.js";

import { qdrant } from "../../infrastructure/qdrant.js";

const PREFETCH_LIMIT = 50;

export async function searchHybrid(
  queryText,
  limit = DEFAULT_SEARCH_LIMIT,
) {
  const dense = await embedText(queryText);

  const result = await qdrant.query(QDRANT_COLLECTION, {
    prefetch: [
      {
        query: dense,
        using: "dense",
        limit: PREFETCH_LIMIT,
      },

      {
        query: {
          text: queryText,
          model: "qdrant/bm25",
        },
        using: "bm25",
        limit: PREFETCH_LIMIT,
      },
    ],

    query: {
      fusion: "rrf",
    },

    limit,

    with_payload: true,
  });

  return result.points.map((point) => ({
    id: point.id,
    text: point.payload?.text,
    score: point.score,
  }));
}
