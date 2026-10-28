export function attachedNotice(guideName, {filename, bytes, warning}) {
  const download = {filename, bytes};
  if (warning) return {text: `Guide attached to "${guideName}". ${warning}`, tone: 'problem', download};
  return {text: `Guide attached to "${guideName}" and the requisition ✓`, tone: 'ok', download};
}
