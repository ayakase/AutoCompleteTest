import { QdrantClient } from "@qdrant/js-client-rest";

import { QDRANT_URL, QDRANT_COLLECTION, VECTOR_SIZE } from "../config.js";

export const qdrant = new QdrantClient({
  url: QDRANT_URL,
});

export async function ensureQdrantCollection() {
  const collections = await qdrant.getCollections();

  const exists = collections.collections.some(
    (collection) => collection.name === QDRANT_COLLECTION,
  );

  if (exists) {
    return;
  }

  await qdrant.createCollection(QDRANT_COLLECTION, {
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
  });

  console.log(`Qdrant collection created: ${QDRANT_COLLECTION}`);
}

export async function recreateQdrantCollection() {
  const collections = await qdrant.getCollections();

  const exists = collections.collections.some(
    (collection) => collection.name === QDRANT_COLLECTION,
  );

  if (exists) {
    await qdrant.deleteCollection(QDRANT_COLLECTION);
  }

  await ensureQdrantCollection();
}
