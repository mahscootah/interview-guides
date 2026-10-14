import {describe, it, expect} from 'vitest';
import {QBANK, LEADERSHIP, BEHAVIORAL, questionsFor, groupOf, isKnownQuestion} from '../frontend/lib/questionBank.js';

describe('question bank', () => {
  it('matches the web app: 273 questions, 12 leadership, 30 behavioral', () => {
    expect(QBANK).toHaveLength(273);
    expect(LEADERSHIP).toHaveLength(12);
    expect(BEHAVIORAL).toHaveLength(30);
    expect(LEADERSHIP).toEqual([...LEADERSHIP].sort());
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
