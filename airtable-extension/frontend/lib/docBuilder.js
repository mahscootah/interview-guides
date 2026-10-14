import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, ImageRun, Header, Footer, PageNumber,
  BorderStyle, WidthType, TabStopType, TabStopPosition,
} from 'docx';
import {LOGOS} from './data/logos.data.js';
import {groupOf, LEADERSHIP_GROUP} from './questionBank.js';
import {
  para, emptyPara, headerPara, bullet, cell, noBorder, cellBorder, NAVY, ORANGE, GREY_TEXT,
} from './docParts.js';

const COLS = [2000, 1800, 3360, 2200]; // competency | panelist | question | notes = 9360
const SCORE_LINE = '  1 – Emerging    2 – Skilled    3 – Highly Skilled    4 – Advanced';
const SCORE_DEFS = [
  ['1', 'Emerging', 'The candidate is actively building the skill and beginning to practice behaviors on the job.'],
  ['2', 'Skilled', 'The candidate has the basics down and consistently demonstrates the skills and behaviors required for the role.'],
  ['3', 'Highly Skilled', 'Candidate has skills beyond what is expected of the role, consistently role models behaviors, and coaches others to increase their capability level.'],
  ['4', 'Advanced', 'Candidate broadly applies skills beyond the role to improve business functions and achieve enterprise results.'],
];
const AGENDA = [
  ['Introductions (5 min)', 'Get settled, introduce yourself, and explain the flow of the interview.'],
  ['Interview Questions', 'Ask questions assigned below to ensure consistency and eliminate potential for bias or duplicative questions. You may ask follow-up questions as needed.'],
  ['Wrap-Up & Questions (5–10 min)', 'Leave time at the end to answer candidate questions about the role, the team, or the company.'],
];
const NEXT_STEPS = [
  ['Prepare', 'Complete the Interview Note-Taking eLearning in Workday prior to conducting phone screens or interviews.'],
  ['Interview Feedback', 'Submit interview feedback in the Workday task that populates in your inbox within 24 hours.'],
  ['Attend Debrief', 'You may be invited to an interview debrief. If so, please attend and be prepared to talk through your interview feedback.'],
];

function base64ToBytes(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

function logoParagraph(brandKey) {
  const logo = LOGOS[brandKey];
  if (!logo) return [];
  return [new Paragraph({
    children: [new ImageRun({
      type: 'png', data: base64ToBytes(logo.base64),
      transformation: {width: logo.width, height: logo.height},
      altText: {title: 'Logo', description: 'Company Logo', name: 'Logo'},
    })],
    spacing: {after: 100},
  })];
}

function scoreTable() {
  const head = SCORE_DEFS.map(([n, label]) => cell([para(`${n} ${label}`, {bold: true, color: 'FFFFFF'})], {shade: NAVY, width: 2340}));
  const defs = SCORE_DEFS.map(([, , def]) => cell([para(def, {size: 18})], {width: 2340}));
  return new Table({
    width: {size: 9360, type: WidthType.DXA},
    columnWidths: [2340, 2340, 2340, 2340],
    rows: [new TableRow({children: head}), new TableRow({children: defs})],
  });
}

function questionRows(competency, question, shade) {
  const isLeadership = groupOf(competency.name) === LEADERSHIP_GROUP;
  const compCell = cell([
    para(competency.name, {bold: true, after: 60}),
    para(isLeadership ? 'Leadership' : 'Behavioral', {size: 16, bold: true, color: isLeadership ? ORANGE : '2563EB', after: 0}),
  ], {width: COLS[0], shade});
  const row = new TableRow({children: [
    compCell,
    cell([para(competency.panelist, {after: 0})], {width: COLS[1], shade}),
    cell([para(question, {after: 0})], {width: COLS[2], shade}),
    cell([para('', {size: 18}), para('', {size: 18}), para('', {size: 18})], {width: COLS[3], shade}),
  ]});
  const score = new TableRow({children: [cell([new Paragraph({children: [
    new TextRun({text: 'Score: ', font: 'Arial', size: 18, bold: true}),
    new TextRun({text: SCORE_LINE, font: 'Arial', size: 18, color: GREY_TEXT}),
  ]})], {span: 4, shade: 'F3F4F6', borders: {top: noBorder, bottom: cellBorder, left: cellBorder, right: cellBorder}, margins: {top: 80, bottom: 80, left: 120, right: 120}})]});
  return [row, score];
}

function questionsTable(selections) {
  const headRow = new TableRow({children: ['Competency', 'Panelist', 'Question', 'Notes'].map((label, i) =>
    cell([para(label, {bold: true, color: 'FFFFFF', size: 18})], {shade: NAVY, width: COLS[i]}))});
  const pairs = selections.competencies.flatMap((c) =>
    [...c.questions, ...c.customQuestions].map((q) => [c, q]));
  const body = pairs.flatMap(([c, q], i) => questionRows(c, q, i % 2 === 0 ? 'F9FAFB' : 'FFFFFF'));
  return new Table({width: {size: 9360, type: WidthType.DXA}, columnWidths: COLS, rows: [headRow, ...body]});
}

function notesTable() {
  const row = (label, lines) => new TableRow({children: [
    cell([para(label, {bold: true, size: 18})], {shade: 'F3F4F6', width: 2400}),
    cell(new Array(lines).fill(null).map(() => para('', {size: 18})), {width: 6960}),
  ]});
  return new Table({
    width: {size: 9360, type: WidthType.DXA},
    columnWidths: [2400, 6960],
    rows: [row('Strengths', 2), row('Opportunities', 2), row('General Notes', 3)],
  });
}

function bodyChildren({header, panelists, selections}) {
  const named = panelists.map((p) => p.trim()).filter(Boolean);
  const facilitator = named[0] || header.hiringManager;
  const meta = [header.reqNumber && `Req # ${header.reqNumber}`, header.round, header.format].filter(Boolean).join(' · ');
  return [
    ...logoParagraph(header.brandKey),
    new Paragraph({
      children: [new TextRun({text: `INTERVIEW GUIDE – ${header.positionTitle.toUpperCase()}`, font: 'Arial', size: 32, bold: true, color: NAVY})],
      spacing: {before: 80, after: 60},
      border: {bottom: {style: BorderStyle.SINGLE, size: 8, color: ORANGE, space: 2}},
    }),
    para(meta, {size: 18, color: GREY_TEXT, before: 80, after: 80}),
    para('Candidate: ____________________     Date: ______________', {size: 18, color: GREY_TEXT, after: 200}),
    headerPara('Agenda'),
    new Paragraph({children: [
      new TextRun({text: facilitator, font: 'Arial', size: 20, bold: true}),
      new TextRun({text: ' — you have been selected as a facilitator. Please lead the Introduction, Wrap Up, and ensure the interview flows smoothly.', font: 'Arial', size: 20}),
    ], spacing: {after: 120}}),
    ...AGENDA.map(([label, desc]) => bullet(label, desc)),
    emptyPara(),
    headerPara('Next Steps'),
    ...NEXT_STEPS.map(([label, desc]) => bullet(label, desc, ' →  ')),
    emptyPara(),
    headerPara('Score Assignments'),
    scoreTable(),
    emptyPara(),
    headerPara('Interview Questions'),
    para(`Interviewers: ${named.join(', ') || header.hiringManager}`, {bold: true, after: 120}),
    questionsTable(selections),
    emptyPara(),
    headerPara('Additional Notes'),
    notesTable(),
  ];
}

function pageHeader(header) {
  return new Header({children: [new Paragraph({
    children: [
      new TextRun({text: `Interview Guide – ${header.positionTitle}`, font: 'Arial', size: 18, color: '9CA3AF'}),
      new TextRun({text: `\t${header.hiringManager}`, font: 'Arial', size: 18, color: '9CA3AF'}),
    ],
    tabStops: [{type: TabStopType.RIGHT, position: TabStopPosition.MAX}],
    border: {bottom: {style: BorderStyle.SINGLE, size: 4, color: 'E2E6EA', space: 2}},
  })]});
}

function pageFooter() {
  return new Footer({children: [new Paragraph({
    children: [
      new TextRun({text: 'Confidential', font: 'Arial', size: 16, color: '9CA3AF', italics: true}),
      new TextRun({children: ['\tPage ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], font: 'Arial', size: 16, color: '9CA3AF'}),
    ],
    tabStops: [{type: TabStopType.RIGHT, position: TabStopPosition.MAX}],
    border: {top: {style: BorderStyle.SINGLE, size: 4, color: 'E2E6EA', space: 2}},
  })]});
}

/** Builds the panel interview guide. Returns the .docx bytes. */
export async function buildGuideDocx({header, panelists, selections}) {
  const doc = new Document({
    styles: {default: {document: {run: {font: 'Arial', size: 20}}}},
    sections: [{
      properties: {page: {size: {width: 12240, height: 15840}, margin: {top: 1080, right: 1080, bottom: 1080, left: 1080}}},
      headers: {default: pageHeader(header)},
      footers: {default: pageFooter()},
      children: bodyChildren({header, panelists, selections}),
    }],
  });
  return new Uint8Array(await Packer.toArrayBuffer(doc));
}
