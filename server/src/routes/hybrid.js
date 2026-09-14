import {
  qdrant,
} from "../qdrant.js";

import {
  QDRANT_COLLECTION,
} from "../config.js";

import { embedText } from "../embeddings.js";

export async function hybridSearch(
  queryText,
  limit = 5
) {
  const dense = await embedText(queryText);

  const result = await qdrant.query(
    QDRANT_COLLECTION,
    {
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
    }
  );

  return result.points.map((point) => ({
    id: point.id,
    text: point.payload?.text,
    score: point.score,
  }));
}

export default async function hybridRoutes(app) {
  app.get(
    "/api/hybrid",
    async (request) => {
      const {
        q = "",
        limit = 5,
      } = request.query;

      if (!q.trim()) {
        return {
          results: [],
        };
      }

      return {
        results: await hybridSearch(
          q.trim(),
          Number(limit)
        ),
      };
    }
  );
}