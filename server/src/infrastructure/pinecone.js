import {
  DEFAULT_SEARCH_LIMIT,
  PINECONE_API_KEY,
  PINECONE_INDEX,
  PINECONE_URL,
} from "../config.js";

const PINECONE_API_VERSION = "2026-07";

let cachedHost = null;

export async function getPineconeHost() {
  if (cachedHost) {
    return cachedHost;
  }

  if (PINECONE_URL && PINECONE_URL !== "your_pinecone_url") {
    let host = PINECONE_URL.trim();
    if (!host.startsWith("http://") && !host.startsWith("https://")) {
      host = `https://${host}`;
    }
    cachedHost = host.replace(/\/+$/, "");
    return cachedHost;
  }

  if (
    PINECONE_INDEX &&
    PINECONE_INDEX !== "your_pinecone_index" &&
    PINECONE_API_KEY &&
    PINECONE_API_KEY !== "your_pinecone_api_key"
  ) {
    const response = await fetch(
      `https://api.pinecone.io/indexes/${PINECONE_INDEX}`,
      {
        headers: {
          "Api-Key": PINECONE_API_KEY,
          "X-Pinecone-Api-Version": PINECONE_API_VERSION,
        },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to resolve Pinecone index host (${response.status}): ${body}`,
      );
    }

    const data = await response.json();
    if (!data.host) {
      throw new Error(`Pinecone index description did not contain host`);
    }

    cachedHost = `https://${data.host}`;
    return cachedHost;
  }

  throw new Error(
    "Pinecone is not configured. Please set PINECONE_API_KEY and PINECONE_URL (or PINECONE_INDEX) in server/.env",
  );
}

function getPineconeHeaders() {
  if (!PINECONE_API_KEY || PINECONE_API_KEY === "your_pinecone_api_key") {
    throw new Error(
      "PINECONE_API_KEY is not configured in server/.env",
    );
  }

  return {
    "Api-Key": PINECONE_API_KEY,
    "Content-Type": "application/json",
    "X-Pinecone-Api-Version": PINECONE_API_VERSION,
  };
}

export async function pineconeSearchFts(
  queryText,
  limit = DEFAULT_SEARCH_LIMIT,
) {
  const host = await getPineconeHost();
  const headers = getPineconeHeaders();

  const response = await fetch(
    `${host}/namespaces/__default__/documents/search`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        include_fields: ["text"],
        score_by: [
          {
            type: "text",
            fields: ["text", "text_prefix"],
            query: queryText,
          },
        ],
        top_k: limit,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Pinecone FTS search error ${response.status}: ${body}`,
    );
  }

  const data = await response.json();

  return (data.matches || []).map((match) => ({
    id: match._id,
    text: match.text ?? match.fields?.text ?? "",
    score: match._score ?? match.score ?? 0,
  }));
}

export async function pineconeUpsertDocuments(documents) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return { upserted_count: 0 };
  }

  const host = await getPineconeHost();
  const headers = getPineconeHeaders();

  const response = await fetch(
    `${host}/namespaces/__default__/documents/upsert`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        documents,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Pinecone upsert error ${response.status}: ${body}`,
    );
  }

  return response.json();
}
