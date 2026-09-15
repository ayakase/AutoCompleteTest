import { OPENROUTER_API_KEY, EMBEDDING_MODEL } from "../config.js";

export async function embedText(text) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Embedding API error ${response.status}: ${body}`);
  }

  const data = await response.json();

  return data.data[0].embedding;
}
