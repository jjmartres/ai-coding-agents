---
name: astro-dso-doc
description: Bootstraps a deep-sky object (DSO) astrophotography project from raw acquisition frames (own rig, not a smart telescope), AND generates a complete, polished HTML documentation page, a processing checklist, an AstroBin post JSON, a PixInsight process icon set (XPSM), and a ready-to-paste PixInsight project Description field. Use this skill whenever the user mentions astrophotography, asks to bootstrap/initialize/setup a project folder, a DSO name (NGC, IC, Messier, Sharpless, etc.), wants to document an imaging session, mentions PixInsight project documentation, wants to create an observation report, or asks to generate a page/document for a nebula, galaxy, cluster, or other deep-sky target. Triggers on phrases like "bootstrap project", "initialize astro project", "setup my project folder", "create doc for NGC XXXX", "generate DSO page", "document my session on", "make a PixInsight doc for", "astro documentation page", "pixinsight project description", "description field pixinsight", "processing checklist", "workflow checklist", "astrobin", "astrobin post", "astrobin upload", "process icons", "xpsm", "pixinsight icons", or when the working directory contains only a `raw/` folder with no `rig.json` yet. Always use this skill — not a generic HTML generator or generic file-scaffolding — when the subject is a deep-sky object.
---

# Astro DSO Documentation Generator

Generates up to six deliverables for a deep-sky object (DSO) astrophotography project:

0. **Project structure + `rig.json`** — the on-disk directory skeleton (`raw/`, `processing/`, `finals/`) and a schema-validated JSON file describing the rig, site, and per-filter acquisition sequences, built primarily by reading FITS headers directly out of `raw/light`, `raw/dark`, `raw/flat` rather than by manual entry.
1. **`project.json`** — a flat JSON file containing the PixInsight project description data (copy the `description` field value into the Description box of `.xosm`). Derived automatically from `rig.json` when the project was bootstrapped (Step 0b).
2. **`doc/index.html`** — a rich, self-contained HTML documentation page (path goes into the Documentation field of `.xosm`), using the Catppuccin flavor palette with a theme switcher.
3. **`doc/processing-checklist.html`** — an interactive step-by-step PixInsight processing checklist adapted to the target's filter set (LRGB, HOO, SHO, RGB-only, etc.), using the same Catppuccin design system.
4. **`astrobin.json`** — a structured JSON file containing all AstroBin image post fields, ready to copy-paste into the AstroBin upload form.
5. **`Process Icons - <common_name> - <workflow_type> workflow.xpsm`** — a PixInsight process icon set tailored to the detected workflow (LRGB, RGB, HOO, SHO), generated from the processing checklist phases.

A project can be a **smart telescope** (single pre-stacked file per session — see Edge Cases) or, more commonly now, an **own rig** shooting raw calibrated-later frames (light/dark/flat) — the default assumption throughout this skill.

---

## Workflow

### Step 0 — Bootstrap Project (Directory Structure + rig.json)

Run this step first whenever the user asks to bootstrap/initialize/setup a project, or whenever the working directory contains only a `raw/` folder and no `rig.json` yet. It replaces manual data entry (Step 2) whenever real acquisition data is available in FITS headers. It produces the on-disk skeleton and a validated `rig.json` — the source of truth for every other step in this skill.

#### 0.1 — Verify starting state

Only `raw/` is expected to exist when bootstrapping. Confirm with Bash:

```bash
ls -la ./
ls -la ./raw/
```

If `raw/light`, `raw/dark`, or `raw/flat` do not exist, create them (empty subfolders are fine — some campaigns have no separate darks, e.g. bias-only calibration):

```bash
mkdir -p ./raw/light ./raw/dark ./raw/flat
```

If a `rig.json` already exists in the working directory, ask the user whether to overwrite it or reuse it as-is before proceeding — never overwrite silently.

#### 0.2 — Create the rest of the project structure

```bash
mkdir -p ./processing/calibrated ./processing/masters ./finals
```

Directory roles:

| Directory | Role |
|---|---|
| `raw/light` `raw/dark` `raw/flat` | Untouched acquisition frames — never write into these |
| `processing/calibrated` | Calibrated/registered subs (optional to keep — can grow large) |
| `processing/masters` | Integrated master frames, one per filter (`MasterLight_<filter>.xisf`) |
| `finals` | Exported final images (`.xisf`, `.tif`, `.jpg`) |

#### 0.3 — Extract metadata from FITS headers

Scan every FITS file under `raw/light`, `raw/dark`, `raw/flat` and aggregate per-filter sequences. Install `astropy` if missing:

```bash
pip install astropy --break-system-packages -q 2>/dev/null
```

```bash
python3 << 'PYEOF'
import glob, json, os
from astropy.io import fits
from collections import defaultdict

def scan_folder(folder):
    """Group FITS headers by filter, aggregating exposure/gain/bin/temp/subs."""
    groups = defaultdict(lambda: {"subs": 0, "exposures": set(), "gains": set(),
                                   "bins": set(), "temps": set(), "dates": set()})
    meta = {}
    for path in sorted(glob.glob(os.path.join(folder, "*.fit*"))):
        try:
            hdr = fits.getheader(path)
        except Exception:
            continue
        filt = hdr.get("FILTER", "NONE") or "NONE"
        g = groups[filt]
        g["subs"] += 1
        exptime = hdr.get("EXPTIME", hdr.get("EXPOSURE"))
        if exptime is not None:
            g["exposures"].add(round(float(exptime), 3))
        if hdr.get("GAIN") is not None:
            g["gains"].add(hdr.get("GAIN"))
        g["bins"].add(hdr.get("XBINNING", 1))
        temp = hdr.get("CCD-TEMP", hdr.get("SET-TEMP"))
        if temp is not None:
            g["temps"].add(round(float(temp), 1))
        date_obs = hdr.get("DATE-OBS")
        if date_obs:
            g["dates"].add(str(date_obs)[:10])
        if not meta:
            meta = {
                "object": hdr.get("OBJECT"),
                "telescope": hdr.get("TELESCOP"),
                "camera": hdr.get("INSTRUME"),
                "focal_length": hdr.get("FOCALLEN"),
                "pixel_size": hdr.get("XPIXSZ"),
                "ra": hdr.get("RA", hdr.get("OBJCTRA")),
                "dec": hdr.get("DEC", hdr.get("OBJCTDEC")),
                "site_lat": hdr.get("SITELAT"),
                "site_long": hdr.get("SITELONG"),
                "bayer": hdr.get("BAYERPAT"),
            }
    return groups, meta

result = {}
global_meta = {}
for kind in ("light", "dark", "flat"):
    groups, meta = scan_folder(f"./raw/{kind}")
    if meta and not global_meta:
        global_meta = meta
    result[kind] = {
        filt: {
            "subs": g["subs"],
            "exposures": sorted(g["exposures"]),
            "gains": sorted(x for x in g["gains"] if x is not None),
            "bins": sorted(g["bins"]),
            "temps": sorted(g["temps"]),
            "dates": sorted(g["dates"]),
        }
        for filt, g in groups.items()
    }

print(json.dumps({"meta": global_meta, "sequences": result}, indent=2, default=str))
PYEOF
```

Present the extracted summary to the user in a compact table (per kind × filter: subs, exposure(s), gain(s), bin, temp) before writing `rig.json`.

If **multiple distinct exposures, gains, or bins** are found within the same filter (e.g. an incomplete or mixed session), list them as **separate sequence entries** rather than collapsing them — never silently average or discard data.

If `astropy` cannot be installed or no FITS files are found in `raw/light`, fall back to Block C of Step 2 (session file list) and proceed manually — do not fail the whole bootstrap.

#### 0.4 — Ask only for what FITS headers cannot provide

FITS headers rarely contain: aperture (mm), focal ratio, exact pixel count, filter bandwidth/model, site name, elevation, Bortle class. Ask in **one block**, pre-filling anything already extracted so the user only fills gaps:

```
I've read the raw frames. Here's what I found:
  Target      : {object or "not found — please provide"}
  Telescope   : {telescope or "not found"}
  Camera      : {camera or "not found"}
  Focal length: {focal_length or "not found"} mm
  Filters     : {list of distinct FILTER values found}

A few things aren't in the FITS headers — can you fill these in?
  - Aperture (mm) and f-ratio, if not inferable from focal length + known telescope model
  - Pixel size (µm), if not in header
  - Filter bandwidth (nm) and vendor/model, per filter
  - Site name, elevation (m), and Bortle class
  - GPS coordinates, if SITELAT/SITELONG were not present in the headers
```

Do not re-ask for anything already successfully extracted from the headers.

#### 0.5 — Generate rig.json

Build the file following the schema in `references/rig.schema.json`. Field sourcing:

| rig.json field | Source |
|---|---|
| `target.name` | `OBJECT` header, or user-provided |
| `target.common_name` | Resolved during Step 3 research (headers never carry a common name) |
| `target.coordinates_j2000` | `RA`/`DEC` (or `OBJCTRA`/`OBJCTDEC`) headers if present, else user-provided |
| `capture_location.site` | User-provided |
| `capture_location.latitude` / `longitude` | `SITELAT`/`SITELONG` headers if present, else user-provided |
| `capture_location.elevation_m` | User-provided |
| `capture_location.bortle` | User-provided |
| `camera.model` | `INSTRUME` header |
| `camera.sensor`, `camera.pixel_size_um` | User-provided if not derivable from `XPIXSZ` |
| `telescope.focal_length_mm` | `FOCALLEN` header, or computed from aperture × f-ratio |
| `telescope.aperture_mm`, `telescope.focal_ratio` | User-provided if not inferable |
| `filters` | Distinct `FILTER` header values, described with user-provided bandwidth/vendor |
| `tec_setpoint_c` | Most common `SET-TEMP` (fallback `CCD-TEMP`) across light frames |
| `binning` | Most common `XBINNING` across light frames |
| `sequences.lights[]` | One entry per filter (or per distinct exposure/gain/bin within a filter), from Step 0.3 aggregation, including `dates` (all distinct `DATE-OBS` days for that entry) |
| `sequences.darks[]` | One entry per distinct exposure/bin found in `raw/dark` (filter-independent), including `dates` |
| `sequences.flats[]` | One entry per filter found in `raw/flat`, including `dates` |

Save with Bash:

```bash
cat > ./rig.json << 'EOF'
[generated JSON, single object, pretty-printed 2-space indent]
EOF
```

Validate against the schema before confirming success:

```bash
pip install jsonschema --break-system-packages -q 2>/dev/null
python3 -c "
import json, jsonschema
schema = json.load(open('references/rig.schema.json'))
data = json.load(open('./rig.json'))
jsonschema.validate(instance=data, schema=schema)
print('rig.json OK')
"
```

If validation fails, fix the offending field and re-validate — **never present an invalid `rig.json` to the user as final.**

#### 0.6 — Confirm and hand off

Tell the user:

- **Project structure** → `raw/{light,dark,flat}`, `processing/{calibrated,masters}`, `finals/` created
- **rig.json** → path, and a one-line summary (target, filters, total subs, total integration time)

Then proceed automatically to **Step 0b** (internal field mapping) and **Step 3** (DSO research) to generate the object documentation. Do not re-ask acquisition questions already answered by `rig.json` — Step 2 becomes a no-op for any field it already covers.

---

### Step 0b — Map rig.json to Internal Project Fields

The rest of this skill (Steps 3 through 6) is built around a flat `project.json` structure. Bridge `rig.json` into that structure in memory (and still write `project.json` to disk — other tools may expect it) so every downstream step works unchanged.

| project.json field | Derived from rig.json |
|---|---|
| `target` | `target.name` |
| `common_name` | Resolved during Step 3 research (`rig.json` has no common name field) |
| `ra` / `dec` | `target.coordinates_j2000.ra` / `.dec` |
| `telescope` | `"{telescope.model} ({telescope.aperture_mm}mm f/{telescope.focal_ratio})"` |
| `camera` | `"{camera.model} ({camera.sensor})"` |
| `filter` | Join `filters` values, e.g. `"Askar D1 (H\u03b1/OIII, 6nm) + Askar D2 (SII/OIII, 6nm)"` — feeds workflow detection in Step 5b.1 as **SHO** or **HOO** depending on which bands are present |
| `site` | `capture_location.site` |
| `site_coords` | `"{latitude}N / {longitude}E \u00b7 ~{elevation_m}m \u00b7 Bortle {bortle}"` |
| `session_count` | Number of distinct dates found across `sequences.lights[].dates` (ask if not tracked) |
| `sessions` | One summary string per filter: `"{filter}: {subs} \u00d7 {exposure_s}s @ gain {gain}, bin {bin}"` |
| `stacking` | `"WBPP (PixInsight)"` — own rig, not a smart telescope |
| `calibration` | `"Darks / Flats / Bias"` (or `"Darks / Flats"` if no bias frames found in `raw/dark`) |
| `subs_integrated` | `"{total lights} / {total lights}"` unless the user flags rejected subs |
| `notes` | From Step 0.4 free-text answers |

Also carry forward for **Step 5c (astrobin.json)** and **Step 5d (XPSM)**, which can now be populated more precisely than with a smart telescope:

- `acquisition_details[].gain` — from `rig.json` `sequences.lights[].gain`, not `null`
- `acquisition_details[].temperature` — from `tec_setpoint_c`
- `acquisition_details[].bortle` — from `capture_location.bortle`
- `acquisition_details[].binning` — from `rig.json` `binning`

---

### Step 1 — Identify the Target

Skip this step if the target was already extracted from FITS headers in Step 0.3 (or confirmed in Step 0.4).

Extract the DSO name/catalog number from the user's message. If ambiguous or missing, ask for it before proceeding.

Common catalog prefixes: NGC, IC, M (Messier), Sh2 (Sharpless), B (Barnard), vdB, LBN, LDN, Ced, RCW.

---

### Step 2 — Collect Acquisition Data (interactive fallback)

Skip any block already fully answered by `rig.json` (Step 0). This step exists for: projects not bootstrapped via Step 0, smart telescope sessions (no raw FITS to scan), or fields Step 0.4 didn't cover.

Ask the remaining questions **one block at a time** (don't dump all at once). Wait for answers before proceeding.

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
- `calibration`: `"Darks / Flats / Bias"` (or `"Darks / Flats"`) for own-rig projects bootstrapped via Step 0 — the default case; `"Handled internally by the instrument"` only for smart telescopes (see Edge Cases)
- `sessions` array: filenames sorted chronologically, no path prefix
- `description` field: the full plain-text block (same format as before, using `\n` escapes) ready to paste into PixInsight's Description box
- `notes`: empty string `""` if user skipped Block D; otherwise the user's text

After writing the file, confirm the path to the user.

---

### Step 5 — Generate the HTML Documentation Page

Read the full HTML template from `references/documentation-template.html`.

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

### Step 5b — Generate the Processing Checklist

Read the full checklist template from `references/processing-checklist-template.html`.

#### 5b.1 — Detect filter set

Before filling the template, determine the workflow mode from the `filter` field in project.json:

| Filter value contains | Workflow mode | Active channels |
|---|---|---|
| `Luminance` + `Red` + `Green` + `Blue` | **LRGB** | L, R, G, B |
| `Red` + `Green` + `Blue` (no Lum) | **RGB** | R, G, B |
| `Ha` + `OIII` (no RGB) | **HOO** | Hα, OIII |
| `Ha` + `OIII` + `SII` | **SHO** | Hα, OIII, SII |
| `Ha` + `RGB` | **HαRGB** | Hα, R, G, B |
| `Ha` + `OIII` + `RGB` | **HOO+RGB** | Hα, OIII, R, G, B |
| Single filter only | **Mono** | That channel only |

#### 5b.2 — Parse per-channel exposure times

Parse the `sessions` array from project.json to extract per-channel totals.

**Case A — sessions is an array of summary strings** (e.g. `"Luminance: 3h 00m (36 × 300s)"`):
Extract directly from the string content.

**Case B — sessions is an array of filenames** (e.g. `CHI-1-CMOS_2023-07-26_NGC253_Blue_300s_ID374118_cal.fits`):
Count files per filter keyword (`Blue`, `Green`, `Red`, `Luminance`, `Ha`, `Halpha`, `OIII`, `SII`) and compute total exposure using the sub duration from the filename or from `subs_integrated`.

If per-channel data cannot be parsed, use `—` as the placeholder value.

#### 5b.3 — Fill placeholders

| Placeholder | Value |
|---|---|
| `{{DSO_ID}}` | `target` field from project.json (e.g. `NGC 4594`) |
| `{{COMMON_NAME}}` | `common_name` field |
| `{{CONSTELLATION}}` | `constellation` field |
| `{{OBJECT_TYPE}}` | `object_type` field, uppercased |
| `{{CAMERA}}` | `camera` field |
| `{{INSTRUMENT}}` | `telescope` field |
| `{{FILTER}}` | `filter` field |
| `{{SITE}}` | `site` field |
| `{{TOTAL_EXPOSURE}}` | `total_exposure` field (or computed from sessions) |
| `{{TOTAL_SUBS}}` | numeric portion of `subs_integrated` (e.g. `120`) |
| `{{LUM_TIME}}` | parsed Luminance total, e.g. `3h 00m (36 × 300s)` |
| `{{RED_TIME}}` | parsed Red total |
| `{{GREEN_TIME}}` | parsed Green total |
| `{{BLUE_TIME}}` | parsed Blue total |
| `{{HA_TIME}}` | parsed Hα total (omit row if channel absent) |
| `{{OIII_TIME}}` | parsed OIII total (omit row if channel absent) |
| `{{SII_TIME}}` | parsed SII total (omit row if channel absent) |
| `{{GENERATED_DATE}}` | today's date `YYYY-MM-DD` |
| `{{AUTHOR}}` | user name / location from Block B, or `—` |
| `{{DSO_NOTES}}` | user notes from Block D — remove entire section 11 if empty |

Also replace all occurrences of `{{DSO_ID}}` inside `id="step-*"` attributes and the `STORAGE_KEY` constant with a slug version: spaces replaced by hyphens, lowercased (e.g. `ngc-4594`).

#### 5b.4 — Adapt sections to workflow mode

Apply the following structural modifications based on the detected workflow mode:

**LRGB workflow** (default — correct order):

- Phase 02: Luminance linear (BXT + NXT only — **no stretch**)
- Phase 03: RGB linear (SPFC + CC + SPCC + BXT + NXT — **no stretch**)
- Phase 04: **LRGBCombination on linear masters** — combine L + RGB before any stretch
- Phase 05: Stretch the LRGB combined image + SCNR
- Phase 06: StarXterminator on stretched LRGB
- Phase 07: Starless LRGB processing (GHS, LHE, USM, SCC, NXT)
- Phase 08: Rescreen stars
- Phase 09: Finalization (Curves, ICC, Export)

**RGB workflow** (no Luminance):

- Remove section 04 entirely (Phase 02 — Luminance Processing)
- Remove section 09 entirely (Phase 07 — LRGB Integration)
- Update section numbers accordingly (03→03, 05→04, 06→05, 07→06, 08→07, 10→08, 11→09)
- Change all `tag-lrgb` tags to `tag-rgb` in finalization steps
- Update export filenames from `{{DSO_ID}}_LRGB_final.*` to `{{DSO_ID}}_RGB_final.*`
- Remove Luminance legend item

**HOO / SHO narrowband workflow**:

- Remove section 04 (Luminance linear) — keep section 09 if Luminance is present
- In section 05 (RGB linear): rename to "Narrowband Processing (Linear)"
  - Replace `ChannelCombination` step with: "PixelMath — HOO / SHO palette assembly"
  - Remove SPCC step; replace with: "BackgroundNeutralization + ColorCalibration"
  - Keep BlurXterminator, NoiseXterminator, stretch steps
  - Replace `SCNR` step with: "Correct magenta stars — CorrectMagentaStars script"
- Replace `tag-rgb` tags with `tag-nb` throughout narrowband phases
- Uncomment narrowband legend items (`tag-ha`, `tag-oiii`) in the legend section
- Uncomment narrowband data cells (Hα, OIII, SII) in section 01
- Update export filenames to `{{DSO_ID}}_HOO_final.*` or `{{DSO_ID}}_SHO_final.*`

**HαRGB workflow**:

- Keep full LRGB structure
- Add one step after `ChannelCombination` in section 05: "PixelMath — Integrate Hα into Red channel (HαRGB blend)"
- Uncomment Hα legend item and data cell
- Tag the new step with `tag-ha` and `tag-rgb`

**Smart telescope / pre-stacked** (alternate path — single session file per filter, `stacking` = "Internal stacking by instrument"; not produced by Step 0 bootstrap, only when the user explicitly describes a smart-telescope session in Step 2):

- Replace the entire Phase 01 (section 03) with a single step:

  ```
  Import pre-stacked masters
  Copy the stacked output files into the project folder.
  No WBPP run required — calibration and stacking handled by the instrument.
  ```

- Remove Blink Comparator steps

#### 5b.5 — Save the file

```bash
cat > ./doc/processing-checklist.html << 'EOF'
[filled and adapted template content]
EOF
```

Tell the user:

- **Processing Checklist** → `doc/processing-checklist.html`

Checklist state (checked steps) persists across browser reloads via `localStorage`, keyed by DSO slug.

---

### Step 5c — Generate astrobin.json

Build the AstroBin post fields JSON from all previously collected data (Steps 2, 3, 4).

#### 5c.1 — Field mapping rules

| AstroBin field | Source | Rules |
|---|---|---|
| `title` | `common_name` + `target` from project.json | Format: `"Common Name (DSO_ID)"` — e.g. `"Sombrero Galaxy (NGC 4594)"` |
| `description` | Research data (Step 3) + acquisition summary | 3–5 sentences in English. Scientific summary + total integration + filter set. Plain text, no HTML. |
| `link` | Telescope.live dataset URL if applicable | See 5c.2 below |
| `image_file` | — | Always `""` — user uploads the image manually |
| `imaging_telescopes` | `telescope` from project.json | Array of objects — see 5c.3 |
| `imaging_cameras` | `camera` from project.json | Array of objects — see 5c.3 |
| `mounts` | — | Empty array `[]` unless user provided mount info in Block A |
| `filters` | `filter` from project.json | Array of objects — one per channel — see 5c.4 |
| `software` | Always PixInsight | Fixed value — see 5c.3 |
| `location` | `site` + `site_coords` from project.json | Object — see 5c.3 |
| `acquisition_details` | `sessions` array from project.json | Array of objects — one per filter channel — see 5c.5 |
| `first_acquisition_date` | Earliest date parsed from sessions | `YYYY-MM-DD` format |
| `last_acquisition_date` | Latest date parsed from sessions | `YYYY-MM-DD` format |
| `data_source` | `"OWN"` or `"AMATEUR_HOSTING"` | `"AMATEUR_HOSTING"` if site contains "telescope.live", "itelescope", "lightbuckets", "slooh"; otherwise `"OWN"` |
| `remote_source` | Remote hosting label | `"TELELIVE"` if telescope.live; `"ITELESCOPE"` if iTelescope; `""` otherwise |
| `subject_type` | Derived from `object_type` in project.json | See 5c.6 |

#### 5c.2 — Dataset link (telescope.live)

If `site` or `telescope` contains "telescope.live" or "Telescope.live":

- Set `link` to `"https://app.telescope.live/archive"` as the default dataset URL.
- If the user provided a specific dataset URL in Block D, use it instead.
- Otherwise set `link` to `""`.

#### 5c.3 — Equipment objects

**imaging_telescopes** — one object per telescope:

```json
{
  "name": "Telescope.live Remote Observatory",
  "aperture": null,
  "focal_length": null,
  "type": "REFRACTOR"
}
```

Parse aperture (mm) and focal length (mm) from the telescope string if present (e.g. `"50mm f/4"` → `aperture: 50, focal_length: 200`).
Type heuristics: contains "Newton" or "Newtonian" → `"NEWTONIAN"`, "Cassegrain" or "SCT" → `"SCT"`, "Refractor" or "APO" or "ED" or "f/" → `"REFRACTOR"`, "Reflector" → `"REFLECTOR"`, otherwise `"OTHER"`.

**imaging_cameras** — one object:

```json
{
  "name": "QHY 600M",
  "type": "CCD",
  "modified": false
}
```

Type: if camera name contains "IMX", "CMOS", "ASI", "QHY", "ZWO", "Atik Horizon" → `"CCD"` (AstroBin uses CCD for all dedicated astro cameras). `modified` always `false` unless user stated "modded" or "full spectrum".

**software** — always:

```json
[{"name": "PixInsight", "version": ""}]
```

#### 5c.4 — Filters array

Parse the `filter` field from project.json. Produce one object per distinct channel:

```json
{
  "name": "Luminance",
  "type": "L",
  "bandwidth": null,
  "vendor": "",
  "model": ""
}
```

Filter type mapping:

| Channel keyword | AstroBin type |
|---|---|
| Luminance, Lum, L | `"L"` |
| Red, R | `"R"` |
| Green, G | `"G"` |
| Blue, B | `"B"` |
| Hα, Ha, H-alpha | `"Ha"` |
| OIII, O3 | `"OIII"` |
| SII, S2 | `"SII"` |
| Dual-band, dual band | produce two objects: `"Ha"` + `"OIII"` |
| Tri-band, tri band | produce three objects: `"Ha"` + `"OIII"` + `"SII"` |

If the filter string includes a bandwidth (e.g. `"3nm"`, `"6.5nm"`, `"7 nm"`), set `bandwidth` to the numeric value in nm. Extract vendor/model if present (e.g. `"Antlia 3nm Ha"` → `vendor: "Antlia"`, `model: "3nm Ha"`).

#### 5c.5 — Acquisition details (DeepSky sessions)

Produce one object per filter channel. Parse per-channel data from the `sessions` array (same logic as Step 5b.2).

```json
{
  "filter": "Luminance",
  "filter_type": "L",
  "number": 36,
  "duration": 300,
  "binning": 1,
  "gain": null,
  "sensor_cooling": null,
  "darks": null,
  "flats": null,
  "flat_darks": null,
  "bias": null,
  "bortle": null,
  "mean_sqm": null,
  "mean_fwhm": null,
  "temperature": null,
  "date": "YYYY-MM-DD"
}
```

Field rules:

- `number` — sub count for this filter channel
- `duration` — sub duration in seconds (parse from filename or session string, e.g. `300s`, `300.00s`)
- `binning` — always `1` unless user specified otherwise
- `gain` — parse from filename if present (e.g. `_GAIN100_`), otherwise `null`
- `bortle` — parse from Block D notes if user mentioned Bortle class, otherwise `null`
- `date` — use the first date found for this filter in the sessions array; format `YYYY-MM-DD`
- All other fields `null` unless explicitly provided by the user

#### 5c.6 — Subject type mapping

| object_type contains | AstroBin subject_type |
|---|---|
| Galaxy, Galaxies | `"GALAXY"` |
| Nebula, HII, H II, Emission | `"NEBULA"` |
| Cluster, Open cluster | `"OPEN_CLUSTER"` |
| Globular | `"GLOBULAR_CLUSTER"` |
| Planetary nebula | `"PLANETARY_NEBULA"` |
| Supernova remnant, SNR | `"SUPERNOVA_REMNANT"` |
| Solar system | `"SOLAR_SYSTEM_BODY"` |
| Other / unknown | `"OTHER"` |

#### 5c.7 — Save the file

Save as `./astrobin.json` (pretty-printed, 2-space indent — unlike project.json this one is for human reading):

```bash
cat > ./astrobin.json << 'EOF'
{
  "title": "...",
  ...
}
EOF
```

**Example output** (M104, LRGB, Telescope.live):

```json
{
  "title": "Sombrero Galaxy (NGC 4594)",
  "description": "The Sombrero Galaxy (NGC 4594) is a spectacular Sa/Sb spiral galaxy in Virgo, located approximately 28 million light-years away. Its iconic silhouette features a brilliant central bulge bisected by a prominent dust lane. Imaged in LRGB from the Telescope.live Chile remote observatory using a QHY 600M camera over 10 hours of total integration (36×300s Luminance, 27×300s Red, 29×300s Green, 28×300s Blue). Processed in PixInsight.",
  "link": "https://app.telescope.live/archive",
  "image_file": "",
  "imaging_telescopes": [
    {
      "name": "Telescope.live Remote Observatory",
      "aperture": null,
      "focal_length": null,
      "type": "REFRACTOR"
    }
  ],
  "imaging_cameras": [
    {
      "name": "QHY 600M",
      "type": "CCD",
      "modified": false
    }
  ],
  "mounts": [],
  "filters": [
    { "name": "Luminance", "type": "L", "bandwidth": null, "vendor": "", "model": "" },
    { "name": "Red",       "type": "R", "bandwidth": null, "vendor": "", "model": "" },
    { "name": "Green",     "type": "G", "bandwidth": null, "vendor": "", "model": "" },
    { "name": "Blue",      "type": "B", "bandwidth": null, "vendor": "", "model": "" }
  ],
  "software": [
    { "name": "PixInsight", "version": "" }
  ],
  "location": {
    "name": "Chile Remote Observatory",
    "coords": "Chile · Southern Hemisphere"
  },
  "subject_type": "GALAXY",
  "data_source": "AMATEUR_HOSTING",
  "remote_source": "TELELIVE",
  "first_acquisition_date": "2023-02-15",
  "last_acquisition_date": "2025-03-06",
  "acquisition_details": [
    {
      "filter": "Luminance", "filter_type": "L",
      "number": 36, "duration": 300, "binning": 1,
      "gain": null, "sensor_cooling": null,
      "darks": null, "flats": null, "flat_darks": null, "bias": null,
      "bortle": null, "mean_sqm": null, "mean_fwhm": null, "temperature": null,
      "date": "2023-02-15"
    },
    {
      "filter": "Red", "filter_type": "R",
      "number": 27, "duration": 300, "binning": 1,
      "gain": null, "sensor_cooling": null,
      "darks": null, "flats": null, "flat_darks": null, "bias": null,
      "bortle": null, "mean_sqm": null, "mean_fwhm": null, "temperature": null,
      "date": "2023-02-15"
    },
    {
      "filter": "Green", "filter_type": "G",
      "number": 29, "duration": 300, "binning": 1,
      "gain": null, "sensor_cooling": null,
      "darks": null, "flats": null, "flat_darks": null, "bias": null,
      "bortle": null, "mean_sqm": null, "mean_fwhm": null, "temperature": null,
      "date": "2023-02-15"
    },
    {
      "filter": "Blue", "filter_type": "B",
      "number": 28, "duration": 300, "binning": 1,
      "gain": null, "sensor_cooling": null,
      "darks": null, "flats": null, "flat_darks": null, "bias": null,
      "bortle": null, "mean_sqm": null, "mean_fwhm": null, "temperature": null,
      "date": "2023-02-15"
    }
  ]
}
```

Tell the user:

- **AstroBin post fields** → `astrobin.json`
- Fields `imaging_telescopes`, `imaging_cameras`, `filters`, `acquisition_details` map 1:1 to AstroBin's "Equipment" and "Acquisition" sections.
- `image_file` must be filled manually when uploading.

---

### Step 5d — Generate Process Icons XPSM

Generate a PixInsight process icon set (`.xpsm`) tailored to the detected workflow mode (Step 5b.1) and the specific target.

#### 5d.1 — Filename

```
Process Icons - <common_name> - <workflow_type> workflow.xpsm
```

- `<common_name>` → `common_name` from project.json, spaces preserved (e.g. `Sombrero Galaxy`)
- `<workflow_type>` → detected workflow mode, title-cased: `LRGB`, `RGB`, `HOO`, `SHO`, `HaRGB`

Example: `Process Icons - Sombrero Galaxy - LRGB workflow.xpsm`

Save to the current working directory (not inside `doc/`).

#### 5d.2 — XPSM file structure

All XPSM files share this skeleton:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  PixInsight XML Process Serialization Module - XPSM 1.0
  Generated: <GENERATED_DATE>
  Target: <DSO_ID> — <COMMON_NAME>
  Workflow: <WORKFLOW_TYPE>
-->
<xpsm version="1.0"
  xmlns="http://www.pixinsight.com/xpsm"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.pixinsight.com/xpsm http://pixinsight.com/xpsm/xpsm-1.0.xsd">

  [instance blocks]

  [icon blocks]

</xpsm>
```

Rules:

- Every `<instance>` block must have a unique `id` ending in `_instance`
- Every `<icon>` block references its instance via `instance="<id>"`
- `xpos` always `2000`, `ypos` increments of `40` per icon from top
- `workspace` always `"Workspace01"`
- The `<description>` element on each instance must state the phase number, step number, and a one-line usage note

#### 5d.3 — LRGB workflow icon set

Generate the following instances and icons **in this exact order**:

**PHASE 02 — Luminance Linear (no stretch)**

| Icon ID | Class | Key parameters | Description |
|---|---|---|---|
| `STF_AutoStretch` | `ScreenTransferFunction` | 4 rows, c0=0.01732, m=0.02099, c1=1.0; interaction=Grayscale | Visual check only — do NOT apply permanently |
| `BXT_CorrectOnly_Lum` | `BlurXTerminator` | correct_only=true, sharpen_stars=0.25, sharpen_nonstellar=0.90, auto_nonstellar_psf=true | First pass on Lum linear — PSF correction only |
| `BXT_Full_Lum` | `BlurXTerminator` | correct_only=false, sharpen_stars=0.25, sharpen_nonstellar=0.90, auto_nonstellar_psf=true | Second pass on Lum linear — full sharpening |
| `NXT_Lum` | `NoiseXTerminator` | denoise=0.70, enable_color_separation=false, iterations=2, detail=0.15 | Mono channel — color separation OFF |

**PHASE 03 — RGB Linear (no stretch)**

| Icon ID | Class | Key parameters | Description |
|---|---|---|---|
| `ChannelCombination` | `ChannelCombination` | colorSpace=RGB, 3 rows enabled=true id="" | Assemble R+G+B linear masters |
| `SPCC` | `SpectrophotometricColorCalibration` | applyCalibration=true, catalogId=GaiaDR3SP, autoLimitMagnitude=true, neutralizeBackground=true | Color calibration — run ImageSolver first |
| `BXT_CorrectOnly_RGB` | `BlurXTerminator` | correct_only=true, sharpen_stars=0.25, sharpen_nonstellar=0.90 | First pass on RGB linear |
| `BXT_Full_RGB` | `BlurXTerminator` | correct_only=false, sharpen_stars=0.25, sharpen_nonstellar=0.90 | Second pass on RGB linear |
| `NXT_RGB` | `NoiseXTerminator` | denoise=0.70, enable_color_separation=true, denoise_color=0.90, iterations=2 | Color channel — separation ON |

**PHASE 04 — LRGB Combination (linear)**

| Icon ID | Class | Key parameters | Description |
|---|---|---|---|
| `LRGBCombination` | `LRGBCombination` | clipHighlights=true, noiseReduction=false, layersRemoved=4, layersProtected=2, 4 channel rows enabled=true k=1.0 (first row k=0.5 for L), mL=0.500, mc=0.500 | Apply on linear RGB — L must be monochrome (ConvertToGrayscale if needed). All weights = 1.0 |

**PHASE 05 — Stretch LRGB**

| Icon ID | Class | Key parameters | Description |
|---|---|---|---|
| `Stretch_LRGB` | `GeneralizedHyperbolicStretch` | stretchType=ST_GeneralisedHyperbolic, stretchChannel=SC_RGB, stretchFactor=0.200, symmetryPoint=0.059964, highlightProtection=0.500 | Stretch combined LRGB — after LRGBCombination |
| `SCNR` | `SCNR` | amount=1.00, protectionMethod=AverageNeutral, colorToRemove=Green, preserveLightness=true | Remove green cast after stretch |

**PHASE 06 — Star Separation**

| Icon ID | Class | Key parameters | Description |
|---|---|---|---|
| `StarXTerminator` | `StarXTerminator` | stars=true, unscreen=true, overlap=0.20 | Separate stars and starless from stretched LRGB |
| `Curves_Stars_Sat` | `CurvesTransformation` | S channel: 3 rows (0→0, 0.5→0.58, 1→1); all other channels: identity 2 rows | Saturation boost on Stars-only image |

**PHASE 07 — Starless LRGB Processing**

| Icon ID | Class | Key parameters | Description |
|---|---|---|---|
| `GHS_Starless` | `GeneralizedHyperbolicStretch` | stretchType=ST_GeneralisedHyperbolic, stretchChannel=SC_RGB, stretchFactor=0.200, symmetryPoint=0.059964, highlightProtection=0.500 | Pull faint structures — adjust HP and SP per target |
| `LHE` | `LocalHistogramEqualization` | radius=64, histogramBins=Bit12, slopeLimit=2.0, amount=0.500, circularKernel=true | Local contrast — conservative on LRGB |
| `UnsharpMask` | `UnsharpMask` | sigma=2.00, amount=0.40, useLuminance=true, linear=false, deringing=false | Moderate — Lum already provides sharpness |
| `NXT_Starless` | `NoiseXTerminator` | denoise=0.70, enable_color_separation=true, denoise_color=0.90, iterations=1, detail=0.15 | 2nd pass on starless — ~70% strength |

**PHASE 08 — Recombination**

| Icon ID | Class | Key parameters | Description |
|---|---|---|---|
| `PixelMath_Rescreen` | `PixelMath` | expression=`~((~starless)*(~stars))`, useSingleExpression=true, createNewImage=true, newImageColorSpace=RGB | Drag onto starless image — IDs must match open windows |

**PHASE 09 — Finalization**

| Icon ID | Class | Key parameters | Description |
|---|---|---|---|
| `Curves_Final` | `CurvesTransformation` | K channel: 4 rows (0→0, 0.25→0.22, 0.75→0.78, 1→1); L channel: 3 rows (0→0, 0.5→0.53, 1→1); S channel: 3 rows (0→0, 0.5→0.55, 1→1); all others identity | S-curve + midtone lift + saturation boost |
| `ICCProfileTransformation` | `ICCProfileTransformation` | targetProfile=`sRGB IEC61966-2.1`, toDefaultProfile=false, renderingIntent=RelativeColorimetric, useBlackPointCompensation=true | Last step before export |

#### 5d.4 — RGB workflow icon set

Same as LRGB but:

- **Remove** `NXT_Lum`, `BXT_CorrectOnly_Lum`, `BXT_Full_Lum`, `STF_AutoStretch` (Lum phase entirely absent)
- **Remove** `LRGBCombination`
- **Add** `Stretch_RGB` (same GHS parameters as `Stretch_LRGB`) immediately after `NXT_RGB`
- Renumber phases: Phase 02 → RGB linear, Phase 03 → Stretch RGB, Phase 04 → Star separation, etc.

#### 5d.5 — HOO / SHO narrowband workflow icon set

Same base as RGB but:

- **Replace** `ChannelCombination` with `PixelMath_HOO` or `PixelMath_SHO`:

HOO PixelMath expression (3-channel: R=Ha, G=blend, B=OIII):

```
R: $T[0]*BrightnessControl
G: k= adev($T[0])/adev($T[1]); g1= ((k*OIIIBoost)*($T[1]-med($T[1]))+med($T[0])); iif(OIII_SCurve==0,g1,3*g1^2-2*g1^3)*BrightnessControl
B: k= adev($T[0])/adev($T[1]); b1= ((k*OIIIBoost)*($T[1]-med($T[1]))+med($T[0])); iif(OIII_SCurve==0,b1,3*b1^2-2*b1^3)*BrightnessControl
Symbols: OIIIBoost=1.0; HaBlend=0.6; BrightnessControl=1.0; OIII_SCurve=0; k,g1,b1
```

- **Remove** `SPCC` → replace with a `SCNR` at green (for magenta star correction after narrowband palette)
- **Add** `CorrectMagentaStars` note in description (Script-based, no XPSM instance available)

#### 5d.6 — ypos layout

Icons are placed top-to-bottom in a single column at `xpos=2000`, starting at `ypos=40`, incrementing by `40` per icon. A gap of `80` (one empty slot) separates each phase boundary.

| Phase | Start ypos |
|---|---|
| Phase 02 | 40 |
| Phase 03 | 40 + (n_phase02 × 40) + 80 |
| Phase 04 | previous + (n_phase03 × 40) + 80 |
| … | … |

#### 5d.7 — Save the file

```bash
cat > "Process Icons - <common_name> - <workflow_type> workflow.xpsm" << 'EOF'
[generated XPSM content]
EOF
```

Tell the user:

- **Process Icons** → `Process Icons - <common_name> - <workflow_type> workflow.xpsm`
- Import in PixInsight via **File → Import Process Icons**
- Icon descriptions include phase, step number, and usage reminders
- Image IDs in `PixelMath_Rescreen` (`starless`, `stars`) must match actual open window names in PixInsight

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

See `references/rig.schema.json` for the full JSON Schema used to validate `rig.json` (Step 0.5).
See `references/documentation-template.html` for the full annotated documentation template.
See `references/processing-checklist-template.html` for the full annotated checklist template.

### Documentation template (`references/documentation-template.html`)

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

### Checklist template (`references/processing-checklist-template.html`)

Key placeholders:

- `{{DSO_ID}}` — e.g. `NGC 4594` (display) and `ngc-4594` (slug for IDs and localStorage)
- `{{COMMON_NAME}}` — e.g. `Sombrero Galaxy`
- `{{CONSTELLATION}}` — full name
- `{{OBJECT_TYPE}}` — uppercased, e.g. `SPIRAL GALAXY`
- `{{CAMERA}}` — e.g. `QHY 600M`
- `{{INSTRUMENT}}` — e.g. `Telescope.live Remote Observatory`
- `{{FILTER}}` — e.g. `LRGB`
- `{{SITE}}` — e.g. `Chile Remote Observatory`
- `{{TOTAL_EXPOSURE}}` — e.g. `10h 00m`
- `{{TOTAL_SUBS}}` — integer only, e.g. `120`
- `{{LUM_TIME}}` — e.g. `3h 00m (36 × 300s)`
- `{{RED_TIME}}`, `{{GREEN_TIME}}`, `{{BLUE_TIME}}` — per-channel exposure
- `{{HA_TIME}}`, `{{OIII_TIME}}`, `{{SII_TIME}}` — narrowband channels (omit if absent)
- `{{GENERATED_DATE}}` — `YYYY-MM-DD`
- `{{AUTHOR}}` — observer name / location
- `{{DSO_NOTES}}` — free-text processing notes (omit section 11 if empty)

### AstroBin JSON (`astrobin.json`)

Key fields and their sources:

| Field | Source |
|---|---|
| `title` | `"{{COMMON_NAME}} ({{DSO_ID}})"` |
| `description` | 3–5 sentences from research + acquisition summary |
| `link` | `"https://app.telescope.live/archive"` if telescope.live, else `""` |
| `imaging_telescopes[].name` | `telescope` from project.json |
| `imaging_telescopes[].aperture` | parsed from telescope string (mm) or `null` |
| `imaging_telescopes[].focal_length` | parsed from telescope string (mm) or `null` |
| `imaging_telescopes[].type` | heuristic from telescope string |
| `imaging_cameras[].name` | `camera` from project.json |
| `imaging_cameras[].type` | always `"CCD"` for dedicated astro cameras |
| `filters[].type` | mapped from filter channel name |
| `filters[].bandwidth` | parsed from filter string (nm) or `null` |
| `software` | always `[{"name": "PixInsight", "version": ""}]` |
| `location.name` | `site` from project.json |
| `location.coords` | `site_coords` from project.json |
| `subject_type` | mapped from `object_type` |
| `data_source` | `"AMATEUR_HOSTING"` or `"OWN"` |
| `remote_source` | `"TELELIVE"`, `"ITELESCOPE"`, or `""` |
| `first_acquisition_date` | earliest date from sessions |
| `last_acquisition_date` | latest date from sessions |
| `acquisition_details[].filter` | channel name |
| `acquisition_details[].number` | sub count for that channel |
| `acquisition_details[].duration` | sub duration in seconds |

| Class | Color | Meaning |
|---|---|---|
| `tag-lum` | mauve | Luminance channel only |
| `tag-rgb` | blue | RGB channels |
| `tag-ha` | red | Hα channel |
| `tag-oiii` | sapphire | OIII channel |
| `tag-nb` | yellow | Generic narrowband |
| `tag-lrgb` | pink | LRGB combined step |
| `tag-warn` | peach | Target-specific warning |
| `tag-tip` | teal | Optional / tip |

---

## Quality Standards

**`rig.json` (Step 0):**

- Only `raw/` (and its `light`/`dark`/`flat` subfolders) is assumed to exist before bootstrapping — every other directory is created by Step 0.2, never assumed present
- Always validated against `references/rig.schema.json` before being presented as final — a failed validation is fixed and re-checked, never shipped
- Pretty-printed with 2-space indent (human-readable, hand-editable)
- Values actually read from FITS headers are never overwritten by guesses — if a header field is missing, the corresponding rig.json field is left for the user to fill (Step 0.4), never fabricated
- Distinct exposures/gains/bins within the same filter are kept as separate `sequences` entries — never merged or averaged
- `sequences.lights[]`, `.darks[]`, `.flats[]` subs counts always match the actual file count found on disk at bootstrap time
- No CAA/rotator field unless the user's rig actually has one — omit entirely rather than null it out

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

**`doc/processing-checklist.html`:**

- `doc/` directory created automatically if absent (same run as index.html)
- All 4 Catppuccin flavors wired up with the same theme switcher and localStorage key
- Checklist state (checked / unchecked steps) persists via `localStorage` keyed by DSO slug
- Workflow mode (LRGB / RGB / HOO / SHO / HαRGB) correctly detected and applied
- Unused filter channels removed from data grid and legend
- Section numbers resequenced after any section removal
- Export filenames match the detected workflow mode
- All `{{DSO_ID}}` occurrences in HTML attributes replaced with the slug version
- `STORAGE_KEY` constant in the `<script>` block updated to `checklist-{dso-slug}`

**`astrobin.json`:**

- Pretty-printed with 2-space indent (human-readable)
- `title` follows the format `"Common Name (DSO_ID)"`
- `description` is plain text, 3–5 sentences, no HTML or markdown
- `link` set to `"https://app.telescope.live/archive"` for telescope.live data; `""` otherwise
- `filters` array contains one object per distinct channel — never merge channels
- `acquisition_details` contains one object per channel with correct `number` and `duration`
- `data_source` and `remote_source` correctly reflect the imaging site
- `subject_type` derived from `object_type` using the mapping table in 5c.6
- `software` always `[{"name": "PixInsight", "version": ""}]`
- `mounts` always `[]` unless user provided mount information explicitly
- All numeric fields use numbers, not strings (`300` not `"300"`)
- All unknown/unparseable fields use `null`, never empty string `""`
- `first_acquisition_date` and `last_acquisition_date` in `YYYY-MM-DD` format

**`Process Icons - <name> - <workflow> workflow.xpsm`:**

- Filename exactly follows the pattern `Process Icons - <common_name> - <workflow_type> workflow.xpsm`
- Workflow type derived from filter set detection (Step 5b.1): `LRGB`, `RGB`, `HOO`, `SHO`, `HaRGB`
- All `<instance>` IDs end in `_instance`; all `<icon>` IDs are clean names without suffix
- `histogramBins` on `LocalHistogramEqualization` always uses enum value `Bit12` — never an integer
- `LRGBCombination` only includes known valid parameters: `clipHighlights`, `noiseReduction`, `layersRemoved`, `layersProtected`, `channels` table, `mL`, `mc`
- `ICCProfileTransformation` only includes: `targetProfile`, `toDefaultProfile`, `renderingIntent`, `useBlackPointCompensation`
- Icon layout: single column at `xpos=2000`, `ypos` starts at `40`, increments `40` per icon, `80` gap between phases
- `PixelMath_Rescreen` expression always `~((~starless)*(~stars))` — description reminds user to match image IDs
- Narrowband PixelMath expressions use XML-escaped `<` as `&lt;`
- XPSM workflow type matches the checklist workflow detected in Step 5b.1 — never hardcoded

---

## Edge Cases

| Situation | Handling |
|---|---|
| DSO not well-documented | Note gaps; still generate all three outputs with available data |
| Directory path given but empty | Ask user to paste filenames manually |
| No session files provided | `sessions: []` in JSON; omit Section 08 from index.html; use `—` in checklist |
| Galaxy / cluster instead of nebula | Skip narrowband tip cards; adapt physical description |
| User skips optional questions | Use `""` in JSON; use `—` placeholders in HTML |
| File extensions unexpected | Accept `.png`, `.jpeg`, `.dng`, `.raf` as well |
| User wants JSON only | Run Steps 1, 2, 4 only — skip Steps 3, 5, 5b, 5c, 5d |
| User wants HTML only | Run Steps 1, 2, 3, 5 only — skip Steps 4, 5b, 5c, 5d |
| User wants checklist only | Run Steps 1, 2, 5b only — skip Steps 3, 4, 5, 5c, 5d |
| User wants astrobin only | Run Steps 1, 2, 4, 5c only — skip Steps 3, 5, 5b, 5d |
| Smart telescope (no separate calibration) | `calibration: "Handled internally by the instrument"` — replace Phase 01 in checklist |
| `doc/` already exists | Overwrite HTML files silently — never error on existing directory |
| Pure narrowband (HOO / SHO) | Remove Luminance phase and LRGB combination phase from checklist |
| HαRGB blend | Keep LRGB structure; add PixelMath Hα blend step after ChannelCombination |
| Per-channel times not parseable | Use `—` in checklist data cells; do not fail |
| User wants XPSM only | Run Steps 1, 2, 4, 5b (detection only), 5d — skip Steps 3, 5, 5b (HTML), 5c |
| HOO workflow XPSM | Replace ChannelCombination with PixelMath_HOO; remove SPCC; add SCNR for magenta stars |
| SHO workflow XPSM | Replace ChannelCombination with PixelMath_SHO; same SPCC/SCNR substitution |
| Smart telescope XPSM | Remove Lum phase entirely; adjust phase numbering in icon layout |
| Common name has special chars | Strip `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `\|` from filename |
| User wants astrobin only | Run Steps 1, 2, 4, 5c only — skip Steps 3, 5, 5b |
| Dual-band filter (Ha+OIII built-in) | Produce two filter objects in astrobin.json: Ha + OIII |
| Tri-band filter | Produce three filter objects: Ha + OIII + SII |
| No date parseable from sessions | Set `first_acquisition_date` and `last_acquisition_date` to `null` |
| Mount info not provided | `mounts: []` — do not guess or invent |
| Non-telescope.live remote site | Set `data_source: "AMATEUR_HOSTING"`, `remote_source: ""` |
| OWN backyard imaging | Set `data_source: "OWN"`, `remote_source: ""` |
| Gain parseable from filenames | Include numeric gain value in `acquisition_details[].gain` |
| Bortle class mentioned in notes | Include in all `acquisition_details[].bortle` entries |
| Working directory has only `raw/` | Bootstrap trigger (Step 0) — create the rest of the structure and generate `rig.json` |
| `raw/light`, `raw/dark`, or `raw/flat` missing | Create the missing subfolder(s) empty — a campaign may legitimately have no darks (bias-only) or no flats yet |
| No FITS files found in `raw/light` | Fall back to Step 2 manual entry — do not fail the bootstrap |
| `rig.json` already exists | Ask the user: reuse as-is, or overwrite — never overwrite silently |
| `rig.json` fails schema validation | Fix the offending field and re-validate before presenting it as final |
| `astropy` install fails | Ask the user to paste a representative FITS header manually, or fall back to Step 2 |
| `SITELAT`/`SITELONG` missing from headers | Ask the user for GPS coordinates in Step 0.4 |
| Mixed exposures/gains/bins within one filter | List as separate `sequences` entries — never average or discard |
| Multiple distinct `OBJECT` values across `raw/light` | Flag to the user — a target folder should contain exactly one DSO's data; ask which is correct or whether files need sorting first |
| CAA/rotator not present on the rig | Omit any rotation/CAA field from `rig.json` entirely — do not include it as `null` |
