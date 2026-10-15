import {describe, it, expect, vi} from 'vitest';
import {generateGuide} from '../frontend/lib/generateGuide.js';

const header = {positionTitle: 'Sr PM', reqNumber: 'R-1', hiringManager: 'HM', format: 'In-Person', round: 'Panel', brandKey: 'columbia'};
const selections = {v: 1, brandOverride: null, competencies: [{name: 'Teamwork', panelist: 'Ana', questions: ['Q'], customQuestions: []}]};
const input = {header, panelists: ['Ana'], selections, existingFiles: [{id: 'att1', url: 'old', filename: 'old.docx'}]};

function deps(over = {}) {
  const calls = [];
  const track = (name, value) => vi.fn(async (...args) => { calls.push(name); return typeof value === 'function' ? value(...args) : value; });
  return {
    calls,
    deps: {
      savePicks: track('savePicks'),
      buildDocx: track('buildDocx', new Uint8Array([9])),
      upload: track('upload', 'https://d/files/new'),
      saveGenerated: track('saveGenerated'),
      ...over,
    },
  };
}

describe('generateGuide', () => {
  it('stamps the file name with the generation time when one is given', async () => {
    const {deps: d} = deps();
    const result = await generateGuide({input: {...input, generatedAt: new Date(2026, 9, 15, 9, 41)}, deps: d});
    expect(result).toEqual({status: 'attached', filename: 'Sr PM - Panel Interview Guide 2026-10-15 9.41 AM.docx'});
    expect(d.upload).toHaveBeenCalledWith(new Uint8Array([9]), 'Sr PM - Panel Interview Guide 2026-10-15 9.41 AM.docx');
  });

  it('saves picks before building, then uploads and appends the attachment', async () => {
    const {calls, deps: d} = deps();
    const result = await generateGuide({input, deps: d});
    expect(result).toEqual({status: 'attached', filename: 'Sr PM - Panel Interview Guide.docx'});
    expect(calls).toEqual(['savePicks', 'buildDocx', 'upload', 'saveGenerated']);
    expect(d.saveGenerated).toHaveBeenCalledWith([
      {id: 'att1', url: 'old', filename: 'old.docx'},
      {url: 'https://d/files/new', filename: 'Sr PM - Panel Interview Guide.docx'},
    ]);
  });

  it('returns problems and does nothing when the guide is incomplete', async () => {
    const {calls, deps: d} = deps();
    const result = await generateGuide({input: {...input, panelists: []}, deps: d});
    expect(result.status).toBe('invalid');
    expect(result.problems).toContain('Add at least one panelist.');
    expect(calls).toEqual([]);
  });

  it('falls back to a download when upload fails, keeping saved picks', async () => {
    const {calls, deps: d} = deps({upload: vi.fn(async () => { throw new Error('unreachable'); })});
    const result = await generateGuide({input, deps: d});
    expect(result).toEqual({status: 'download', filename: 'Sr PM - Panel Interview Guide.docx', bytes: new Uint8Array([9]), error: 'unreachable'});
    expect(calls).toEqual(['savePicks', 'buildDocx']);
  });

  it('falls back to a download when Airtable rejects the attachment', async () => {
    const {deps: d} = deps({saveGenerated: vi.fn(async () => { throw new Error('No permission'); })});
    const result = await generateGuide({input, deps: d});
    expect(result.status).toBe('download');
    expect(result.error).toBe('No permission');
  });

  it('still builds and offers a download when saving picks fails', async () => {
    const {calls, deps: d} = deps({savePicks: vi.fn(async () => { throw new Error('No permission'); })});
    const result = await generateGuide({input, deps: d});
    expect(result).toEqual({
      status: 'download', filename: 'Sr PM - Panel Interview Guide.docx', bytes: new Uint8Array([9]),
      error: 'Your picks were not saved (No permission)',
    });
    expect(calls).toEqual(['buildDocx']);
  });
});
