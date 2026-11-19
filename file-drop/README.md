# Interview guide file drop

Holds generated `.docx` guides for 10 minutes so Airtable can copy them into an attachment
field. No Airtable token, no disk writes, no logging of file contents. Holds at most 100 MB
in total (503 when full).

- `GET /health`: wake-up check
- `POST /files?filename=<name>.docx`: body is the docx bytes, `Content-Type` must be the
  docx MIME type, origin must match `ALLOWED_ORIGIN_PATTERN`
- `GET /files/<id>`: download (used by Airtable)

Env: `PUBLIC_BASE_URL` (or Render's `RENDER_EXTERNAL_URL`), `ALLOWED_ORIGIN_PATTERN`
(regex, default: `*.airtableblocks.com` and `https://localhost:9000`), `PORT`.

Run tests: `npm test` / `npm run coverage`.

The live Render service was created with the Render MCP, which has no root-directory
setting, so its build/start commands are `cd file-drop && npm ci --omit=dev` and
`cd file-drop && node src/server.js` with no health check path. `render.yaml` describes the
same service for blueprint deploys. Auto-deploy is off: trigger a deploy after pushing.
