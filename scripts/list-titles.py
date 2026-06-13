#!/usr/bin/env python3
"""
list-titles.py — Print all stotram titles in Telugu / Devanagari / Latin
as a quick review table. Flags any mismatch between stotrams.json and _meta.json.

Usage:
  python3 scripts/list-titles.py            # full table, all stotrams
  python3 scripts/list-titles.py --diff     # only show mismatched titles
  python3 scripts/list-titles.py --html     # open as HTML table in browser (recommended)
  python3 scripts/list-titles.py vishnu     # filter by slug (partial match)
  python3 scripts/list-titles.py --diff --html   # combine flags
"""

import json, os, sys, tempfile, webbrowser

# ── Load data ─────────────────────────────────────────────────────────────────
with open("data/stotrams.json") as f:
    INDEX = {s["slug"]: s for s in json.load(f)["stotrams"]}

def load_meta(slug):
    path = f"data/{slug}/{slug}_meta.json"
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {}

# ── Args ──────────────────────────────────────────────────────────────────────
args = sys.argv[1:]
diff_only   = "--diff" in args
html_mode   = "--html" in args
slug_filter = next((a for a in args if not a.startswith("--")), None)

slugs = [s for s in INDEX if slug_filter is None or slug_filter in s]

# ── Helpers ───────────────────────────────────────────────────────────────────
W_SLUG = 26
W_TE   = 38
W_SA   = 34
W_EN   = 36

def pad(s, w):
    """Pad a string to width w, accounting for wide Unicode chars."""
    # rough heuristic: Telugu/Devanagari chars are ~1.5× wide in terminals
    visual = sum(2 if ord(c) > 0x0900 else 1 for c in s)
    spaces = max(0, w - visual)
    return s + " " * spaces

SEP  = "─" * (W_SLUG + W_TE + W_SA + W_EN + 9)
HDR  = (f"{'slug':<{W_SLUG}} │ {'title_te':<{W_TE}} │ {'title_sa':<{W_SA}} │ {'title_en'}")

# ── Build rows ────────────────────────────────────────────────────────────────
rows_data = []
for slug in slugs:
    base = INDEX[slug]
    meta = load_meta(slug)

    src = {
        "stotrams.json": {k: base.get(f"title_{k}", "") for k in ("te", "sa", "en")},
        "_meta.json":    {k: meta.get(f"title_{k}", "") for k in ("te", "sa", "en")},
    }

    has_diff = any(
        src["stotrams.json"][k] and src["_meta.json"][k]
        and src["stotrams.json"][k] != src["_meta.json"][k]
        for k in ("te", "sa", "en")
    )

    if diff_only and not has_diff:
        continue

    rows_data.append((slug, src, has_diff))

# ── HTML output ───────────────────────────────────────────────────────────────
if html_mode:
    def esc(s):
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")

    html_rows = ""
    for slug, src, has_diff in rows_data:
        r  = src["stotrams.json"]
        r2 = src["_meta.json"]
        flag = " ⚠️" if has_diff else ""
        html_rows += f"""
        <tr class="{'diff' if has_diff else ''}">
          <td class="slug">{esc(slug)}{flag}</td>
          <td class="te">{esc(r['te'])}</td>
          <td class="sa">{esc(r['sa'])}</td>
          <td class="en">{esc(r['en'])}</td>
        </tr>"""
        if has_diff:
            te2 = f"<span class='override'>↳ {esc(r2['te'])}</span>" if r2['te'] != r['te'] else ""
            sa2 = f"<span class='override'>↳ {esc(r2['sa'])}</span>" if r2['sa'] != r['sa'] else ""
            en2 = f"<span class='override'>↳ {esc(r2['en'])}</span>" if r2['en'] != r['en'] else ""
            html_rows += f"""
        <tr class="meta-row">
          <td></td>
          <td class="te">{te2}</td>
          <td class="sa">{sa2}</td>
          <td class="en">{en2}</td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Stotram Titles Review</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu&family=Noto+Sans+Devanagari&family=Noto+Sans+Mono&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Noto Sans Mono', monospace; background: #0d1117; color: #c9d1d9; padding: 2rem; }}
    h2   {{ color: #58a6ff; margin-bottom: 1rem; }}
    table {{ border-collapse: collapse; width: 100%; font-size: 0.95rem; }}
    th   {{ background: #161b22; color: #58a6ff; padding: .6rem 1rem; text-align: left;
            border-bottom: 2px solid #30363d; }}
    td   {{ padding: .5rem 1rem; border-bottom: 1px solid #21262d; vertical-align: top; }}
    .slug {{ color: #e6edf3; font-weight: bold; white-space: nowrap; }}
    .te  {{ font-family: 'Noto Sans Telugu', sans-serif; font-size: 1.05rem; }}
    .sa  {{ font-family: 'Noto Sans Devanagari', sans-serif; font-size: 1.05rem; }}
    .en  {{ color: #8b949e; font-style: italic; }}
    .diff td {{ background: #2d1f00; }}
    .meta-row td {{ background: #1a1200; padding-top: 0; }}
    .override {{ color: #f0883e; font-size: 0.92rem; }}
    p.legend {{ color: #8b949e; font-size: 0.85rem; margin-top: 1.5rem; }}
    p.legend span.warn {{ color: #f0883e; }}
  </style>
</head>
<body>
  <h2>Stotram Titles — {"Mismatches only" if diff_only else "All"}</h2>
  <table>
    <thead><tr><th>slug</th><th>title_te</th><th>title_sa</th><th>title_en</th></tr></thead>
    <tbody>{html_rows}
    </tbody>
  </table>
  <p class="legend">
    Row 1 = <strong>stotrams.json</strong> (canonical) &nbsp;|&nbsp;
    <span class="warn">↳ orange = _meta.json override (currently wins in app)</span>
  </p>
</body>
</html>"""

    tmp = tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8")
    tmp.write(html)
    tmp.close()
    webbrowser.open(f"file://{tmp.name}")
    print(f"Opened in browser: {tmp.name}")
    sys.exit(0)

# ── Terminal output ───────────────────────────────────────────────────────────
print(SEP)
print(HDR)
print(SEP)

for slug, src, has_diff in rows_data:
    r  = src["stotrams.json"]
    r2 = src["_meta.json"]
    flag = " ⚠" if has_diff else "  "
    print(f"{pad(slug+flag, W_SLUG)} │ {pad(r['te'], W_TE)} │ {pad(r['sa'], W_SA)} │ {r['en']}")
    if has_diff:
        te2 = ("↳ " + r2["te"]) if r2["te"] != r["te"] else ""
        sa2 = ("↳ " + r2["sa"]) if r2["sa"] != r["sa"] else ""
        en2 = ("↳ " + r2["en"]) if r2["en"] != r["en"] else ""
        print(f"{'':>{W_SLUG}} │ {pad(te2, W_TE)} │ {pad(sa2, W_SA)} │ {en2}")

shown = len(rows_data)
print(SEP)
print(f"  {shown} stotram(s) shown" + (" — mismatches only" if diff_only else ""))
print()
print("  Row 1 = stotrams.json (canonical reference)")
print("  ↳ Row 2 = _meta.json override (currently wins in app)")
print(f"  Tip: run with --html to view correctly rendered in browser")
print(SEP)
