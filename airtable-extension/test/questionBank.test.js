import {describe, it, expect} from 'vitest';
import {QBANK, LEADERSHIP, BEHAVIORAL, questionsFor, groupOf, isKnownQuestion} from '../frontend/lib/questionBank.js';

describe('question bank', () => {
  it('matches the web app: 273 questions, 12 leadership, 30 behavioral', () => {
    expect(QBANK).toHaveLength(273);
    expect(LEADERSHIP).toHaveLength(12);
    expect(BEHAVIORAL).toHaveLength(30);
    expect(LEADERSHIP).toEqual([...LEADERSHIP].sort());
  });

  it('has no words split by stray spaces and no space before punctuation', () => {
    const fragments = /\b(W hat|a ll|a nd|ch ange|chall enging|circ umstances|communi cating|cr itical|dea l|desc ribe|dra wing|exa mple|identi fied|mak ing|note ffective|outc ome|outco me|perform ance|pri orities|pro ject|requ ired|someth ing|Whatk ind|rein forcement|Ho w)\b/;
    const text = QBANK.flatMap((q) => [q.question, q.definition ?? '']);
    expect(text.filter((s) => fragments.test(s))).toEqual([]);
    expect(text.filter((s) => /\w [,.?;:]/.test(s))).toEqual([]);
  });

  it('lists questions for a competency in bank order', () => {
    const qs = questionsFor('Accountability');
    expect(qs).toHaveLength(7);
    expect(qs[0]).toMatch(/^Tell me about a time you had to monitor the progress/);
  });

  it('knows groups and questions', () => {
    expect(groupOf('Accountability')).toBe('Leadership Capabilities');
    expect(groupOf('Teamwork')).toBe('Behavioral Skills');
    expect(groupOf('Not a competency')).toBe('');
    expect(isKnownQuestion('Accountability', questionsFor('Accountability')[0])).toBe(true);
    expect(isKnownQuestion('Accountability', 'Made up')).toBe(false);
    expect(questionsFor('Not a competency')).toEqual([]);
  });
});
