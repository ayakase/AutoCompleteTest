import { QDRANT_COLLECTION } from "../../config.js";

import { embedText } from "../../infrastructure/embeddings.js";

import { qdrant } from "../../infrastructure/qdrant.js";

export async function searchHybrid(queryText, limit = 5) {
  const dense = await embedText(queryText);

  const result = await qdrant.query(QDRANT_COLLECTION, {
    prefetch: [
      {
        query: dense,
        using: "dense",
        limit: 20,
      },

      {
        query: {
          text: queryText,
          model: "qdrant/bm25",
        },
        using: "bm25",
        limit: 20,
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
