import { QDRANT_COLLECTION } from "../../config.js";

import { qdrant } from "../../infrastructure/qdrant.js";

export async function searchBm25(queryText, limit = 5) {
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
