import {describe, it, expect} from 'vitest';
import {copyQuestionsText} from '../frontend/lib/copyText.js';

describe('copyQuestionsText', () => {
  it('lists each competency with its panelist and questions', () => {
    const text = copyQuestionsText({
      v: 1, brandOverride: null,
      competencies: [
        {name: 'Teamwork', panelist: 'Ana', questions: ['Q1'], customQuestions: ['HM q']},
        {name: 'Initiative', panelist: 'Ben', questions: ['Q2'], customQuestions: []},
      ],
    });
    expect(text).toBe('Teamwork (Ana)\n- Q1\n- HM q\n\nInitiative (Ben)\n- Q2');
  });
});
