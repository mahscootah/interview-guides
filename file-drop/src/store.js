import {randomBytes} from 'node:crypto';

const TEN_MINUTES_MS = 10 * 60 * 1000;
const HUNDRED_MB = 100 * 1024 * 1024;

/**
 * In-memory file store whose entries expire. Nothing is written to disk.
 * Refuses new files (put → null) while the stored total would exceed maxTotalBytes.
 * @param {{ttlMs?: number, now?: () => number, maxTotalBytes?: number}} [options]
 */
export function createStore({ttlMs = TEN_MINUTES_MS, now = () => Date.now(), maxTotalBytes = HUNDRED_MB} = {}) {
  let entries = new Map();

  function sweep() {
    const t = now();
    entries = new Map([...entries].filter(([, entry]) => entry.expiresAt > t));
  }

  return {
    put(bytes, filename) {
      sweep();
      const stored = [...entries.values()].reduce((sum, entry) => sum + entry.bytes.length, 0);
      if (stored + bytes.length > maxTotalBytes) return null;
      const id = randomBytes(16).toString('hex');
      entries = new Map(entries).set(id, {bytes, filename, expiresAt: now() + ttlMs});
      return id;
    },
    get(id) {
      sweep();
      return entries.get(id) ?? null;
    },
    size() {
      sweep();
      return entries.size;
    },
  };
}
