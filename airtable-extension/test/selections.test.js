import {describe, it, expect} from 'vitest';
import {
  emptySelections, serializeSelections, parseSelections, toggleCompetency, toggleQuestion,
  setPanelist, addCustomQuestion, removeCustomQuestion, setBrandOverride,
} from '../frontend/lib/selections.js';
import {questionsFor} from '../frontend/lib/questionBank.js';

const Q0 = questionsFor('Accountability')[0];

describe('selections codec', () => {
  it('round-trips through serialize/parse', () => {
    const sel = toggleQuestion(toggleCompetency(emptySelections(), 'Accountability'), 'Accountability', Q0);
    const {selections, warning} = parseSelections(serializeSelections(sel));
    expect(warning).toBeNull();
    expect(selections).toEqual(sel);
  });

  it('treats blank text as empty picks with no warning', () => {
    expect(parseSelections('')).toEqual({selections: emptySelections(), warning: null});
    expect(parseSelections(null)).toEqual({selections: emptySelections(), warning: null});
  });

  it('resets with a warning on corrupt or truncated JSON', () => {
    const {selections, warning} = parseSelections('{"v":1,"competencies":[{"na');
    expect(selections).toEqual(emptySelections());
    expect(warning).toMatch(/could not be read/);
  });

  it('resets with a warning on an unknown version or shape', () => {
    expect(parseSelections('{"v":2,"competencies":[]}').warning).toMatch(/unsupported/);
    expect(parseSelections('[]').warning).toMatch(/unsupported/);
  });

  it('turns questions no longer in the bank into custom questions and drops junk', () => {
    const text = JSON.stringify({
      v: 1, brandOverride: 5,
      competencies: [
        {name: 'Accountability', panelist: 'A', questions: [Q0, 'Old question'], customQuestions: ['HM q', 7]},
        {nope: true},
      ],
    });
    const {selections} = parseSelections(text);
    expect(selections.brandOverride).toBeNull();
    expect(selections.competencies).toEqual([
      {name: 'Accountability', panelist: 'A', questions: [Q0], customQuestions: ['HM q', 'Old question']},
    ]);
  });
});

describe('selections editors', () => {
  it('toggles competencies without mutating the input', () => {
    const empty = emptySelections();
    const one = toggleCompetency(empty, 'Teamwork');
    expect(empty.competencies).toEqual([]);
    expect(one.competencies).toEqual([{name: 'Teamwork', panelist: '', questions: [], customQuestions: []}]);
    expect(toggleCompetency(one, 'Teamwork').competencies).toEqual([]);
  });

  it('toggles questions, sets panelists, adds and removes custom questions', () => {
    let sel = toggleCompetency(emptySelections(), 'Accountability');
    sel = toggleQuestion(sel, 'Accountability', Q0);
    expect(sel.competencies[0].questions).toEqual([Q0]);
    sel = toggleQuestion(sel, 'Accountability', Q0);
    expect(sel.competencies[0].questions).toEqual([]);
    sel = setPanelist(sel, 'Accountability', 'Jordan');
    sel = addCustomQuestion(sel, 'Accountability', '  HM question  ');
    sel = addCustomQuestion(sel, 'Accountability', '   ');
    expect(sel.competencies[0].panelist).toBe('Jordan');
    expect(sel.competencies[0].customQuestions).toEqual(['HM question']);
    sel = removeCustomQuestion(sel, 'Accountability', 0);
    expect(sel.competencies[0].customQuestions).toEqual([]);
    expect(setBrandOverride(sel, 'prana').brandOverride).toBe('prana');
  });
});
