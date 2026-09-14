import {
  recreateQdrantCollection,
  seedQdrant,
} from "../qdrant.js";

import {
  recreateElasticsearchIndex,
  seedElasticsearch,
} from "../elasticsearch.js";

import { embedText } from "../embeddings.js";

import { QUESTIONS } from "../dataset.js";

export default async function recreateRoutes(
  app
) {
  app.post("/api/recreate", async () => {
    const startedAt = performance.now();

    await recreateQdrantCollection();

    await seedQdrant(
      QUESTIONS,
      embedText
    );

    await recreateElasticsearchIndex();

    await seedElasticsearch(QUESTIONS);

    return {
      success: true,
      documents: QUESTIONS.length,
      latencyMs: Math.round(
        performance.now() - startedAt
      ),
    };
  });
}