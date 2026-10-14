import {createServer} from 'node:http';
import {createStore} from './store.js';
import {createApp} from './app.js';

const DEFAULT_ORIGIN_PATTERN = '^https://([a-z0-9-]+\\.)*airtableblocks\\.com$|^https://localhost:9000$';
const FIVE_MB = 5 * 1024 * 1024;

const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? process.env.RENDER_EXTERNAL_URL;
if (!publicBaseUrl) {
  throw new Error('Set PUBLIC_BASE_URL (Render sets RENDER_EXTERNAL_URL automatically).');
}

const app = createApp({
  store: createStore(),
  allowedOrigin: new RegExp(process.env.ALLOWED_ORIGIN_PATTERN ?? DEFAULT_ORIGIN_PATTERN),
  maxBytes: FIVE_MB,
  publicBaseUrl: publicBaseUrl.replace(/\/$/, ''),
});

const port = Number(process.env.PORT ?? 10000);
createServer(app).listen(port, () => {
  process.stdout.write(`file-drop listening on ${port}\n`);
});
