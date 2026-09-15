import { searchHybrid } from "../services/search/hybrid.js";

export default async function hybridRoutes(app) {
  app.get("/api/hybrid", async (request) => {
    const { q = "", limit = 5 } = request.query;

    if (!q.trim()) {
      return {
        results: [],
      };
    }

    return {
      results: await searchHybrid(q.trim(), Number(limit)),
    };
  });
}
