import { recreateIndexes } from "../services/indexing.js";

export default async function recreateRoutes(app) {
  app.post("/api/recreate", async () => recreateIndexes());
}
