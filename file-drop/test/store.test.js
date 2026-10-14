import {describe, it, expect} from 'vitest';
import {createStore} from '../src/store.js';

describe('createStore', () => {
  it('returns stored bytes by id until the TTL passes', () => {
    let t = 1_000;
    const store = createStore({ttlMs: 600_000, now: () => t});
    const id = store.put(new Uint8Array([1, 2, 3]), 'a.docx');

    expect(id).toMatch(/^[a-f0-9]{32}$/);
    expect(store.get(id).filename).toBe('a.docx');
    expect([...store.get(id).bytes]).toEqual([1, 2, 3]);

    t += 600_000;
    expect(store.get(id)).toBeNull();
    expect(store.size()).toBe(0);
  });

  it('gives each file a different id', () => {
    const store = createStore();
    const a = store.put(new Uint8Array([1]), 'a.docx');
    const b = store.put(new Uint8Array([1]), 'a.docx');
    expect(a).not.toBe(b);
  });

  it('returns null for unknown ids', () => {
    expect(createStore().get('0'.repeat(32))).toBeNull();
  });
});
