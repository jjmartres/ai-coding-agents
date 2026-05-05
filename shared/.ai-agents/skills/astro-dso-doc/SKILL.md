---
name: astro-dso-doc
description: Generates a complete, polished HTML documentation page AND a ready-to-paste PixInsight project Description field for a deep-sky object (DSO) astrophotography project. Use this skill whenever the user mentions astrophotography, a DSO name (NGC, IC, Messier, Sharpless, etc.), wants to document an imaging session, mentions PixInsight project documentation, wants to create an observation report, or asks to generate a page/document for a nebula, galaxy, cluster, or other deep-sky target. Triggers on phrases like "create doc for NGC XXXX", "generate DSO page", "document my session on", "make a PixInsight doc for", "astro documentation page", "pixinsight project description", "description field pixinsight". Always use this skill — not a generic HTML generator — when the subject is a deep-sky object.
---

# Astro DSO Documentation Generator

Generates two deliverables for a deep-sky object (DSO) astrophotography project:

1. **`project.json`** — a flat JSON file containing the PixInsight project description data (copy the `description` field value into the Description box of `.xosm`)
2. **`doc/index.html`** — a rich, self-contained HTML documentation page (path goes into the Documentation field of `.xosm`), using the Catppuccin flavor palette with a theme switcher.

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

### Step 4 — Generate project.json

Build a **flat JSON object** (no nesting, no indentation) representing the PixInsight project
description. Save it as `./project.json` in the current working directory using Bash:

```bash
cat > ./project.json << 'EOF'
{"target":"NGC2174","common_name":"Monkey Head Nebula","constellation":"Orion","ra":"06h 09m 42s","dec":"+20° 30' 00\"","object_type":"H II Region","telescope":"Vaonis Vespera 1 (50mm f/4)","camera":"Sony IMX585 (built-in)","filter":"Dual-band built-in (Ha + OIII)","site":"Dark Sky Site","site_coords":"45.0N / 6.0E · ~900m","session_count":6,"sessions":["2026-03-19_19h04.tiff","2026-03-20_18h48.tiff","2026-03-23_20h43.tiff","2026-04-07_20h40.tiff","2026-04-08_19h19.tiff","2026-04-16_19h37.tiff"],"stacking":"Internal stacking by instrument","calibration":"Handled internally by the instrument","subs_integrated":"6 / 6","ref_alignment":"","ref_integration":"","notes":"","created":"2026-05-05","description":"TARGET       : NGC2174 – Monkey Head Nebula\nConstellation: Orion | RA 06h 09m 42s / Dec +20° 30' 00\"\n\n── EQUIPMENT ────────────────────────────────────────────\nTelescope    : Vaonis Vespera 1 (50mm f/4)\nCamera       : Sony IMX585 (built-in)\nFilter       : Dual-band built-in (Ha + OIII)\nSite         : Dark Sky Site (45.0N / 6.0E · ~900m)\n\n── SESSIONS ─────────────────────────────────────────────\n2026-03-19_19h04.tiff\n2026-03-20_18h48.tiff\n2026-03-23_20h43.tiff\n2026-04-07_20h40.tiff\n2026-04-08_19h19.tiff\n2026-04-16_19h37.tiff\n\nTotal        : 6 sessions | Internal stacking by instrument\nCalibration  : Handled internally by the instrument\n\n── INTEGRATION ──────────────────────────────────────────\nSubs integrated  : 6 / 6\nRef. alignment   :\nRef. integration :\n\n────────────────────────────────────────────────────────\nProject created  : 2026-05-05"}
EOF
```

JSON field rules:

- **No indentation** — the entire JSON must be a single line (minified)
- All string values use `\n` for newlines within the `description` field
- `ref_alignment` and `ref_integration` are always **empty strings** `""` — the user fills them in PixInsight
- `calibration`: `"Handled internally by the instrument"` for smart telescopes; `"Darks / Flats / Bias"` otherwise
- `sessions` array: filenames sorted chronologically, no path prefix
- `description` field: the full plain-text block (same format as before, using `\n` escapes) ready to paste into PixInsight's Description box
- `notes`: empty string `""` if user skipped Block D; otherwise the user's text

After writing the file, confirm the path to the user.

---

### Step 5 — Generate the HTML Documentation Page

Read the full HTML template from `references/template.html`.

Fill in all the template placeholders using:

- Research data (Step 3)
- Acquisition data (Step 2)
- Session file list (Step 2C)

Create the `doc/` directory if it does not exist, then save the output:

```bash
mkdir -p ./doc
```

Save the file as `./doc/index.html`.

Tell the user the full path of the generated file, and remind them:

- **Documentation field** of the PixInsight project → path to `doc/index.html`
- **Description field** of the PixInsight project → copy the value of the `description` key from `project.json`

---

### Step 6 — Copy Description to Clipboard

Run the following command to place the PixInsight description text directly into the clipboard:

```bash
cat project.json | jq -r '.description' | pbcopy
```

If the command succeeds (exit code 0), tell the user:

> ✓ Description copied to clipboard — paste it directly into the PixInsight project Description field.

If it fails (e.g. `jq` or `pbcopy` not found), show the fallback message:

> ⚠ Clipboard copy unavailable. Open `project.json` and copy the value of the `description` key manually.

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

**`project.json`:**

- Single-line minified JSON — no indentation, no pretty-printing
- `description` field contains the full plain-text PixInsight Description block with `\n` escapes
- `ref_alignment` and `ref_integration` always empty strings `""`
- `sessions` array sorted chronologically
- All fields always present; use `""` or `0` for missing optional values, never `null`

**`doc/index.html`:**

- `doc/` directory created automatically if absent
- All 4 Catppuccin flavors wired up: Latte, Frappé, Macchiato (default), Mocha
- Theme preference persists via `localStorage`
- Fully self-contained — single HTML file, no external dependencies except Google Fonts
- Sections with no data omitted gracefully
- Session files in chronological order
- All scientific content from actual web searches — never fabricate measurements
- Uncertainty ranges cited when distance estimates vary between sources

---

## Edge Cases

| Situation                                 | Handling                                                    |
| ----------------------------------------- | ----------------------------------------------------------- |
| DSO not well-documented                   | Note gaps; still generate both outputs with available data  |
| Directory path given but empty            | Ask user to paste filenames manually                        |
| No session files provided                 | `sessions: []` in JSON; omit Section 08 from HTML           |
| Galaxy / cluster instead of nebula        | Skip narrowband tip cards; adapt physical description       |
| User skips optional questions             | Use `""` in JSON; use `—` placeholders in HTML              |
| File extensions unexpected                | Accept `.png`, `.jpeg`, `.dng`, `.raf` as well              |
| User wants JSON only                      | Run Steps 1, 2, 4 only — skip Steps 3 and 5                 |
| User wants HTML only                      | Run Steps 1, 2, 3, 5 only — skip Step 4                     |
| Smart telescope (no separate calibration) | `calibration: "Handled internally by the instrument"`       |
| `doc/` already exists                     | Overwrite HTML silently — never error on existing directory |
