# సమస్కృతి · Samskruti

A progressive web app for Sanskrit devotional texts — stotrams and subhāṣitams — served in Telugu script, Devanagari, and IAST transliteration.

🌐 **Live site:** [samskruti.info](https://samskruti.info)

---

## Features

- 12 stotrams with full shloka text
- 50 subhāṣitams across 6 categories (niti, dharma, karma, seva, vairagya, bhakti)
- Three scripts: Telugu · Devanagari · IAST
- Bilingual UI: Telugu / English
- Bookmarks, audio sync, search
- PWA — installable, works offline

## Stotrams

| Slug | Title |
|------|-------|
| `vishnu-sahasranamam` | విష్ణు సహస్రనామ స్తోత్రం |
| `lalita-sahasranamam` | లలితా సహస్రనామ స్తోత్రం |
| `soundaryalahari` | సౌన్దర్యలహరీ |
| `surya-siddhanta` | సూర్యసిద్ధాంతం |
| `nava-graha-stotram` | నవగ్రహ స్తోత్రమ్ |
| `krishna-ashtakam` | కృష్ణాష్టకమ్ |
| `sarasvati-dvadasha` | సరస్వతీద్వాదశనామస్తోత్రమ్ |
| `nataraja` | నటరాజస్తోత్రమ్ |
| `nava-ratnamala` | నవరత్నమాలాస్తోత్రమ్ |
| `kalabhairava-ashtakam` | కాలభైరవాష్టకమ్ |
| `toTaka` | తోటకాష్టకమ్ |
| `surya` | శ్రీసూర్యాష్టకమ్ |

## Repo structure

```
samskruti/
├── index.html
├── manifest.json
├── service-worker.js
├── assets/
│   ├── css/main.css
│   ├── js/
│   │   ├── app.js              # routing, reader, cards
│   │   └── modules/
│   │       ├── parser.js       # .txt → shloka blocks + transliteration
│   │       ├── search.js       # Fuse.js full-text search
│   │       ├── audio.js        # audio sync
│   │       ├── bookmarks.js    # localStorage bookmarks
│   │       ├── settings.js     # lipi / theme / language prefs
│   │       ├── i18n.js         # UI strings (te / en)
│   │       └── ui.js           # mobile nav, misc UI
│   ├── images/                 # stotram card images (slug-01..08.svg)
│   └── icons/                  # PWA icons + favicon
│       └── options/            # 36 favicon variants for review
├── data/
│   ├── stotrams.json           # master index (slugs, titles, tags)
│   └── <slug>/
│       ├── <slug>_meta.json    # rich metadata (sections, descriptions)
│       ├── <slug>_<section>.txt          # Telugu script text
│       ├── <slug>_<section>_sa.txt       # Devanagari text (optional)
│       └── <slug>_<section>_iast.txt     # IAST text (optional)
└── scripts/                    # dev tooling (see scripts/HOWTO.md)
```

## URL scheme

| URL | Page |
|-----|------|
| `samskruti.info/` | Home (featured stotrams) |
| `samskruti.info/#stotrams` | Full stotram list |
| `samskruti.info/#reader/<slug>` | Reader for a specific stotram |
| `samskruti.info/#subhashitam` | Subhāṣitam browse page |
| `samskruti.info/#subhashitam/<slug>` | Deep link to a specific subhāṣitam verse |

Subhāṣitam slugs are human-readable Sanskrit compound words (e.g. `karmanyevadhikaraste`, `satyamevajayate`). They are stable — once published a slug never changes.

## Feature flags & beta testing

New features are gated in `assets/js/app.js` with two mechanisms:

### 1. Feature flag (instant on/off)
```js
const ENABLE_SUBHASHITAM     = true;   // set false to hide from everyone
const ENABLE_STOTRAM_MEANING = true;
```

### 2. Beta token (selective early access)
When a flag is `false`, you can still grant access to specific testers via a shared URL:

```
https://samskruti.info/?beta=<token>
```

How it works:
1. Visitor opens the beta URL → token is saved to their `localStorage`
2. `?beta=...` is stripped from the URL (clean address bar)
3. From that point, their browser shows the feature on every visit
4. To revoke all tester access: change the token string in the code and redeploy

To set up beta access for a new feature:
1. Add a constant: `const MY_FEATURE_BETA_TOKEN = 'my-token-text';`
2. Set the feature flag to `false`
3. Share `https://samskruti.info/?beta=my-token-text` with testers
4. When ready to ship: set flag to `true` — the token check becomes irrelevant

The token string can be any text — it is not cryptographic. Keep it low-profile (don't publish it publicly) but it is not a secret in a security sense.

---

## Adding a stotram

1. Create `data/<slug>/` directory
2. Add `<slug>_meta.json` (copy an existing one as template)
3. Add `.txt` source files for each section
4. Add the slug entry to `data/stotrams.json`
5. Generate card images: `python3 scripts/gen-stotram-images.py`
6. Verify: `python3 scripts/check-images.py <slug>`

## Dev scripts

See [`scripts/HOWTO.md`](scripts/HOWTO.md) for full usage.

```bash
python3 scripts/gen-stotram-images.py   # regenerate all 96 card images
python3 scripts/gen-favicons.py         # regenerate 36 favicon options
python3 scripts/check-images.py 01 08  # verify titles in all images
```

## Deployment

Pushes to `main` trigger a GitHub Actions workflow that builds and deploys to the `gh-pages` branch, served via the custom domain `samskruti.info`.
