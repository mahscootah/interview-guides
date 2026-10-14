# Interview guide file drop

Holds generated `.docx` guides for 10 minutes so Airtable can copy them into an attachment
field. No Airtable token, no disk writes, no logging of file contents.

- `GET /health`: wake-up check
- `POST /files?filename=<name>.docx`: body is the docx bytes, `Content-Type` must be the
  docx MIME type, origin must match `ALLOWED_ORIGIN_PATTERN`
- `GET /files/<id>`: download (used by Airtable)

Env: `PUBLIC_BASE_URL` (or Render's `RENDER_EXTERNAL_URL`), `ALLOWED_ORIGIN_PATTERN`
(regex, default: `*.airtableblocks.com` and `https://localhost:9000`), `PORT`.

Run tests: `npm test` / `npm run coverage`.
