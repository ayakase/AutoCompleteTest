import { ELASTICSEARCH_INDEX } from "../../config.js";

import { elasticsearch } from "../../infrastructure/elasticsearch.js";

export async function searchElasticsearch(queryText, limit = 5) {
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
