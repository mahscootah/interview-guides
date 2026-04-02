# CLAUDE.md

## Project Overview

Interview Guide Builder — a single-page web application that generates branded interview guide documents (.docx) for Columbia Sportswear Company and its sub-brands. Deployed on Vercel as a static site.

## Repository Structure

```
/
├── Interview Guide Builder.html   # The entire application (single-file SPA, ~21K lines)
├── Interview Guide Builder.txt    # Plain-text metadata / description
├── vercel.json                    # Vercel routing config (rewrites "/" to the HTML file)
└── CLAUDE.md                      # This file
```

## Architecture

This is a **single-file application** — all HTML, CSS, JavaScript, and bundled libraries live inside `Interview Guide Builder.html`. There is no build step, no package manager, and no framework.

### Bundled Libraries (inlined in the HTML)

- **docx** (~lines 1–20130) — Word document generation library (`window.docx`), used to create `.docx` files client-side
- **FileSaver** — `saveAs()` for triggering browser downloads

### Application Code (~lines 20131–21115)

| Section | Lines (approx) | Description |
|---------|----------------|-------------|
| `<style>` | 20131–20280 | All CSS styles |
| `<body>` HTML | 20282–20295 | Static header and progress bar shell |
| State & Config | 20296–20360 | `state` object, `BRAND_CONFIG`, `QBANK` question bank, competency lists |
| Step Renderers | 20378–20742 | `render()`, `renderStep1()`–`renderStep4()`, wizard progression |
| Doc Generation | 20743–21099 | `generateDoc()` — builds the Word document using the docx library |
| Utilities & Init | 21101–21113 | `esc()` helper, `render()` call |

### Application Flow (4-Step Wizard)

1. **Step 1 — Setup**: Interview type (1-on-1 or Panel), brand selection (CSC/Columbia/Sorel/MHW/prAna), job title, hiring manager, facilitator, interviewer(s), interview date
2. **Step 2 — Competencies**: Select 4–8 competencies from Leadership Capabilities and Behavioral Skills groups
3. **Step 3 — Questions**: Choose interview questions per competency (auto-selected, user can change via dropdown); for panel interviews assign questions to panelists
4. **Step 4 — Generate**: Preview and download the `.docx` interview guide

### State Management

A single mutable `state` object (line ~20299) holds all wizard data:
- `type`: `'single'` or `'panel'`
- `brand`: `'csc'` | `'columbia'` | `'sorel'` | `'mhw'` | `'prana'`
- `jobTitle`, `hiringManager`, `facilitator`, `interviewDate`
- `interviewers`: array of interviewer names
- `selectedComps`: array of selected competency names
- `selectedQuestions`: map of competency → selected question object
- `panelistAssignments`: map of competency → panelist name

### Brand Configuration

`BRAND_CONFIG` (line ~20313) maps brand keys to logo URLs and accent colors. Logos are fetched at doc-generation time via `getBrandLogoBuffer()`.

### Question Bank

`QBANK` (referenced at line ~20348) is an inline array of question objects with fields: `group`, `competency`, `question`, `definition`. Questions are categorized into:
- **Leadership Capabilities**
- **Behavioral Skills**

## Deployment

- **Platform**: Vercel (static hosting)
- **Config**: `vercel.json` rewrites `/` → `/Interview Guide Builder.html`
- No build command needed — the HTML file is served directly

## Development Conventions

- **No build system** — edit the HTML file directly
- **No tests** — manual testing only
- **Filenames contain spaces** — always quote paths in shell commands
- **All changes are in one file** — when modifying application logic, work within `Interview Guide Builder.html` lines 20131+
- The first ~20130 lines are the bundled `docx` library — avoid editing these unless upgrading the library
- CSS uses utility-style classes and inline styles; no CSS framework
- JavaScript is vanilla ES6+ with `async/await`; no module system at runtime

## Common Tasks

### Modifying the UI
Edit the `renderStep*()` functions (lines ~20405–20742). Each step function writes innerHTML to `#app`.

### Adding a new brand
1. Add an entry to `BRAND_CONFIG` with `logo` URL and `accent` color
2. Add an `<option>` in `renderStep1()` brand selector

### Changing question bank
Modify the `QBANK` array (located around line 20340+).

### Modifying the generated document
Edit `generateDoc()` (line ~20743). This function uses the `docx` library API to build tables, paragraphs, and styles.
