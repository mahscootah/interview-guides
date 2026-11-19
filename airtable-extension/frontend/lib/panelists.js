export function parsePanelists(text) {
  return (text ?? '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

export function formatPanelists(list) {
  return list.map((s) => s.trim()).filter(Boolean).join('\n');
}

export function initialPanelists(text, count) {
  const saved = parsePanelists(text);
  if (saved.length) return saved;
  return new Array(Math.max(1, count || 0)).fill('');
}
