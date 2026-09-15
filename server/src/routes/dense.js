import { DEFAULT_SEARCH_LIMIT } from "../config.js";

import { searchDense } from "../services/search/dense.js";

export default async function denseRoutes(app) {
  app.get("/api/dense", async (request) => {
    const { q = "", limit = DEFAULT_SEARCH_LIMIT } = request.query;

    if (!q.trim()) {
      return {
        results: [],
      };
    }

    return {
      results: await searchDense(q.trim(), Number(limit)),
    };
  });
}
