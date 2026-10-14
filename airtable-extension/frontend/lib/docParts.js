import {
  Paragraph, TextRun, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
} from 'docx';

export const NAVY = '1A1A2E';
export const ORANGE = 'E05C2A';
export const GREY_TEXT = '6B7280';

const line = {style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC'};
export const allBorders = {top: line, bottom: line, left: line, right: line};
export const noBorder = {style: BorderStyle.NONE, size: 0, color: 'FFFFFF'};
export const cellBorder = line;

export function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({text, font: 'Arial', size: opts.size || 20, bold: opts.bold, color: opts.color, italics: opts.italic})],
    spacing: {before: opts.before || 0, after: opts.after ?? 80},
    alignment: opts.align || AlignmentType.LEFT,
  });
}

export function emptyPara() {
  return para('', {after: 40});
}

export function headerPara(text) {
  return new Paragraph({
    children: [new TextRun({text, font: 'Arial', size: 24, bold: true, color: NAVY})],
    spacing: {before: 120, after: 80},
    border: {bottom: {style: BorderStyle.SINGLE, size: 6, color: ORANGE, space: 2}},
  });
}

export function bullet(label, desc, separator = ': ') {
  return new Paragraph({
    children: [
      new TextRun({text: '• ', font: 'Arial', size: 20, bold: true}),
      new TextRun({text: label + separator, font: 'Arial', size: 20, bold: true}),
      new TextRun({text: desc, font: 'Arial', size: 20, italics: true}),
    ],
    spacing: {before: 40, after: 60},
    indent: {left: 360, hanging: 200},
  });
}

export function cell(children, opts = {}) {
  return new TableCell({
    children,
    borders: opts.borders || allBorders,
    width: opts.width ? {size: opts.width, type: WidthType.DXA} : undefined,
    shading: opts.shade ? {fill: opts.shade, type: ShadingType.CLEAR} : undefined,
    verticalAlign: VerticalAlign.TOP,
    columnSpan: opts.span || 1,
    margins: opts.margins || {top: 120, bottom: 120, left: 120, right: 120},
  });
}
