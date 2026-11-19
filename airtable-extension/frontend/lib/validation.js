export function findProblems({panelists, selections, brandKey}) {
  const named = panelists.map((p) => p.trim()).filter(Boolean);
  const problems = [];
  if (!brandKey) problems.push('Pick a brand template.');
  if (!named.length) problems.push('Add at least one panelist.');
  if (!selections.competencies.length) problems.push('Pick at least one competency.');
  for (const c of selections.competencies) {
    if (!c.questions.length && !c.customQuestions.length) problems.push(`${c.name}: pick at least one question.`);
    if (!named.includes(c.panelist)) problems.push(`${c.name}: assign a panelist.`);
  }
  return problems;
}
