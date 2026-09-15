import { Client } from "@elastic/elasticsearch";

import { ELASTICSEARCH_URL, ELASTICSEARCH_INDEX } from "../config.js";

export const elasticsearch = new Client({
  node: ELASTICSEARCH_URL,
});

export async function ensureElasticsearchIndex() {
  const exists = await elasticsearch.indices.exists({
    index: ELASTICSEARCH_INDEX,
  });

  if (exists) {
    return;
  }

  await elasticsearch.indices.create({
    index: ELASTICSEARCH_INDEX,

    mappings: {
      properties: {
        text: {
          type: "search_as_you_type",
        },
      },
    },
  });

  console.log(`Elasticsearch index created: ${ELASTICSEARCH_INDEX}`);
}

export async function recreateElasticsearchIndex() {
  const exists = await elasticsearch.indices.exists({
    index: ELASTICSEARCH_INDEX,
  });

  if (exists) {
    await elasticsearch.indices.delete({
      index: ELASTICSEARCH_INDEX,
    });
  }

  await ensureElasticsearchIndex();
}
