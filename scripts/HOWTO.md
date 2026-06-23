# scripts/ — Developer Tooling

All scripts run from the **repo root** (`samskruti/`), not from inside `scripts/`.

---

## Scripts at a glance

| Script | What it does |
|--------|-------------|
| `sub-info.py` | Inspect, validate and search subhashitam data |
| `gen-stotram-images.py` | Generate 8 SVG card images per stotram (96 total) |
| `gen-favicons.py` | Generate 36 favicon design variants for review |
| `check-images.py` | Verify Telugu / Devanagari / Latin titles are embedded in every image |

---

## gen-stotram-images.py

Generates `assets/images/<slug>-01.svg` through `<slug>-08.svg` for all 12 stotrams.

- Titles are pulled from `data/<slug>/<slug>_meta.json` (preferred) with fallback to `data/stotrams.json`
- Colour palette is driven by the stotram's `theme` field
- 8 layout variants per stotram: OM rings, lotus, starburst, yantra, sun rays, diamond frame, manuscript, mandala

```bash
# Regenerate all 96 images
python3 scripts/gen-stotram-images.py
```

Output goes to `assets/images/`. Existing files are overwritten.

---

## gen-favicons.py

Generates 36 favicon variants (6 symbol designs × 6 colour schemes) into `assets/icons/options/`.

```bash
# Generate all favicon options
python3 scripts/gen-favicons.py
```

Browse `assets/icons/options/` in Finder or a browser, pick your favourite, then copy it to `assets/icons/`:

```bash
# Example: pick om-circle in indigo-gold
cp assets/icons/options/om-circle_indigo-gold.svg assets/icons/icon.svg
```

Symbol designs: `om-plain`, `om-circle`, `om-diamond`, `lotus-om`, `stotram`, `sri-yantra`
Colour schemes: `indigo-gold`, `saffron-maroon`, `maroon-gold`, `forest-gold`, `teal-gold`, `purple-silver`

---

## check-images.py

Parses every generated SVG and confirms all three title scripts are present.

### Usage

```bash
# All stotrams, variant 01 only — quick sanity check
python3 scripts/check-images.py

# All stotrams, all 8 variants — full check
python3 scripts/check-images.py 01 08

# One specific variant across all stotrams
python3 scripts/check-images.py 04

# One stotram (partial slug match), all 8 variants
python3 scripts/check-images.py kalabhairava
python3 scripts/check-images.py surya
python3 scripts/check-images.py vishnu

# One stotram, specific variant range
python3 scripts/check-images.py surya 02 05
python3 scripts/check-images.py lalita 03 06
```

### Example output

```
────────────────────────────────────────────────────────
✓ OK    vishnu-sahasranamam-01.svg
        te › విష్ణు సహస్రనామ స్తోత్రం
        sa › विष्णु सहस्रनामस्तोत्रम्
        en › VISHNU SAHASRANAMAM
✓ OK    lalita-sahasranamam-01.svg
        te › లలితా సహస్రనామ స్తోత్రం
        sa › ललितासहस्रनामस्तोत्रम्
        en › LALITA SAHASRANAMAM
...
────────────────────────────────────────────────────────
  passed: 12   failed: 0   total: 12
────────────────────────────────────────────────────────
```

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | All checked images pass |
| `1` | One or more images are missing a title or the file is absent |

Chain with other commands:

```bash
# Only commit images if all pass
python3 scripts/check-images.py 01 08 && git add assets/images/ && git commit -m "Add stotram card images"

# Regenerate then immediately verify
python3 scripts/gen-stotram-images.py && python3 scripts/check-images.py 01 08
```

---

---

## sub-info.py

Inspect, validate, and search subhashitam data from the command line. Run from the repo root.

```bash
# Category summary and counts
python3 scripts/sub-info.py

# Validate all 100 entries (checks fields, scripts, bilingual completeness)
python3 scripts/sub-info.py --validate

# List all entries: id, slug, source
python3 scripts/sub-info.py --list

# Show full detail for one entry (by id or slug)
python3 scripts/sub-info.py --show karma-001
python3 scripts/sub-info.py --show karmanyevadhikaraste

# All tags and their counts
python3 scripts/sub-info.py --tags

# Filter entries by tag
python3 scripts/sub-info.py --tag gita
python3 scripts/sub-info.py --tag shankara

# Find entries where a field is empty (useful before shipping Sanskrit UI)
python3 scripts/sub-info.py --missing shlokam.sa
python3 scripts/sub-info.py --missing tatparyam.te

# All sources sorted alphabetically with entry counts
python3 scripts/sub-info.py --sources

# Look up full detail by slug
python3 scripts/sub-info.py --slug satyameva-jayate
python3 scripts/sub-info.py --slug karmanyevadhikaraste
```

---

## Adding a subhāṣitam

Subhāṣitams live in `data/subhashitam/` and are indexed by `data/subhashitam/_index.json`.

### File layout

```
data/subhashitam/
├── _index.json              # master list (id, file, slug, category, tags, preview)
├── niti/
│   ├── niti-001.json
│   └── ...
├── dharma/
├── karma/
├── seva/
├── vairagya/
└── bhakti/
```

### Steps to add a new verse

1. Pick a category directory (or create one for a new category)
2. Number the file sequentially: `niti-016.json`, `bhakti-006.json`, etc.
3. Copy an existing JSON as template — required fields:

```json
{
  "id": "niti-016",
  "tags": ["niti", "udyama"],
  "shlokam": {
    "te": "...",
    "sa": "...",
    "iast": "..."
  },
  "chandaH": "...",
  "granthaH": { "name_te": "...", "name_en": "..." },
  "padavibhagam": { "te": "...", "en": "..." },
  "anvayam": { "te": "...", "en": "..." },
  "meaning": { "te": "...", "en": "..." },
  "tatparyam": { "te": "...", "en": "..." }
}
```

4. Add an entry to `_index.json`:

```json
{
  "id": "niti-016",
  "file": "niti/niti-016.json",
  "slug": "udyamena-hi-sidhyanti",
  "category": "niti",
  "tags": ["udyama", "purusha"],
  "preview": { "te": "...", "sa": "...", "en": "..." }
}
```

### Slug naming convention

- Use the opening words of the verse, transliterated
- **Do not split Sanskrit compound words (sandhi forms) with hyphens** — keep them as one unit
  - ✅ `karmanyevadhikaraste`
  - ❌ `karmany-eva-adhikaras-te`
- Hyphens are only for clearly separate words
- Once published, a slug must never change (it is the permanent URL)

---

## Typical workflow

```bash
# 1. Regenerate all images (e.g. after title data changes)
python3 scripts/gen-stotram-images.py

# 2. Verify all titles are embedded
python3 scripts/check-images.py 01 08

# 3. Open assets/images/ in Finder to visually review
open assets/images/

# 4. Regenerate favicons if needed
python3 scripts/gen-favicons.py
open assets/icons/options/

# 5. Install chosen favicon
cp assets/icons/options/<chosen>.svg assets/icons/icon.svg

# 6. Commit
git add assets/images/ assets/icons/
git commit -m "Add stotram card images and favicon"
git push
```
