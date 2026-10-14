# Airtable Interview Guide Builder — Design

**Date:** 2026-10-14
**Status:** Draft, awaiting review
**Owner:** Scott Walters (Talent Acquisition)

## 1. Goal

Let CES (Candidate Experience Specialists) build interview guides without leaving the
**TA Airtable - Live** base. Today they build guides by hand, either directly or with the
separate Interview Guide Builder web app (`index.html`). The finished `.docx` guide should
end up attached to an Airtable record tied to the requisition, ready to send to panelists.

### Success criteria

- A CES can create, edit and regenerate a guide for a requisition entirely inside an
  Airtable Interface.
- The generated `.docx` matches the web app's branded output (same brand templates,
  question layout and panelist sections).
- Existing Master Tracker fields, interfaces and automations work exactly as before.
- No Airtable access token is stored in the extension, the base or the file service.

### Context (what the users told us)

- Hiring managers give competencies to recruiters, who enter them in **Workday**. CES look
  them up in Workday. Panelist names also live only in Workday.
- CES hand-pick specific questions for each competency and assign each competency to a
  panelist, unless the hiring manager designated specific questions.
- A requisition may need more than one guide (first panel, second panel, final interview).
- The existing **Panel Interview Guide** attachment field on Master Tracker is used by
  current interfaces and must not change.
- The **Sync View** table is left over from an older tracker and is ignored.
- The web app is hosted on Render. Render's free tier spins down after inactivity; paying
  for always-on is not wanted.
- **All users work only in Interfaces**, never in the base's grid or data view.

### Platform facts (checked 2026-10-14)

- Extensions for Interface pages exist only as **pre-release builds** of `@airtable/blocks`
  (npm dist-tag `interface-alpha-next`, version `0.0.0-experimental-3c2a2d775-20260807`).
  The stable `1.19.0` release only supports base extensions in the side panel, which the CES
  never see.
- An Interface extension is a **page element**. It can read records (`useBase`,
  `useRecords`), create and update records (`createRecordAsync`, `updateRecordAsync`), write
  attachments by URL, open a record (`expandRecord`), and keep its own state in the URL
  (`useSearchParams`). It has **no way to tell which record a detail page is showing.**
- We therefore pin that exact pre-release version and treat it as a known risk (§9).

## 2. Architecture

```
CES opens the "Guide Builder" Interface page (TA Airtable - Live)
        │
        ▼
┌──────────────────────────────────────────────┐
│ Guide Builder Interface extension (React,    │
│ hosted by Airtable, pinned pre-release SDK)  │
│  • start: New Guide, or reopen a guide       │
│  • reads the guide's linked requisition      │
│  • CES picks competencies → questions →      │
│    panelist; adds HM-specified questions     │
│  • saves picks to Selections                 │
│  • builds the .docx in the browser           │
└──────────────┬───────────────────────────────┘
               │ 1. POST .docx (bytes)
               ▼
┌──────────────────────────────────┐
│ Render: temporary file drop      │  no Airtable token, files kept
│ (Node web service, free tier)    │  ≤10 minutes then deleted
└──────────────┬───────────────────┘
               │ 2. returns a random, expiring URL
               ▼
Extension writes [{url, filename}] into Guide File using the CES's own
Airtable permissions; Airtable copies the file into its own storage.
```

### Units

| Unit | Responsibility | Depends on |
|---|---|---|
| **Question bank module** | The 273 corporate questions (12 Leadership Capabilities, 30 Behavioral Skills), definitions and groups, copied from `index.html` `QBANK` | nothing |
| **Brand mapper** | Maps Master Tracker Brand values to one of four templates (see §3.3) | nothing |
| **Selections codec** | Serialize and parse the CES's picks to and from the Selections field, with a version number | nothing |
| **Document builder** | Turns header details plus selections into a `.docx` file (the web app's docx code, moved into a module) | question bank, brand mapper |
| **Start screen** | New Guide panel (requisition search → round → create, shown first); recent guides list with search; remembers the open guide in the URL (`useSearchParams`, key `guide`) | Blocks SDK |
| **Builder UI** | The React screens the CES uses to edit one guide (§4) | all of the above, Blocks SDK |
| **Attach client** | Wakes the file drop, uploads the file, writes the URL to Guide File, handles retries and the fallback | Blocks SDK, file drop |
| **File drop service** | `POST /files` (stores a .docx, returns a URL), `GET /files/:id` (serves it once it's stored, until it expires), `GET /health` (wake-up) | Render |

### Cold start (Render free tier)

When the extension loads, it calls `GET /health` in the background. A CES spends minutes
picking questions, so the service is awake by the time they click Generate. If it is still
starting, the extension shows "Preparing…" and retries for up to ~60 seconds.

**Fallback if the feasibility test fails (§7.1):** replace the file drop with an
Airtable-only path. The extension writes the base64 file to a temporary long-text field, and
an automation script uploads it through the `uploadAttachment` Web API endpoint using a token
held as an automation secret, then clears the field. This needs confirmation that automation
secrets are supported, plus a shared TA service-account token.

## 3. Data model

### 3.1 New table: **Interview Guides** (in TA Airtable - Live)

| Field | Type | Notes |
|---|---|---|
| Guide Name | single line text (primary) | e.g. "Sr Product Manager – Panel 1" |
| Requisition | link → Master Tracker - All TA (single record) | required for the extension to work |
| Interview Round | single select | Panel, Second Panel, Final, Other |
| Panelists | long text | one name per line, typed by the CES |
| Selections | long text | JSON written by the extension; hidden in interfaces |
| Guide File | attachment | generated `.docx` files, newest last |
| Last Generated | date and time | set by the extension on success |
| Generated By | collaborator | set by the extension on success |

### 3.2 Master Tracker changes

Only one: Airtable automatically adds an **Interview Guides** link field listing the linked
guides. **Panel Interview Guide**, **Panel Interview Guide Questions** and every other
existing field stay untouched.

### 3.3 Fields read from Master Tracker (read-only)

| Field | Use |
|---|---|
| Position Title | guide title (required) |
| Req # | printed in the header |
| Brand | template choice (blank → Columbia) |
| Hiring Manager | printed in the header |
| Panel Interview Format | printed in the header (Virtual (Microsoft Teams) / In-Person) |
| # of Panelists | starting number of panelist boxes when Panelists is empty |

Brand mapping (values are trimmed and matched case-insensitively):

| Master Tracker value | Template |
|---|---|
| `CSC`, `Columbia`, `Columbia Sportswear Company` | columbia |
| `MHW`, `Mountain Hardwear` | mountainhardwear |
| `prAna` | prana |
| `SOREL` | sorel |
| blank / empty | columbia (default) |
| anything else | not mapped: the CES picks a template from a dropdown, and the choice is saved in Selections |

### 3.4 Selections format (version 1)

```json
{
  "v": 1,
  "brandOverride": null,
  "competencies": [
    {
      "name": "Accountability",
      "panelist": "Jordan Lee",
      "questions": ["<question text>", "..."],
      "customQuestions": ["<HM-specified question>"]
    }
  ]
}
```

Questions are stored as their text, not by position, so later edits to the question bank don't
silently swap questions in a saved guide. When a saved question is no longer in the bank, it
is shown as a custom question.

## 4. CES flow

The Guide Builder is its own full-page Interface page, added to the Interfaces the CES
already use. Inside it the extension shows two screens.

**Screen A: start (New Guide first)**

The page opens with **New Guide** as the main action; existing guides sit below it.

1. **New Guide panel (top, focused on load):** a search box over Master Tracker by Position
   Title or Req #. The CES picks the requisition, picks the Interview Round, and confirms the
   Guide Name (pre-filled `<Position Title> – <Interview Round>`). The extension creates the
   Interview Guides record linked to that requisition and opens it straight into Screen B.
2. **Recent guides (below):** Interview Guides newest first (Guide Name, Position Title,
   Req #, Interview Round, Last Generated), with its own search box. Clicking one opens it.
3. The open guide's record ID is stored in the URL, so a browser refresh or a shared link
   reopens the same guide.

Guides created elsewhere (for example with Airtable's **+ Add** button on a requisition's
Interview Guides list) appear in this list automatically.

**Screen B: build one guide**

1. **Back to guides** link at the top.
2. **Header:** Position Title, Req #, Brand, Hiring Manager and Format, read-only, from the
   linked requisition.
3. **Panelists:** the CES types names from Workday. When Panelists is empty, the number of
   boxes starts at # of Panelists (minimum 1).
4. **Competencies:** checkbox lists for Leadership Capabilities and Behavioral Skills.
5. **Questions and assignments:** for each chosen competency, the CES checks questions, adds
   any hiring-manager questions and assigns a panelist.
6. **Generate:**
   1. Save Panelists and Selections.
   2. Build the `.docx`.
   3. Upload it to the file drop.
   4. Append it to Guide File.
   5. Set Last Generated and Generated By.
   6. Show "Guide attached ✓" plus a **Copy Questions** button.
7. Reopening a guide restores the saved picks. Generating again **adds** a new file. Older
   files are never deleted automatically.

File name: `<Position Title> - <Interview Round> Interview Guide.docx`, with characters that
aren't allowed in file names removed.

## 5. Error handling

| Situation | Behaviour |
|---|---|
| Guide's record ID in the URL no longer exists (deleted guide) | Return to the start screen with "That guide no longer exists" |
| No linked requisition, or a missing Position Title | Show a message naming what is missing instead of the builder. A blank Brand is not an error: it defaults to Columbia. An unrecognized Brand shows the template dropdown. |
| No competencies, or a competency with no question or no panelist | Generate disabled, with a hint naming what is missing |
| File drop still starting | "Preparing…", retrying with backoff for up to ~60 seconds |
| File drop unreachable, or upload fails | "Couldn't attach the guide" plus a **Download .docx** button for manual upload |
| Airtable rejects the attachment write (for example, permissions) | Same fallback, showing Airtable's error text |
| Two people edit the same guide | Last save wins (accepted for v1) |

Selections are saved before the file is built, so a failure later never loses the CES's
picks.

### File drop service rules

- Accepts only the `.docx` content type, at most 5 MB, otherwise answers 400 or 413.
- File IDs are random and at least 128 bits. Files expire 10 minutes after upload and are then
  deleted.
- Files are kept in memory only (nothing written to disk) and file contents are never logged.
- No secrets. CORS is limited to Airtable's extension origins.

## 6. Repository layout

The existing web app stays exactly as it is. New code goes in two folders:

```
airtable-extension/      # Blocks SDK custom extension (React)
  frontend/
    index.js             # entry point
    ui/                  # builder screens
    lib/                 # question bank, brand mapper, selections codec, document builder, attach client
  test/
file-drop/               # Render web service (Node)
  src/
  test/
```

Moving the question bank into a shared module that `index.html` also uses is out of scope.
For v1 the bank is copied, with a note in both places.

## 7. Testing

### 7.1 Feasibility test (first, in a sandbox base)

A throwaway Interface extension, built on the pinned pre-release SDK, placed on an Interface
page in a sandbox base. It passes when all of the following are true:

1. Columbia's workspace allows the extension to be released and added to an Interface page.
2. It can read Master Tracker and Interview Guides records and the fields this spec names.
   Record how table and field access is granted (for example, whether tables must be chosen
   in the extension's properties panel).
3. It can create an Interview Guides record linked to a requisition.
4. It uploads a small `.docx` to the file drop, writes the URL into an attachment field, and
   the attached file still opens in Word after the file drop's copy has expired.

If 1 fails, stop and go back to design. If 4 fails, switch to the §2 fallback before
building anything else. Findings from 2 decide how the real extension finds its tables.

### 7.2 Automated tests

- Brand mapper: every current Brand value, blank values (→ columbia) and unknown values (→ dropdown).
- Selections codec: saving and loading give back the same picks, a wrong version is
  rejected, and questions missing from the bank become custom questions.
- Document builder: headings, panelist sections and question order are correct (checked by
  reading the generated `.docx` XML).
- File drop: content type and size checks, expiry, a 404 after expiry, and no files written
  to disk.
- Coverage target: 80% for `lib/` and `file-drop/src/`.

### 7.3 Sandbox run

In a sandbox copy of the base:
1. Create two guides on one requisition.
2. Reopen and edit one of them.
3. Regenerate it.
4. Stop the file drop and confirm the Download .docx fallback appears.

### 7.4 Go-live gate

One CES walks through the flow in the sandbox. The table, interface page and extension are
added to TA Airtable - Live only after that, with Scott's sign-off.

## 8. Out of scope for v1

- Retail guides (`retail.html` question bank and role matrix)
- One guide per candidate
- Sending guides to panelists automatically
- Editing the question bank inside Airtable
- Writing to **Panel Interview Guide** or **Panel Interview Guide Questions**
- Changes to the existing web app

## 9. Open items

- Confirm that custom extensions can be added to Interface pages in Columbia's workspace
  (the user believes so, and Airtable's docs list all plans). Checked in §7.1.
- **Pre-release SDK risk:** the Interface extension SDK is not a stable release. The version
  is pinned exactly; upgrading is a deliberate task that reruns the sandbox checks in §7.3.
  If Airtable changes or withdraws it, the start screen and builder must be reworked.
- Pick the sandbox base for development (e.g. "(10/6 TRAINING SANDBOX) TA Airtable").
- Revoke the personal access token shared during design. Nothing in this design uses it.
