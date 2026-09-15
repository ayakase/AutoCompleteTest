import { DEFAULT_SEARCH_LIMIT } from "../config.js";

import { searchElasticsearch } from "../services/search/elasticsearch.js";

export default async function elasticsearchRoutes(app) {
  app.get("/api/elasticsearch", async (request) => {
    const { q = "", limit = DEFAULT_SEARCH_LIMIT } = request.query;

    if (!q.trim()) {
      return {
        results: [],
      };
    }

    return {
      results: await searchElasticsearch(q.trim(), Number(limit)),
    };
  });
}
