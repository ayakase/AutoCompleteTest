import { upsertQuestion } from "../services/upsert.js";

export default async function upsertRoutes(app) {
  app.post("/api/upsert", async (request, reply) => {
    const { question } = request.body ?? {};

    if (typeof question !== "string" || !question.trim()) {
      return reply.code(400).send({
        error: "A non-empty question is required",
      });
    }

    return {
      success: true,
      ...(await upsertQuestion(question.trim())),
    };
  });
}
