import {describe, it, expect, vi} from 'vitest';
import {createFileDropClient, FileDropError, DOCX_TYPE} from '../frontend/lib/fileDropClient.js';

const jsonResponse = (status, body) => ({status, ok: status >= 200 && status < 300, json: async () => body});

function clock() {
  let t = 0;
  return {now: () => t, sleep: async (ms) => { t += ms; }};
}

describe('createFileDropClient', () => {
  it('wake returns true when /health answers and false on network error', async () => {
    const ok = createFileDropClient({baseUrl: 'https://d', fetchImpl: async () => jsonResponse(200, {ok: true})});
    expect(await ok.wake()).toBe(true);
    const down = createFileDropClient({baseUrl: 'https://d', fetchImpl: async () => { throw new Error('x'); }});
    expect(await down.wake()).toBe(false);
  });

  it('uploads with the docx content type and an encoded file name', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(201, {url: 'https://d/files/abc'}));
    const client = createFileDropClient({baseUrl: 'https://d', fetchImpl});
    const url = await client.upload(new Uint8Array([1]), 'A & B.docx');
    expect(url).toBe('https://d/files/abc');
    const [calledUrl, init] = fetchImpl.mock.calls[0];
    expect(calledUrl).toBe('https://d/files?filename=A%20%26%20B.docx');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe(DOCX_TYPE);
  });

  it('retries 502/503 and network errors while the service starts', async () => {
    const c = clock();
    const responses = [() => { throw new Error('reset'); }, () => jsonResponse(503, {}), () => jsonResponse(201, {url: 'u'})];
    const fetchImpl = vi.fn(async () => responses.shift()());
    const client = createFileDropClient({baseUrl: 'https://d', fetchImpl, ...c});
    expect(await client.upload(new Uint8Array([1]), 'a.docx')).toBe('u');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('gives up after maxWaitMs with a FileDropError', async () => {
    const c = clock();
    const client = createFileDropClient({baseUrl: 'https://d', fetchImpl: async () => jsonResponse(503, {}), maxWaitMs: 10_000, ...c});
    await expect(client.upload(new Uint8Array([1]), 'a.docx')).rejects.toBeInstanceOf(FileDropError);
  });

  it('does not retry client errors', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(413, {error: 'file too large'}));
    const client = createFileDropClient({baseUrl: 'https://d', fetchImpl});
    await expect(client.upload(new Uint8Array([1]), 'a.docx')).rejects.toThrow('file too large');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
