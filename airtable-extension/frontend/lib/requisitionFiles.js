import {guideFileBase} from './fileName.js';

const STAMP = ' \\d{4}-\\d{2}-\\d{2} \\d{1,2}\\.\\d{2} [AP]M';
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// True only for names the builder itself gives this title and round, so hand-uploaded files are never matched.
export function isGuideFileFor(filename, {positionTitle, round}) {
  const pattern = new RegExp(`^${escape(guideFileBase(positionTitle, round))}(${STAMP})?\\.docx$`);
  return pattern.test(filename ?? '');
}

// The requisition keeps one builder file per round: the new file replaces the older one; other files stay.
export function replaceGuideFile(existing, file, requisition) {
  return [...(existing ?? []).filter((f) => !isGuideFileFor(f.filename, requisition)), file];
}
