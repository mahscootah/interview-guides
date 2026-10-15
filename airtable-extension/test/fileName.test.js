import {describe, it, expect} from 'vitest';
import {guideFileName, defaultGuideName} from '../frontend/lib/fileName.js';

describe('guideFileName', () => {
  it('stamps the local date and time when given one, so repeat files differ', () => {
    expect(guideFileName('Sr Product Manager', 'Panel', new Date(2026, 9, 15, 13, 5)))
      .toBe('Sr Product Manager - Panel Interview Guide 2026-10-15 1.05 PM.docx');
    expect(guideFileName('Sr Product Manager', 'Final', new Date(2026, 0, 2, 0, 30)))
      .toBe('Sr Product Manager - Final Interview Guide 2026-01-02 12.30 AM.docx');
  });

  it('uses title and round', () => {
    expect(guideFileName('Sr Product Manager', 'Panel')).toBe('Sr Product Manager - Panel Interview Guide.docx');
  });

  it('strips characters not allowed in file names and collapses spaces', () => {
    expect(guideFileName('Mgr, Ops/Finance: "EMEA"  *', 'Final')).toBe('Mgr, OpsFinance EMEA - Final Interview Guide.docx');
  });

  it('caps very long titles at 120 characters', () => {
    const name = guideFileName('A'.repeat(300), 'Panel');
    expect(name).toBe(`${'A'.repeat(120)} - Panel Interview Guide.docx`);
  });

  it('falls back when title or round is empty', () => {
    expect(guideFileName('///', '')).toBe('Interview Guide.docx');
  });
});

describe('defaultGuideName', () => {
  it('joins title and round with an en dash', () => {
    expect(defaultGuideName(' Sr PM ', 'Second Panel')).toBe('Sr PM – Second Panel');
  });
});
