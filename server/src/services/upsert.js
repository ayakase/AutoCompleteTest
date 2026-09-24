import { createHash } from "node:crypto";

import { ELASTICSEARCH_INDEX, QDRANT_COLLECTION } from "../config.js";

import { embedText } from "../infrastructure/embeddings.js";

import { elasticsearch } from "../infrastructure/elasticsearch.js";

import { qdrant } from "../infrastructure/qdrant.js";

export function questionDocId(text) {
  const hash = createHash("sha256").update(text).digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

export async function upsertQuestion(text) {
  const id = questionDocId(text);

  const dense = await embedText(text);

  await qdrant.upsert(QDRANT_COLLECTION, {
    wait: true,
    points: [
      {
        id,

        vector: {
          dense,

          bm25: {
            text,
            model: "qdrant/bm25",
          },
        },

        payload: {
          text,
        },
      },
    ],
  });

  await elasticsearch.index({
    index: ELASTICSEARCH_INDEX,
    id,
    document: {
      text,
    },
    refresh: true,
  });

  console.log(`Question upserted: ${text}`);

  return {
    id,
    text,
  };
}
