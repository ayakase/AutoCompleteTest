import { searchBm25 } from "./bm25.js";

import { searchElasticsearch } from "./elasticsearch.js";

import { searchHybrid } from "./hybrid.js";

export class UnknownSearchModeError extends Error {
  constructor(mode) {
    super(
      `Unknown search mode: ${mode} (expected one of: ${SEARCH_MODES.join(", ")})`,
    );

    this.name = "UnknownSearchModeError";
  }
}

const SEARCH_STRATEGIES = {
  bm25: searchBm25,
  elasticsearch: searchElasticsearch,
  hybrid: searchHybrid,
};

export const SEARCH_MODES = Object.keys(SEARCH_STRATEGIES);

export async function searchSuggestions(queryText, mode, limit = 5) {
  const strategy = SEARCH_STRATEGIES[mode];

  if (!strategy) {
    throw new UnknownSearchModeError(mode);
  }

  return strategy(queryText, limit);
}
