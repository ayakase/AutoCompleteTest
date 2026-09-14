import { ensureQdrantCollection } from "./qdrant.js";

import { ensureElasticsearchIndex } from "./elasticsearch.js";

export async function initialize() {
  await ensureQdrantCollection();

  await ensureElasticsearchIndex();

  console.log("Search infrastructure initialized");
}
