import { QdrantClient } from "@qdrant/js-client-rest";

import {
  QDRANT_URL,
  QDRANT_COLLECTION,
  VECTOR_SIZE,
} from "./config.js";

export const qdrant = new QdrantClient({
  url: QDRANT_URL,
});

export async function ensureQdrantCollection() {
  const collections =
    await qdrant.getCollections();

  const exists = collections.collections.some(
    (collection) =>
      collection.name === QDRANT_COLLECTION
  );

  if (exists) {
    return;
  }

  await qdrant.createCollection(
    QDRANT_COLLECTION,
    {
      vectors: {
        dense: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      },

      sparse_vectors: {
        bm25: {
          modifier: "idf",
        },
      },
    }
  );

  console.log(
    `Qdrant collection created: ${QDRANT_COLLECTION}`
  );
}

export async function recreateQdrantCollection() {
  const collections =
    await qdrant.getCollections();

  const exists = collections.collections.some(
    (collection) =>
      collection.name === QDRANT_COLLECTION
  );

  if (exists) {
    await qdrant.deleteCollection(
      QDRANT_COLLECTION
    );
  }

  await ensureQdrantCollection();
}

export async function seedQdrant(
  questions,
  embedText
) {
  const points = [];

  for (let i = 0; i < questions.length; i++) {
    const text = questions[i];

    console.log(
      `Embedding ${i + 1}/${questions.length}: ${text}`
    );

    const dense = await embedText(text);

    points.push({
      id: i + 1,

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
    });
  }

  if (points.length === 0) {
    return;
  }

  await qdrant.upsert(
    QDRANT_COLLECTION,
    {
      wait: true,
      points,
    }
  );

  console.log(
    `Qdrant seeded: ${questions.length} documents`
  );
}