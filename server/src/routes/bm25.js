import { DEFAULT_SEARCH_LIMIT } from "../config.js";

import { searchBm25 } from "../services/search/bm25.js";

export default async function bm25Routes(app) {
  app.get("/api/bm25", async (request) => {
    const { q = "", limit = DEFAULT_SEARCH_LIMIT } = request.query;

    if (!q.trim()) {
      return {
        results: [],
      };
    }

    return {
      results: await searchBm25(q.trim(), Number(limit)),
    };
  });
}
