import { DEFAULT_SEARCH_LIMIT } from "../config.js";
import { searchPinecone } from "../services/search/pinecone.js";
import {
  upsertPineconeQuestion,
  seedPineconeQuestions,
} from "../services/pineconeUpsert.js";

export default async function pineconeRoutes(app) {
  // Direct search endpoint for Pinecone FTS
  app.get("/api/pinecone", async (request) => {
    const { q = "", limit = DEFAULT_SEARCH_LIMIT } = request.query;

    if (!q.trim()) {
      return {
        results: [],
      };
    }

    return {
      results: await searchPinecone(q.trim(), Number(limit)),
    };
  });

  // Dedicated upsert endpoint for Pinecone
  app.post("/api/pinecone/upsert", async (request, reply) => {
    const { question, text, questions } = request.body ?? {};

    // Support batch array in questions
    if (Array.isArray(questions) && questions.length > 0) {
      const validQuestions = questions
        .filter((q) => typeof q === "string" && q.trim())
        .map((q) => q.trim());

      const result = await seedPineconeQuestions(validQuestions);
      return {
        success: true,
        ...result,
      };
    }

    const singleQuestion = (question ?? text ?? "").trim();
    if (!singleQuestion) {
      return reply.code(400).send({
        error: "A non-empty question is required",
      });
    }

    const result = await upsertPineconeQuestion(singleQuestion);
    return {
      success: true,
      ...result,
    };
  });

  // Dedicated seed endpoint for Pinecone (all dataset questions)
  app.post("/api/pinecone/seed", async () => {
    return seedPineconeQuestions();
  });
}
