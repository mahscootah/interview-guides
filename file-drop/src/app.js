export const DOCX_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const ID_PATTERN = /^[a-f0-9]{32}$/;
const MAX_FILENAME_LENGTH = 200;
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

function send(res, status, body, headers = {}) {
  const isJson = body !== undefined && !(body instanceof Uint8Array);
  res.writeHead(status, {
    ...(isJson ? {'Content-Type': 'application/json'} : {}),
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

function corsHeaders(req, allowedOrigin) {
  const origin = req.headers.origin;
  if (!origin || !allowedOrigin.test(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function isValidFilename(name) {
  return (
    typeof name === 'string' &&
    name.length <= MAX_FILENAME_LENGTH &&
    name.toLowerCase().endsWith('.docx')
  );
}

// Reads the whole body but stops keeping bytes past maxBytes, so the client still
// receives the 413 response instead of a reset connection.
function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total <= maxBytes) chunks.push(chunk);
    });
    req.on('end', () => {
      if (total > maxBytes) reject(Object.assign(new Error('too large'), {status: 413}));
      else resolve(new Uint8Array(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

function startsWithZipMagic(bytes) {
  return ZIP_MAGIC.every((b, i) => bytes[i] === b);
}

async function handleUpload(req, res, url, ctx) {
  const cors = corsHeaders(req, ctx.allowedOrigin);
  if (!cors['Access-Control-Allow-Origin']) return send(res, 403, {error: 'origin not allowed'});
  const filename = url.searchParams.get('filename');
  if (!isValidFilename(filename)) return send(res, 400, {error: 'filename must end in .docx'}, cors);
  if (req.headers['content-type'] !== DOCX_TYPE) return send(res, 400, {error: 'docx only'}, cors);
  try {
    const bytes = await readBody(req, ctx.maxBytes);
    if (!startsWithZipMagic(bytes)) return send(res, 400, {error: 'not a docx file'}, cors);
    const id = ctx.store.put(bytes, filename);
    return send(res, 201, {url: `${ctx.publicBaseUrl}/files/${id}`}, cors);
  } catch (err) {
    return send(res, err.status === 413 ? 413 : 400, {error: err.status === 413 ? 'file too large' : 'bad upload'}, cors);
  }
}

function handleDownload(res, id, store) {
  const entry = ID_PATTERN.test(id) ? store.get(id) : null;
  if (!entry) return send(res, 404, {error: 'not found'});
  const safeName = entry.filename.replace(/["\r\n]/g, '').replace(/\s+/g, ' ');
  return send(res, 200, entry.bytes, {
    'Content-Type': DOCX_TYPE,
    'Content-Disposition': `attachment; filename="${safeName}"`,
    'Cache-Control': 'no-store',
  });
}

/**
 * @param {{store: ReturnType<import('./store.js').createStore>, allowedOrigin: RegExp,
 *          maxBytes: number, publicBaseUrl: string}} ctx
 */
export function createApp(ctx) {
  return (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);
    if (req.method === 'OPTIONS') return send(res, 204, undefined, corsHeaders(req, ctx.allowedOrigin));
    if (req.method === 'GET' && url.pathname === '/health') {
      return send(res, 200, {ok: true}, corsHeaders(req, ctx.allowedOrigin));
    }
    if (req.method === 'POST' && url.pathname === '/files') return handleUpload(req, res, url, ctx);
    const isRead = req.method === 'GET' || req.method === 'HEAD';
    if (isRead && parts.length === 2 && parts[0] === 'files') {
      return handleDownload(res, parts[1], ctx.store);
    }
    return send(res, 404, {error: 'not found'});
  };
}
