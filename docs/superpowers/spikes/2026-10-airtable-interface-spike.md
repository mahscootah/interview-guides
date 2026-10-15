# Airtable Interface extension spike, 2026-10-15

Sandbox base: TA Airtable - Sandbox 10/14 (appZinw15kU0CNmI1)
Interview Guides table: tbl2UVSMxKROjW7xs (reverse link on Master Tracker: fld9prTiKSo1oJznj)
File drop URL: https://interview-guide-file-drop.onrender.com
Extension: "Interview Guide Builder", blkXfl4g8O4rOqeE2, org unit Columbia IT
block init command: `block init NONE/blkXfl4g8O4rOqeE2 --template=https://github.com/Airtable/interface-extensions-hello-world <dir>`
block init template URL: https://github.com/Airtable/interface-extensions-hello-world
CLI: @airtable/blocks-cli 3.0.3
SDK version: 0.0.0-experimental-3c2a2d775-20260807 (template default was 0.0.0-experimental-8575f0e0d-20260428; pinned after init)

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Extension can be released and added to an Interface page (`block release`) | pass | Released 2026-10-15. Page loads the release with Develop off. |
| 2 | Reads Master Tracker + Interview Guides and all six requisition fields | pass | Access is granted in the page's properties panel, not in code (see below). |
| 3 | Creates a linked Interview Guides record | pass | Needs "Add records inline" and "Edit records inline" on for Interview Guides. |
| 4 | Attachment written by URL is still openable in Word 15+ minutes later | pass | Airtable copied the file at write time to `v5.airtableusercontent.com` (same size, thumbnail made). Opened cleanly in Word 25+ minutes later. |

Extension iframe origin (development): https://devblock---zinw15k-u0-c-nm-i1--bz74bvj.alt.airtableblocks.com
Extension iframe origin (released): https://block---zinw15k-u0-c-nm-i1--neu89aw.alt.airtableblocks.com
Both match the default `ALLOWED_ORIGIN_PATTERN` (`^https://([a-z0-9-]+\.)*airtableblocks\.com$`), so no Render change.

Decision: proceed.

## How it actually works (differs from the plan)

- **Where `block init` comes from.** Create the extension in Builder Hub (airtable.com/create/extensions → Create extension → "Hello world" JavaScript, org unit Columbia IT). The setup page shows the `block init` command. The Interface page's Custom layout only lists extensions that already exist.
- **Adding it to a page.** Interface → "+" on the interface → layout **Custom** → choose the page's source table → pick the extension → Finish. A Blank page has no custom-element option.
- **Token first.** `block init` prompts for the `block:manage` token if none is set. `block set-api-key` must run in a real terminal; the prompt can't be answered through a non-interactive shell.
- **Data access is set per page in the properties panel**, under Data and User actions:
  - *Table*: which tables the extension can see. Default is only the page's source table.
  - *Fields*: per-table field visibility. Default is the first four fields. Hidden fields are invisible to `getFieldByNameIfExists`.
  - *Edit records inline* / *Add records inline*: each has a per-table gear. Without Add on, `createRecordAsync` fails: "You can't create records in 'Interview Guides' because it is not set to allow record creation."
  - Spike settings: tables Master Tracker + Interview Guides; Master Tracker fields Position Title, Req #, Brand, Hiring Manager, Panel Interview Format, #of Panelists (plus defaults); all eight Interview Guides fields; Edit + Add on for **Interview Guides only**, off for Master Tracker.
- **Development mode.** Click the element → **Develop**. Chrome must first accept the self-signed cert at https://localhost:9000. Develop mode turns off on every page reload.
- **Fetching outside files from the iframe** fails on CORS (the plan's calibre-ebook.com sample). The spike embedded a sample guide instead.
- **First click** into the extension iframe in the editor only focuses it; the second click acts.

## Carry into Task 12 / Task 13

- `airtable-extension` must use extension `blkXfl4g8O4rOqeE2`: add `block.json` (`"frontendEntry": "./frontend/index.jsx"`) and `.block/remote.json` (`{"blockId": "blkXfl4g8O4rOqeE2", "baseId": "NONE"}`).
- The live page needs the same properties-panel settings, made by hand. Add them to the go-live checklist.
- The spike release (v1) is live on the sandbox page until the real extension is released over it.

## Sandbox run, 2026-10-15 (development build, Scott)

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Start screen: New guide first, search focused | pass | |
| 2 | Search by title and Req #, pick, create | pass after fix | Match list stayed open and hid the Create controls (fixed b18a7c6). Create showed a false "That guide no longer exists." because the new record reached `useRecords` late (fixed f6d4f76). |
| 3 | Build and Generate; file opens in Word | pass | |
| 4 | Reopen restores picks; Generate again appends a file | pass | Questions whose wording was later corrected reopen as custom questions, not lost. |
| 5 | Second guide (Final) on the same requisition | pass | "Opening the guide…" shown briefly. |
| 6 | File drop suspended: error plus Download .docx | pass | Downloaded file opened. |
| 7 | Damaged Selections: builder opens empty with reset warning | pass | |
| 8 | Blank Brand: "Columbia Sportswear (default)" | pass | |

Changes requested during the run: return to the guide list after a successful Generate (aa6fc1a); fix split words in the question bank (4fbbd0d, 70595fe); move the question bank into an Airtable table (to do); put the date in generated file names (to do).

Both "to do" items were done afterwards: the question bank moved to the Competencies and Interview Questions tables (ced8377) and file names carry the date and time (4ac27a6).

### Released build, 2026-10-15 (Scott)

Steps 1–3 re-run on the released extension (Develop off, page reloaded), reading the question bank from the Airtable tables: pass. The guide was created and generated, the page returned to the guide list with the green "Guide attached" notice, and the dated file opened in Word.

Interview Guides → Requisition now has "Allow linking to multiple records" turned off (set by hand).
