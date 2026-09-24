import { ELASTICSEARCH_INDEX, QDRANT_COLLECTION } from "../config.js";

import { QUESTIONS } from "../data/questions.js";

import { embedText } from "../infrastructure/embeddings.js";

import {
  elasticsearch,
  recreateElasticsearchIndex,
} from "../infrastructure/elasticsearch.js";

import { qdrant, recreateQdrantCollection } from "../infrastructure/qdrant.js";

export async function seedElasticsearch(questions = QUESTIONS) {
  const operations = [];

  for (let i = 0; i < questions.length; i++) {
    operations.push({
      index: {
        _index: ELASTICSEARCH_INDEX,
        _id: i + 1,
      },
    });

    operations.push({
      text: questions[i],
    });
  }

  if (operations.length === 0) {
    return;
  }

  await elasticsearch.bulk({
    operations,
    refresh: true,
  });

  console.log(`Elasticsearch seeded: ${questions.length} documents`);
}

export async function seedQdrant(questions = QUESTIONS) {
  const points = [];

  for (let i = 0; i < questions.length; i++) {
    const text = questions[i];

    console.log(`Embedding ${i + 1}/${questions.length}: ${text}`);

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

  await qdrant.upsert(QDRANT_COLLECTION, {
    wait: true,
    points,
  });

  console.log(`Qdrant seeded: ${questions.length} documents`);
}

export async function recreateIndexes() {
  const startedAt = performance.now();

  await recreateQdrantCollection();

  await seedQdrant();

  await recreateElasticsearchIndex();

  await seedElasticsearch();

  return {
    success: true,
    documents: QUESTIONS.length,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}
