import {describe, it, expect} from 'vitest';
import {createQuestionBank, LEADERSHIP_GROUP, BEHAVIORAL_GROUP} from '../frontend/lib/questionBank.js';
import {QBANK} from '../frontend/lib/data/questionBank.data.js';
import {bank} from './fixtures/bank.js';

const comps = [
  {id: 'c1', name: 'Accountability', group: LEADERSHIP_GROUP, active: true},
  {id: 'c2', name: 'Teamwork', group: BEHAVIORAL_GROUP, active: true},
  {id: 'c3', name: 'Retired Skill', group: BEHAVIORAL_GROUP, active: false},
  {id: 'c4', name: 'Ambiguity', group: BEHAVIORAL_GROUP, active: true},
];
const qs = [
  {id: 'q1', text: 'Second', competencyId: 'c1', order: 2, active: true},
  {id: 'q2', text: 'First', competencyId: 'c1', order: 1, active: true},
  {id: 'q3', text: 'Hidden', competencyId: 'c1', order: 3, active: false},
  {id: 'q4', text: 'Team Q', competencyId: 'c2', order: 1, active: true},
  {id: 'q5', text: 'Retired Q', competencyId: 'c3', order: 1, active: true},
  {id: 'q6', text: 'Orphan', competencyId: null, order: 1, active: true},
  {id: 'q7', text: '  Padded  ', competencyId: 'c4', order: null, active: true},
];

describe('createQuestionBank', () => {
  const b = createQuestionBank(comps, qs);

  it('lists active competencies by group, alphabetically', () => {
    expect(b.LEADERSHIP).toEqual(['Accountability']);
    expect(b.BEHAVIORAL).toEqual(['Ambiguity', 'Teamwork']);
  });

  it('lists active questions for a competency in Order', () => {
    expect(b.questionsFor('Accountability')).toEqual(['First', 'Second']);
    expect(b.questionsFor('Ambiguity')).toEqual(['Padded']);
    expect(b.questionsFor('Retired Skill')).toEqual([]);
    expect(b.questionsFor('Not a competency')).toEqual([]);
  });

  it('knows groups and questions', () => {
    expect(b.groupOf('Accountability')).toBe(LEADERSHIP_GROUP);
    expect(b.groupOf('Teamwork')).toBe(BEHAVIORAL_GROUP);
    expect(b.groupOf('Not a competency')).toBe('');
    expect(b.isKnownQuestion('Accountability', 'First')).toBe(true);
    expect(b.isKnownQuestion('Accountability', 'Hidden')).toBe(false);
    expect(b.isKnownQuestion('Accountability', 'Made up')).toBe(false);
  });

  it('is empty when the tables are empty', () => {
    const empty = createQuestionBank([], []);
    expect(empty.LEADERSHIP).toEqual([]);
    expect(empty.questionCount).toBe(0);
  });
});

describe('seed data (bundled copy used to fill the Airtable tables)', () => {
  it('matches the web app: 273 questions, 12 leadership, 30 behavioral', () => {
    expect(bank.questionCount).toBe(273);
    expect(bank.LEADERSHIP).toHaveLength(12);
    expect(bank.BEHAVIORAL).toHaveLength(30);
    expect(bank.questionsFor('Accountability')[0]).toMatch(/^Tell me about a time you had to monitor the progress/);
  });

  it('has no words split by stray spaces and no space before punctuation', () => {
    const fragments = /\b(W hat|a ll|a nd|ch ange|chall enging|circ umstances|communi cating|cr itical|dea l|desc ribe|dra wing|exa mple|identi fied|mak ing|note ffective|outc ome|outco me|perform ance|pri orities|pro ject|requ ired|someth ing|Whatk ind|rein forcement|Ho w)\b/;
    const text = QBANK.flatMap((q) => [q.question, q.definition ?? '']);
    expect(text.filter((s) => fragments.test(s))).toEqual([]);
    expect(text.filter((s) => /\w [,.?;:]/.test(s))).toEqual([]);
  });
});
