import Fastify from "fastify";
import cors from "@fastify/cors";

import { PORT } from "./config.js";
import { initialize } from "./init.js";

import healthRoutes from "./routes/health.js";
import bm25Routes from "./routes/bm25.js";
import elasticsearchRoutes from "./routes/elasticsearch.js";
import hybridRoutes from "./routes/hybrid.js";
import suggestionRoutes from "./routes/suggestions.js";
import recreateRoutes from "./routes/recreate.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: "http://localhost:5173",
});

await app.register(healthRoutes);
await app.register(bm25Routes);
await app.register(elasticsearchRoutes);
await app.register(hybridRoutes);
await app.register(suggestionRoutes);
await app.register(recreateRoutes);

await initialize();

await app.listen({
  port: PORT,
  host: "0.0.0.0",
});