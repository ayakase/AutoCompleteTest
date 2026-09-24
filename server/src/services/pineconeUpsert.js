import { QUESTIONS } from "../data/questions.js";
import { pineconeUpsertDocuments } from "../infrastructure/pinecone.js";
import { questionDocId } from "./upsert.js";

export async function upsertPineconeQuestion(text) {
  const id = questionDocId(text);

  await pineconeUpsertDocuments([
    {
      _id: id,
      text,
      text_prefix: text,
    },
  ]);

  console.log(`Question upserted to Pinecone: ${text}`);

  return {
    id,
    text,
  };
}

export async function seedPineconeQuestions(questions = QUESTIONS) {
  const startedAt = performance.now();
  const documents = questions.map((text) => ({
    _id: questionDocId(text),
    text,
    text_prefix: text,
  }));

  // Batch in chunks of 50 documents
  const CHUNK_SIZE = 50;
  let totalUpserted = 0;

  for (let i = 0; i < documents.length; i += CHUNK_SIZE) {
    const chunk = documents.slice(i, i + CHUNK_SIZE);
    const res = await pineconeUpsertDocuments(chunk);
    totalUpserted += res.upserted_count ?? chunk.length;
    console.log(
      `Pinecone seeded batch ${Math.floor(i / CHUNK_SIZE) + 1}: ${chunk.length} documents`,
    );
  }

  return {
    success: true,
    total: questions.length,
    upsertedCount: totalUpserted,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}
