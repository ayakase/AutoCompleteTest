export async function bm25Search(qdrant, collection, queryText, limit = 5) {
  const result = await qdrant.query(collection, {
    query: {
      text: queryText,
      model: "qdrant/bm25",
    },
    using: "bm25",
    limit,
    with_payload: true,
  });

  return result.points.map((point) => ({
    id: point.id,
    text: point.payload?.text,
    score: point.score,
  }));
}