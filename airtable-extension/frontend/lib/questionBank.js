export const LEADERSHIP_GROUP = 'Leadership Capabilities';
export const BEHAVIORAL_GROUP = 'Behavioral Skills';

const byOrder = (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity);

/**
 * Builds the question bank from the Competencies and Interview Questions table rows.
 * Inactive competencies and questions are left out; a question whose competency is
 * inactive or missing is left out too.
 */
export function createQuestionBank(competencies, questions) {
  const active = competencies.filter((c) => c.active && c.name.trim());
  const nameById = new Map(active.map((c) => [c.id, c.name.trim()]));
  const groupByName = new Map(active.map((c) => [c.name.trim(), c.group]));
  const textsByName = new Map();
  for (const q of [...questions].filter((q) => q.active && q.text.trim()).sort(byOrder)) {
    const name = nameById.get(q.competencyId);
    if (name) textsByName.set(name, [...(textsByName.get(name) ?? []), q.text.trim()]);
  }
  const namesIn = (group) => [...groupByName].filter(([, g]) => g === group).map(([n]) => n).sort();
  const questionsFor = (name) => textsByName.get(name) ?? [];

  return {
    LEADERSHIP: namesIn(LEADERSHIP_GROUP),
    BEHAVIORAL: namesIn(BEHAVIORAL_GROUP),
    questionCount: [...textsByName.values()].reduce((n, list) => n + list.length, 0),
    questionsFor,
    groupOf: (name) => groupByName.get(name) ?? '',
    isKnownQuestion: (name, text) => questionsFor(name).includes(text),
  };
}
