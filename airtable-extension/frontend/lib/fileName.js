const UNSAFE = /[\\/:*?"<>|\u0000-\u001f]/g;
const MAX_TITLE = 120;

function clean(text) {
  return (text ?? '').replace(UNSAFE, '').replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE).trim();
}

const pad = (n) => String(n).padStart(2, '0');

// Local date and time, e.g. "2026-10-15 1.05 PM". A dot stands in for the colon, which file names can't hold.
function stamp(at) {
  const hour = at.getHours() % 12 || 12;
  const ampm = at.getHours() < 12 ? 'AM' : 'PM';
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${hour}.${pad(at.getMinutes())} ${ampm}`;
}

// The file name without its time stamp or extension, e.g. "Sr PM - Panel Interview Guide".
export function guideFileBase(positionTitle, round) {
  const parts = [clean(positionTitle), clean(round)].filter(Boolean);
  return parts.length ? `${parts.join(' - ')} Interview Guide` : 'Interview Guide';
}

export function guideFileName(positionTitle, round, at) {
  const base = guideFileBase(positionTitle, round);
  return at ? `${base} ${stamp(at)}.docx` : `${base}.docx`;
}

export function defaultGuideName(positionTitle, round) {
  return `${(positionTitle ?? '').trim()} – ${round}`;
}
