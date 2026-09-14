import { elasticsearch } from "../elasticsearch.js";

import { ELASTICSEARCH_INDEX } from "../config.js";

export async function elasticsearchSearch(queryText, limit = 5) {
  const result = await elasticsearch.search({
    index: ELASTICSEARCH_INDEX,

    size: limit,

    query: {
      multi_match: {
        query: queryText,

        type: "bool_prefix",

        fields: ["text", "text._2gram", "text._3gram"],
      },
    },
  });

  return result.hits.hits.map((hit) => ({
    id: hit._id,
    text: hit._source?.text,
    score: hit._score,
  }));
}

export default async function elasticsearchRoutes(app) {
  app.get("/api/elasticsearch", async (request) => {
    const { q = "", limit = 5 } = request.query;

    if (!q.trim()) {
      return {
        results: [],
      };
    }

    return {
      results: await elasticsearchSearch(q.trim(), Number(limit)),
    };
  });
}
