---
name: astro-dso-doc
description: Generates a complete, polished HTML documentation page AND a ready-to-paste PixInsight project Description field for a deep-sky object (DSO) astrophotography project. Use this skill whenever the user mentions astrophotography, a DSO name (NGC, IC, Messier, Sharpless, etc.), wants to document an imaging session, mentions PixInsight project documentation, wants to create an observation report, or asks to generate a page/document for a nebula, galaxy, cluster, or other deep-sky target. Triggers on phrases like "create doc for NGC XXXX", "generate DSO page", "document my session on", "make a PixInsight doc for", "astro documentation page", "pixinsight project description", "description field pixinsight". Always use this skill — not a generic HTML generator — when the subject is a deep-sky object.
---

# Astro DSO Documentation Generator

Generates two deliverables for a deep-sky object (DSO) astrophotography project:

1. A plain-text **PixInsight project Description** (paste into the Description field of `.xosm`)
2. A rich, self-contained **HTML documentation page** (path goes into the Documentation field of `.xosm`), using the Catppuccin flavor palette with a theme switcher.

## Workflow

### Step 1 — Identify the Target

Extract the DSO name/catalog number from the user's message. If ambiguous or missing, ask for it before proceeding.

Common catalog prefixes: NGC, IC, M (Messier), Sh2 (Sharpless), B (Barnard), vdB, LBN, LDN, Ced, RCW.

---

### Step 2 — Collect Acquisition Data (interactive)

Ask the user the following questions **one block at a time** (don't dump all at once). Wait for answers before proceeding.

**Block A — Instrument:**

```
What instrument did you use?
  (e.g. telescope model, focal length, f-ratio, camera, built-in filter)
```

**Block B — Site:**

```
Where did you image from?
  (location name, lat/lon if known, approximate altitude)
```

**Block C — Session files:**

```
Please provide the path to the folder or list of session files.
  (e.g. /path/to/sessions/ or paste filenames directly)
```

If the user gives a **directory path**, scan it with Bash:

```bash
ls -1 /path/to/sessions/ | grep -iE '\.(tiff?|fits?|xisf|cr2|nef|dng|raf|jpg|jpeg|png)$' | sort
```

Present the sorted list for confirmation before proceeding.

If the user **pastes filenames directly**, accept them as-is.

**Block D — Optional extras** (ask once, accept "skip" gracefully):

```
Any additional notes? (sky conditions, Bortle class, total integration time, etc.)
```

---

### Step 3 — Research the DSO

Use `web_search` to gather comprehensive data. Run **at least 3 searches** in parallel or sequence:

1. `{DSO name} {common name} astronomical data distance magnitude type constellation`
2. `{DSO name} star forming region physical properties HII nebula galaxy cluster`
3. `{DSO name} NASA Hubble ESA observations history discovery`
4. (if nebula) `{DSO name} astrophotography imaging narrowband dual-band filter tips`

Collect:

- Coordinates (RA / Dec J2000)
- Distance (ly and parsecs)
- Apparent size (arcmin)
- Visual magnitude
- Physical diameter
- Object type (HII region, reflection nebula, galaxy, globular cluster, etc.)
- Discovery history (who, when, instrument)
- Physical structure and processes
- Notable stars or ionizing sources
- Observation/imaging notes
- Key references (NASA, ESA, SIMBAD, catalogues)
- All catalog designations (NGC, IC, Sh2, LBN, etc.)

---

### Step 4 — Generate the PixInsight Project Description

Produce a plain-text block ready to paste into the **Description field** of a PixInsight
project (`.xosm`). This is a compact, structured text — not Markdown, not HTML.
Use ASCII box-drawing characters (`──`, `·`) for alignment. Keep it under ~60 characters
wide so it renders cleanly in PixInsight's fixed-width text box.

Format:

```
TARGET       : {DSO_ID} – {COMMON_NAME}
Constellation: {CONSTELLATION} | RA {RA} / Dec {DEC}

── EQUIPMENT ────────────────────────────────────────────
Telescope    : {INSTRUMENT}
Camera       : {CAMERA}
Filter       : {FILTER}
Site         : {SITE} ({SITE_COORDS})

── SESSIONS ─────────────────────────────────────────────
{SESSION_FILE_1}
{SESSION_FILE_2}
...

Total        : {SESSION_COUNT} sessions | {STACKING_NOTE}
Calibration  : {CALIBRATION_NOTE}

── INTEGRATION ──────────────────────────────────────────
Subs integrated  : {SESSION_COUNT} / {SESSION_COUNT}
Ref. alignment   :
Ref. integration :

────────────────────────────────────────────────────────
Project created  : {GENERATED_DATE}
```

Rules:

- `Ref. alignment` and `Ref. integration` are always left **blank** — the user fills them in
  once they have chosen reference frames inside PixInsight.
- `Calibration` line: if the instrument handles calibration internally (e.g. smart telescopes),
  write `Handled internally by the instrument`. Otherwise write `Darks / Flats / Bias`.
- `STACKING_NOTE`: e.g. `Internal stacking` or `Stacked in PixInsight`.
- Session files are listed one per line, sorted chronologically, **no bullets**.

Print this block in a fenced code block (` ```text `) so the user can copy it cleanly.

---

### Step 5 — Generate the HTML Documentation Page

Read the full HTML template from `references/template.html`.

Fill in all the template placeholders using:

- Research data (Step 3)
- Acquisition data (Step 2)
- Session file list (Step 2C)

Save the output to `./{DSO_ID}_documentation.html` in the **current working directory**.

Tell the user the full path of the generated file, and remind them that the HTML path
should be set in the **Documentation field** of the PixInsight project (not the Description
field — that was generated in Step 4).

---

## Template Placeholders Reference

See `references/template.html` for the full annotated template.

Key placeholders:

- `{{DSO_ID}}` — e.g. `NGC2174`
- `{{COMMON_NAME}}` — e.g. `Monkey Head Nebula`
- `{{RA}}`, `{{DEC}}` — J2000 coordinates
- `{{DISTANCE_LY}}`, `{{DISTANCE_PC}}` — with uncertainty range if known
- `{{APPARENT_SIZE}}` — e.g. `40′ × 30′`
- `{{MAGNITUDE}}` — visual magnitude
- `{{PHYSICAL_DIAMETER}}` — e.g. `~75 ly`
- `{{OBJECT_TYPE}}` — e.g. `H II Region`
- `{{CONSTELLATION}}` — full name
- `{{CATALOG_ROWS}}` — `<tr>` rows for the catalog table
- `{{SCIENTIFIC_DESCRIPTION}}` — 3–5 `<p>` paragraphs
- `{{KEY_STAR_BLOCK}}` — filled if a dominant ionizing/notable star exists, else empty
- `{{TIMELINE_ITEMS}}` — `<div class="timeline-item">` blocks for history
- `{{PHYSICAL_STRUCTURE}}` — 3–4 `<p>` paragraphs
- `{{OBSERVATION_TIPS}}` — `<div class="tip-card">` blocks
- `{{INSTRUMENT}}`, `{{FILTER}}`, `{{SITE}}`, `{{SITE_COORDS}}` — acquisition fields
- `{{SESSION_COUNT}}` — integer
- `{{SESSION_FILES}}` — `<span class="session-file">filename</span>` per file
- `{{REFERENCES_ROWS}}` — `<tr>` rows for references table
- `{{GENERATED_DATE}}` — today's date `YYYY-MM-DD`
- `{{AUTHOR_NOTES}}` — optional free-text notes block (omit section if empty)

---

## Quality Standards

**HTML page:**

- **All 4 Catppuccin flavors** must be wired up: Latte, Frappé, Macchiato (default), Mocha
- Theme preference persists via `localStorage`
- Page must be **fully self-contained** — single HTML file, no external dependencies except Google Fonts
- Sections with no data should be **omitted gracefully** (e.g. no key star block if data unavailable)
- Session files should be presented in **chronological order**
- All scientific content must come from actual web searches — never fabricate measurements
- Cite uncertainty ranges when distance estimates vary significantly between sources

**PixInsight Description field:**

- Plain text only — no Markdown, no HTML tags
- Maximum ~60 characters per line for PixInsight's text box
- `Ref. alignment` and `Ref. integration` always left blank for the user to fill
- Session files listed one per line, chronological order, no bullets or prefixes
- Must fit on screen without horizontal scrolling in PixInsight

---

## Edge Cases

| Situation                                 | Handling                                                              |
| ----------------------------------------- | --------------------------------------------------------------------- |
| DSO not well-documented                   | Note gaps explicitly; still generate both outputs with available data |
| Directory path given but empty            | Ask user to paste filenames manually                                  |
| No session files provided                 | Omit Section 08 from HTML; omit SESSIONS block from Description       |
| Galaxy / cluster instead of nebula        | Skip narrowband tip cards; adapt physical description section         |
| User skips optional questions             | Generate with "—" placeholders, easy to fill later                    |
| File extensions unexpected                | Accept `.png`, `.jpeg`, `.dng`, `.raf` as well                        |
| User wants Description only               | Generate Step 4 output only, skip Steps 3 and 5                       |
| User wants HTML only                      | Generate Steps 3 and 5 only, skip Step 4                              |
| Smart telescope (no separate calibration) | Set calibration line to "Handled internally by the instrument"        |
