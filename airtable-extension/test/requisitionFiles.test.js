import {describe, it, expect} from 'vitest';
import {isGuideFileFor, replaceGuideFile} from '../frontend/lib/requisitionFiles.js';

const req = {positionTitle: 'Sr PM', round: 'Panel'};

describe('isGuideFileFor', () => {
  it('recognises files the builder named for this title and round, with or without a time stamp', () => {
    expect(isGuideFileFor('Sr PM - Panel Interview Guide 2026-10-15 9.41 AM.docx', req)).toBe(true);
    expect(isGuideFileFor('Sr PM - Panel Interview Guide 2026-10-28 12.05 PM.docx', req)).toBe(true);
    expect(isGuideFileFor('Sr PM - Panel Interview Guide.docx', req)).toBe(true);
  });

  it('leaves other rounds, other titles and hand-uploaded files alone', () => {
    expect(isGuideFileFor('Sr PM - Final Interview Guide 2026-10-15 9.41 AM.docx', req)).toBe(false);
    expect(isGuideFileFor('Jr PM - Panel Interview Guide 2026-10-15 9.41 AM.docx', req)).toBe(false);
    expect(isGuideFileFor('Sr PM - Panel Interview Guide (edited).docx', req)).toBe(false);
    expect(isGuideFileFor('Panel guide.docx', req)).toBe(false);
    expect(isGuideFileFor(undefined, req)).toBe(false);
  });

  it('matches titles the file name had to clean up', () => {
    expect(isGuideFileFor('Dir. Product Footwear - Panel Interview Guide 2026-10-15 9.41 AM.docx',
      {positionTitle: 'Dir. Product / Footwear', round: 'Panel'})).toBe(true);
  });
});

describe('replaceGuideFile', () => {
  it('swaps the builder\'s older file for this round for the new one and keeps everything else in order', () => {
    const manual = {id: 'att1', url: 'u1', filename: 'HM notes.docx'};
    const otherRound = {id: 'att2', url: 'u2', filename: 'Sr PM - Final Interview Guide 2026-10-01 1.00 PM.docx'};
    const older = {id: 'att3', url: 'u3', filename: 'Sr PM - Panel Interview Guide 2026-10-01 1.00 PM.docx'};
    const added = {url: 'new', filename: 'Sr PM - Panel Interview Guide 2026-10-28 2.10 PM.docx'};
    const existing = [manual, older, otherRound];
    expect(replaceGuideFile(existing, added, req)).toEqual([manual, otherRound, added]);
    expect(existing).toEqual([manual, older, otherRound]);
  });

  it('adds the file when the field is empty', () => {
    const added = {url: 'new', filename: 'Sr PM - Panel Interview Guide.docx'};
    expect(replaceGuideFile(null, added, req)).toEqual([added]);
  });
});
