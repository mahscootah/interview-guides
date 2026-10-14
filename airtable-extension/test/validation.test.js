import {describe, it, expect} from 'vitest';
import {findProblems} from '../frontend/lib/validation.js';

const comp = (over = {}) => ({name: 'Teamwork', panelist: 'Ana', questions: ['Q'], customQuestions: [], ...over});
const sel = (competencies) => ({v: 1, brandOverride: null, competencies});

describe('findProblems', () => {
  it('passes a complete guide', () => {
    expect(findProblems({panelists: ['Ana'], selections: sel([comp()]), brandKey: 'columbia'})).toEqual([]);
  });

  it('accepts a competency with only hiring-manager questions', () => {
    const c = comp({questions: [], customQuestions: ['HM']});
    expect(findProblems({panelists: ['Ana'], selections: sel([c]), brandKey: 'columbia'})).toEqual([]);
  });

  it('lists every missing piece', () => {
    expect(findProblems({panelists: [' '], selections: sel([]), brandKey: null})).toEqual([
      'Pick a brand template.',
      'Add at least one panelist.',
      'Pick at least one competency.',
    ]);
  });

  it('flags competencies without questions or panelist', () => {
    const c = comp({questions: [], panelist: ''});
    expect(findProblems({panelists: ['Ana'], selections: sel([c]), brandKey: 'sorel'})).toEqual([
      'Teamwork: pick at least one question.',
      'Teamwork: assign a panelist.',
    ]);
  });

  it('flags a competency assigned to a panelist who was removed', () => {
    const c = comp({panelist: 'Ben'});
    expect(findProblems({panelists: ['Ana'], selections: sel([c]), brandKey: 'sorel'})).toEqual([
      'Teamwork: assign a panelist.',
    ]);
  });
});
