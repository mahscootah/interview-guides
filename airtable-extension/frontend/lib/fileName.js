const UNSAFE = /[\\/:*?"<>|\u0000-\u001f]/g;
const MAX_TITLE = 120;

function clean(text) {
  return (text ?? '').replace(UNSAFE, '').replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE).trim();
}

export function guideFileName(positionTitle, round) {
  const parts = [clean(positionTitle), clean(round)].filter(Boolean);
  return parts.length ? `${parts.join(' - ')} Interview Guide.docx` : 'Interview Guide.docx';
}

export function defaultGuideName(positionTitle, round) {
  return `${(positionTitle ?? '').trim()} – ${round}`;
}
