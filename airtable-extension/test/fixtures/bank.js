// Builds a question bank from the bundled web-app data, shaped like the Airtable table rows,
// so tests exercise the same createQuestionBank path the extension uses at runtime.
import {QBANK} from '../../frontend/lib/data/questionBank.data.js';
import {createQuestionBank} from '../../frontend/lib/questionBank.js';

export const competencyRows = [...new Map(QBANK.map((q) => [q.competency, q.group])).entries()]
  .map(([name, group], i) => ({id: `comp${i}`, name, group, active: true}));

const idByName = new Map(competencyRows.map((c) => [c.name, c.id]));
const orderIn = new Map();
export const questionRows = QBANK.map((q, i) => {
  const order = (orderIn.get(q.competency) ?? 0) + 1;
  orderIn.set(q.competency, order);
  return {id: `q${i}`, text: q.question, competencyId: idByName.get(q.competency), order, active: true};
});

export const bank = createQuestionBank(competencyRows, questionRows);
