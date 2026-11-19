// How long to wait for a just-created guide to show up in the records before calling it missing.
export const NEW_GUIDE_WAIT_MS = 15000;

// Decides what the app shows for the guide named in the URL. A guide created a moment ago can
// be absent from useRecords for a short while, so it is "waiting", not "missing".
export function resolveGuide({requestedId, guides, loaded, pendingId}) {
  if (!requestedId) return {status: 'none'};
  const guide = guides.find((g) => g.id === requestedId);
  if (guide) return {status: 'open', guide};
  if (!loaded) return {status: 'loading'};
  if (requestedId === pendingId) return {status: 'waiting'};
  return {status: 'missing'};
}
