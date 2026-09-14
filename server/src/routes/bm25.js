import { qdrant } from "../qdrant.js";

import { QDRANT_COLLECTION } from "../config.js";

export async function bm25Search(queryText, limit = 5) {
  const result = await qdrant.query(QDRANT_COLLECTION, {
    query: {
      text: queryText,
      model: "qdrant/bm25",
    },

    using: "bm25",

    limit,

    with_payload: true,
  });

  return result.points.map((point) => ({
    id: point.id,
    text: point.payload?.text,
    score: point.score,
  }));
}

export default async function bm25Routes(app) {
  app.get("/api/bm25", async (request) => {
    const { q = "", limit = 5 } = request.query;

    if (!q.trim()) {
      return {
        results: [],
      };
    }

    return {
      results: await bm25Search(q.trim(), Number(limit)),
    };
  });
}
