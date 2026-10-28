import {DOCX_TYPE} from './fileDropClient.js';

// Safari and Firefox can cancel a download whose blob URL is revoked straight after click(), so free it a little later.
const REVOKE_AFTER_MS = 30_000;

export function downloadBytes(bytes, filename) {
  const url = URL.createObjectURL(new Blob([bytes], {type: DOCX_TYPE}));
  const a = Object.assign(document.createElement('a'), {href: url, download: filename});
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}
