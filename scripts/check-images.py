#!/usr/bin/env python3
"""
check-images.py — spot-check that Telugu / Devanagari / Latin titles
are embedded in the generated stotram SVG images.

Usage:
  python3 scripts/check-images.py                       # all stotrams, variant 01
  python3 scripts/check-images.py 03                    # all stotrams, variant 03
  python3 scripts/check-images.py 01 08                 # variants 01–08 for all
  python3 scripts/check-images.py vishnu-sahasranamam   # one slug, all variants
  python3 scripts/check-images.py kalabhairava 01 04    # slug prefix, variants 01–04
"""

import sys, os, re, xml.etree.ElementTree as ET

IMAGES = "assets/images"

ALL_SLUGS = [
    "vishnu-sahasranamam", "lalita-sahasranamam", "soundaryalahari",
    "surya-siddhanta", "nava-graha-stotram", "krishna-ashtakam",
    "sarasvati-dvadasha", "nataraja", "nava-ratnamala",
    "kalabhairava-ashtakam", "toTaka", "surya",
]

# Unicode ranges
TELUGU    = re.compile(r'[ఀ-౿]')
DEVANAG   = re.compile(r'[ऀ-ॿ]')
OM        = re.compile(r'^ॐ$')
LATIN     = re.compile(r'^[A-Za-zÀ-ɏḀ-ỿ .,\-]{3,}$')

# ── Parse args ────────────────────────────────────────────────────────────────
args = sys.argv[1:]
filter_slug = None
v_from, v_to = 1, 1

for a in args:
    if re.match(r'^\d{1,2}$', a):
        if v_from == 1 and v_to == 1:
            v_from = v_to = int(a)
        else:
            v_to = int(a)
    else:
        filter_slug = a

if not args or all(re.match(r'^\d{1,2}$', a) for a in args):
    # Only numbers given → apply to all slugs
    pass

# If slug given with no variant numbers → show all 8
if filter_slug and v_from == v_to == 1 and not any(re.match(r'^\d', a) for a in args):
    v_from, v_to = 1, 8

slugs = [s for s in ALL_SLUGS if filter_slug is None or filter_slug in s]

if not slugs:
    print(f"No stotrams match '{filter_slug}'. Available:\n  " + "\n  ".join(ALL_SLUGS))
    sys.exit(1)

# ── Extract all text nodes from an SVG ────────────────────────────────────────
def extract_texts(path):
    try:
        tree = ET.parse(path)
    except ET.ParseError as e:
        return None, str(e)
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    texts = []
    for el in tree.iter():
        if el.text and el.text.strip():
            texts.append(el.text.strip())
        if el.tail and el.tail.strip():
            texts.append(el.tail.strip())
    return texts, None

# ── Check ─────────────────────────────────────────────────────────────────────
passed = failed = 0
SEP = "─" * 56

print(SEP)

for slug in slugs:
    for v in range(v_from, v_to + 1):
        fname = f"{slug}-{v:02d}.svg"
        fpath = os.path.join(IMAGES, fname)

        if not os.path.exists(fpath):
            print(f"MISSING  {fname}")
            failed += 1
            continue

        texts, err = extract_texts(fpath)
        if err:
            print(f"PARSE ERROR  {fname}: {err}")
            failed += 1
            continue

        te_hits = [t for t in texts if TELUGU.search(t)]
        sa_hits = [t for t in texts if DEVANAG.search(t) and not OM.match(t)]
        en_hits = [t for t in texts if LATIN.match(t)]

        ok = bool(te_hits and sa_hits)

        status = "✓ OK  " if ok else "✗ FAIL"
        print(f"{status}  {fname}")
        if te_hits:
            print(f"       te › {te_hits[0]}")
        else:
            print(f"       te › ⚠️  not found")
        if sa_hits:
            print(f"       sa › {sa_hits[0]}")
        else:
            print(f"       sa › ⚠️  not found")
        if en_hits:
            print(f"       en › {en_hits[0]}")

        if ok:
            passed += 1
        else:
            failed += 1

print(SEP)
print(f"  passed: {passed}   failed: {failed}   total: {passed+failed}")
print(SEP)
sys.exit(0 if failed == 0 else 1)
