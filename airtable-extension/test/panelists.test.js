import {describe, it, expect} from 'vitest';
import {parsePanelists, formatPanelists, initialPanelists} from '../frontend/lib/panelists.js';

describe('panelists', () => {
  it('parses one name per line, trimming blanks', () => {
    expect(parsePanelists(' Ana \n\n Ben\r\n')).toEqual(['Ana', 'Ben']);
    expect(parsePanelists(null)).toEqual([]);
  });

  it('formats names back to text, skipping blanks', () => {
    expect(formatPanelists(['Ana', ' ', 'Ben '])).toBe('Ana\nBen');
  });

  it('starts from saved names, else # of Panelists empty boxes (min 1)', () => {
    expect(initialPanelists('Ana\nBen', 5)).toEqual(['Ana', 'Ben']);
    expect(initialPanelists('', 3)).toEqual(['', '', '']);
    expect(initialPanelists('', 0)).toEqual(['']);
  });
});
