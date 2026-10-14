import {QBANK} from './data/questionBank.data.js';

export {QBANK};
export const LEADERSHIP_GROUP = 'Leadership Capabilities';
export const BEHAVIORAL_GROUP = 'Behavioral Skills';

const namesIn = (group) =>
  [...new Set(QBANK.filter((q) => q.group === group).map((q) => q.competency))].sort();

export const LEADERSHIP = namesIn(LEADERSHIP_GROUP);
export const BEHAVIORAL = namesIn(BEHAVIORAL_GROUP);

export function questionsFor(competency) {
  return QBANK.filter((q) => q.competency === competency).map((q) => q.question);
}

export function groupOf(competency) {
  return QBANK.find((q) => q.competency === competency)?.group ?? '';
}

export function isKnownQuestion(competency, text) {
  return questionsFor(competency).includes(text);
}
