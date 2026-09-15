import { ensureQdrantCollection } from "./infrastructure/qdrant.js";

import { ensureElasticsearchIndex } from "./infrastructure/elasticsearch.js";

export async function initialize() {
  await ensureQdrantCollection();

  await ensureElasticsearchIndex();

  console.log("Search infrastructure initialized");
}
