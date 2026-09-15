import { searchBm25 } from "../services/search/bm25.js";

export default async function bm25Routes(app) {
  app.get("/api/bm25", async (request) => {
    const { q = "", limit = 5 } = request.query;

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
