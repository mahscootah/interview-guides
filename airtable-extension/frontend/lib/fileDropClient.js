export const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const RETRYABLE = new Set([502, 503, 504]);

export class FileDropError extends Error {}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createFileDropClient({
  baseUrl, fetchImpl = (...args) => fetch(...args), sleep = defaultSleep, now = () => Date.now(), maxWaitMs = 60_000,
}) {
  async function withRetry(request) {
    const deadline = now() + maxWaitMs;
    let delay = 1000;
    for (;;) {
      let response = null;
      try {
        response = await request();
        if (!RETRYABLE.has(response.status)) return response;
      } catch {
        response = null;
      }
      if (now() + delay > deadline) {
        throw new FileDropError('The file service did not respond. Try again in a minute.');
      }
      await sleep(delay);
      delay = Math.min(delay * 2, 8000);
    }
  }

  return {
    async wake() {
      try {
        await fetchImpl(`${baseUrl}/health`);
        return true;
      } catch {
        return false;
      }
    },
    async upload(bytes, filename) {
      const response = await withRetry(() => fetchImpl(`${baseUrl}/files?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: {'Content-Type': DOCX_TYPE},
        body: bytes,
      }));
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.url) throw new FileDropError(body.error || `Upload failed (${response.status}).`);
      return body.url;
    },
  };
}
