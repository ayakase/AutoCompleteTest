import { DEFAULT_SEARCH_LIMIT } from "../../config.js";
import { pineconeSearchFts } from "../../infrastructure/pinecone.js";

export async function searchPinecone(
  queryText,
  limit = DEFAULT_SEARCH_LIMIT,
) {
  return pineconeSearchFts(queryText, limit);
}
