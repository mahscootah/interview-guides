const norm = (value) => (value ?? '').toString().toLowerCase().trim();

export function filterRequisitions(reqs, query, limit = 20) {
  const q = norm(query);
  if (!q) return [];
  return reqs
    .filter((r) => norm(r.positionTitle).includes(q) || norm(r.reqNumber).includes(q))
    .slice(0, limit);
}

export function filterGuides(guides, query) {
  const q = norm(query);
  const newestFirst = [...guides].sort((a, b) => b.createdTime - a.createdTime);
  if (!q) return newestFirst;
  return newestFirst.filter((g) => [g.name, g.positionTitle, g.reqNumber].some((v) => norm(v).includes(q)));
}
