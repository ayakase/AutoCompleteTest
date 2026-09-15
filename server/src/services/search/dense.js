import {
  DEFAULT_SEARCH_LIMIT,
  QDRANT_COLLECTION,
} from "../../config.js";

import { embedText } from "../../infrastructure/embeddings.js";

import { qdrant } from "../../infrastructure/qdrant.js";

export async function searchDense(queryText, limit = DEFAULT_SEARCH_LIMIT) {
  const dense = await embedText(queryText);

  const result = await qdrant.query(QDRANT_COLLECTION, {
    query: dense,

    using: "dense",

    limit,

    with_payload: true,
  });

  return result.points.map((point) => ({
    id: point.id,
    text: point.payload?.text,
    score: point.score,
  }));
}
