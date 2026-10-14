import {describe, it, expect} from 'vitest';
import JSZip from 'jszip';
import {buildGuideDocx} from '../frontend/lib/docBuilder.js';

const header = {
  positionTitle: 'Sr Product Manager', reqNumber: 'R-1001', hiringManager: 'Jamie Lee',
  format: 'Virtual (Microsoft Teams)', round: 'Panel', brandKey: 'sorel',
};
const selections = {
  v: 1, brandOverride: null,
  competencies: [
    {name: 'Accountability', panelist: 'Ben', questions: ['First bank question'], customQuestions: []},
    {name: 'Teamwork', panelist: 'Ana', questions: ['Second bank question'], customQuestions: ['R&D <lead> “quoted” question']},
  ],
};

async function documentXml(bytes) {
  const zip = await JSZip.loadAsync(bytes);
  return {zip, xml: await zip.file('word/document.xml').async('string')};
}

const textOf = (xml) => [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('');
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

describe('buildGuideDocx', () => {
  it('produces a valid docx zip with the brand logo', async () => {
    const bytes = await buildGuideDocx({header, panelists: ['Ana', 'Ben'], selections});
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const {zip} = await documentXml(bytes);
    expect(Object.keys(zip.files).some((f) => f.startsWith('word/media/'))).toBe(true);
  });

  it('includes title, meta line, facilitator, panelists and blank candidate line', async () => {
    const text = decode(textOf((await documentXml(await buildGuideDocx({header, panelists: ['Ana', 'Ben'], selections}))).xml));
    expect(text).toContain('INTERVIEW GUIDE – SR PRODUCT MANAGER');
    expect(text).toContain('Req # R-1001 · Panel · Virtual (Microsoft Teams)');
    expect(text).toContain('Candidate: ____________________');
    expect(text).toContain('Ana — you have been selected as a facilitator.');
    expect(text).toContain('Interviewers: Ana, Ben');
  });

  it('lists questions in selection order with their panelist, escaping special characters', async () => {
    const {xml} = await documentXml(await buildGuideDocx({header, panelists: ['Ana', 'Ben'], selections}));
    const text = decode(textOf(xml));
    const order = ['Accountability', 'First bank question', 'Teamwork', 'Second bank question', 'R&D <lead> “quoted” question'];
    const positions = order.map((s) => text.indexOf(s));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(xml).toContain('R&amp;D &lt;lead&gt;');
  });

  it('falls back to the hiring manager as facilitator when no panelists are named', async () => {
    const text = decode(textOf((await documentXml(await buildGuideDocx({header, panelists: [], selections}))).xml));
    expect(text).toContain('Jamie Lee — you have been selected as a facilitator.');
  });

  it('omits the logo for an unknown brand key', async () => {
    const bytes = await buildGuideDocx({header: {...header, brandKey: 'nope'}, panelists: ['Ana'], selections});
    const {zip} = await documentXml(bytes);
    expect(Object.keys(zip.files).some((f) => f.startsWith('word/media/'))).toBe(false);
  });
});
