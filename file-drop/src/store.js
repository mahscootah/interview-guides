import {randomBytes} from 'node:crypto';

const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * In-memory file store whose entries expire. Nothing is written to disk.
 * @param {{ttlMs?: number, now?: () => number}} [options]
 */
export function createStore({ttlMs = TEN_MINUTES_MS, now = () => Date.now()} = {}) {
  let entries = new Map();

  function sweep() {
    const t = now();
    entries = new Map([...entries].filter(([, entry]) => entry.expiresAt > t));
  }

  return {
    put(bytes, filename) {
      sweep();
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
