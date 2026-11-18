const norm = (value) => (value ?? '').toString().toLowerCase().trim();

export const OPEN_STATUS = 'Open';

// 0 = open and mine (recruiter or CES), 1 = other open, 2 = everything else.
function rank(req, userId) {
  if (req.status !== OPEN_STATUS) return 2;
  const mine = Boolean(userId) && (req.recruiterId === userId || req.cesId === userId);
  return mine ? 0 : 1;
}

export function filterRequisitions(reqs, query, {userId = null, limit = 20} = {}) {
  const q = norm(query);
  if (!q) return [];
  return reqs
    .filter((r) => norm(r.positionTitle).includes(q) || norm(r.reqNumber).includes(q))
    .map((r, index) => ({req: r, index, tier: rank(r, userId)}))
    .sort((a, b) => a.tier - b.tier || a.index - b.index)
    .slice(0, limit)
    .map(({req, tier}) => ({...req, isMine: tier === 0}));
}

export function filterGuides(guides, query) {
  const q = norm(query);
  const newestFirst = [...guides].sort((a, b) => b.createdTime - a.createdTime);
  if (!q) return newestFirst;
  return newestFirst.filter((g) => [g.name, g.positionTitle, g.reqNumber].some((v) => norm(v).includes(q)));
}
