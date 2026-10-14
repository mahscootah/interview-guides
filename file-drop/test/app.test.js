import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {createServer} from 'node:http';
import {createStore} from '../src/store.js';
import {createApp, DOCX_TYPE} from '../src/app.js';

const ORIGIN = 'https://blk123.airtableblocks.com';
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

function docxBytes(size = 10) {
  return new Uint8Array([...ZIP_MAGIC, ...new Array(size).fill(7)]);
}

let server;
let base;
let store;

beforeEach(async () => {
  store = createStore();
  const app = createApp({
    store,
    allowedOrigin: /^https:\/\/([a-z0-9-]+\.)*airtableblocks\.com$/,
    maxBytes: 64,
    publicBaseUrl: 'https://drop.example.com',
  });
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterEach(() => new Promise((resolve) => server.close(resolve)));

function upload(body, {filename = 'Guide.docx', type = DOCX_TYPE, origin = ORIGIN} = {}) {
  return fetch(`${base}/files?filename=${encodeURIComponent(filename)}`, {
    method: 'POST',
    headers: {'Content-Type': type, Origin: origin},
    body,
  });
}

describe('file drop app', () => {
  it('answers /health with CORS for an allowed origin', async () => {
    const res = await fetch(`${base}/health`, {headers: {Origin: ORIGIN}});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ok: true});
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
  });

  it('answers CORS preflight for POST /files', async () => {
    const res = await fetch(`${base}/files`, {
      method: 'OPTIONS',
      headers: {Origin: ORIGIN, 'Access-Control-Request-Method': 'POST'},
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
  });

  it('stores a docx and serves it back at the returned URL', async () => {
    const res = await upload(docxBytes());
    expect(res.status).toBe(201);
    const {url} = await res.json();
    expect(url).toMatch(/^https:\/\/drop\.example\.com\/files\/[a-f0-9]{32}$/);

    const id = url.split('/').pop();
    const got = await fetch(`${base}/files/${id}`);
    expect(got.status).toBe(200);
    expect(got.headers.get('content-type')).toBe(DOCX_TYPE);
    expect(got.headers.get('content-disposition')).toBe('attachment; filename="Guide.docx"');
    expect([...new Uint8Array(await got.arrayBuffer())]).toEqual([...docxBytes()]);
  });

  it('rejects uploads from other origins', async () => {
    const res = await upload(docxBytes(), {origin: 'https://evil.example.com'});
    expect(res.status).toBe(403);
    expect(store.size()).toBe(0);
  });

  it('rejects the wrong content type', async () => {
    const res = await upload(docxBytes(), {type: 'image/png'});
    expect(res.status).toBe(400);
  });

  it('rejects bytes that are not a zip', async () => {
    const res = await upload(new Uint8Array([1, 2, 3, 4, 5]));
    expect(res.status).toBe(400);
  });

  it('rejects file names that are not .docx or are too long', async () => {
    expect((await upload(docxBytes(), {filename: 'x.exe'})).status).toBe(400);
    expect((await upload(docxBytes(), {filename: `${'a'.repeat(201)}.docx`})).status).toBe(400);
  });

  it('rejects bodies over maxBytes with 413', async () => {
    const res = await upload(docxBytes(100));
    expect(res.status).toBe(413);
    expect(store.size()).toBe(0);
  });

  it('returns 404 for unknown or malformed ids and unknown routes', async () => {
    expect((await fetch(`${base}/files/${'0'.repeat(32)}`)).status).toBe(404);
    expect((await fetch(`${base}/files/../../etc/passwd`)).status).toBe(404);
    expect((await fetch(`${base}/nope`)).status).toBe(404);
  });

  it('removes quotes from the served file name header', async () => {
    const {url} = await (await upload(docxBytes(), {filename: 'A "B".docx'})).json();
    const got = await fetch(`${base}/files/${url.split('/').pop()}`);
    expect(got.headers.get('content-disposition')).toBe('attachment; filename="A B.docx"');
  });
});
