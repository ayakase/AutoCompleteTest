import { bm25Search } from "./bm25.js";

import { elasticsearchSearch } from "./elasticsearch.js";

import { hybridSearch } from "./hybrid.js";

export default async function suggestionRoutes(app) {
  app.get("/api/suggestions", async (request) => {
    const { q = "", mode = "hybrid", limit = 5 } = request.query;

    const queryText = q.trim();
    const resultLimit = Number(limit);

    if (!queryText) {
      return {
        mode,
        query: "",
        latencyMs: 0,
        results: [],
      };
    }

    const startedAt = performance.now();

    let results;

    switch (mode) {
      case "bm25":
        results = await bm25Search(queryText, resultLimit);
        break;

      case "elasticsearch":
        results = await elasticsearchSearch(queryText, resultLimit);
        break;

      case "hybrid":
        results = await hybridSearch(queryText, resultLimit);
        break;

      default:
        return app.httpErrors.badRequest(`Unknown search mode: ${mode}`);
    }

    return {
      mode,
      query: queryText,
      latencyMs: Math.round(performance.now() - startedAt),
      results,
    };
  });
}
