import { DEFAULT_SEARCH_LIMIT } from "../config.js";

import {
  searchSuggestions,
  UnknownSearchModeError,
} from "../services/search/index.js";

export default async function suggestionRoutes(app) {
  app.get("/api/suggestions", async (request, reply) => {
    const {
      q = "",
      mode = "hybrid",
      limit = DEFAULT_SEARCH_LIMIT,
    } = request.query;

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

    try {
      const results = await searchSuggestions(queryText, mode, resultLimit);

      return {
        mode,
        query: queryText,
        latencyMs: Math.round(performance.now() - startedAt),
        results,
      };
    } catch (error) {
      if (error instanceof UnknownSearchModeError) {
        return reply.code(400).send({
          mode,
          query: queryText,
          error: error.message,
        });
      }

      throw error;
    }
  });
}
