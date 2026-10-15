export const SELECTIONS_VERSION = 1;
const UNREADABLE = 'Saved picks could not be read and were reset.';
const UNSUPPORTED = 'Saved picks are in an unsupported format and were reset.';

export function emptySelections() {
  return {v: SELECTIONS_VERSION, brandOverride: null, competencies: []};
}

export function serializeSelections(selections) {
  return JSON.stringify(selections);
}

const strings = (value) => (Array.isArray(value) ? value.filter((s) => typeof s === 'string') : []);

function normalizeCompetency(raw, bank) {
  const questions = strings(raw.questions);
  return {
    name: raw.name,
    panelist: typeof raw.panelist === 'string' ? raw.panelist : '',
    questions: questions.filter((q) => bank.isKnownQuestion(raw.name, q)),
    customQuestions: [...strings(raw.customQuestions), ...questions.filter((q) => !bank.isKnownQuestion(raw.name, q))],
  };
}

/** Questions no longer in `bank` are kept as custom questions so nothing saved is lost. */
export function parseSelections(text, bank) {
  if (!text || !text.trim()) return {selections: emptySelections(), warning: null};
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return {selections: emptySelections(), warning: UNREADABLE};
  }
  if (!raw || raw.v !== SELECTIONS_VERSION || !Array.isArray(raw.competencies)) {
    return {selections: emptySelections(), warning: UNSUPPORTED};
  }
  const competencies = raw.competencies
    .filter((c) => c && typeof c.name === 'string')
    .map((c) => normalizeCompetency(c, bank));
  const brandOverride = typeof raw.brandOverride === 'string' ? raw.brandOverride : null;
  return {selections: {v: SELECTIONS_VERSION, brandOverride, competencies}, warning: null};
}

function updateCompetency(selections, name, update) {
  return {
    ...selections,
    competencies: selections.competencies.map((c) => (c.name === name ? update(c) : c)),
  };
}

export function toggleCompetency(selections, name) {
  const exists = selections.competencies.some((c) => c.name === name);
  const competencies = exists
    ? selections.competencies.filter((c) => c.name !== name)
    : [...selections.competencies, {name, panelist: '', questions: [], customQuestions: []}];
  return {...selections, competencies};
}

export function toggleQuestion(selections, name, text) {
  return updateCompetency(selections, name, (c) => ({
    ...c,
    questions: c.questions.includes(text) ? c.questions.filter((q) => q !== text) : [...c.questions, text],
  }));
}

export function setPanelist(selections, name, panelist) {
  return updateCompetency(selections, name, (c) => ({...c, panelist}));
}

export function addCustomQuestion(selections, name, text) {
  const trimmed = text.trim();
  if (!trimmed) return selections;
  return updateCompetency(selections, name, (c) => ({...c, customQuestions: [...c.customQuestions, trimmed]}));
}

export function removeCustomQuestion(selections, name, index) {
  return updateCompetency(selections, name, (c) => ({
    ...c,
    customQuestions: c.customQuestions.filter((_, i) => i !== index),
  }));
}

export function setBrandOverride(selections, key) {
  return {...selections, brandOverride: key};
}
