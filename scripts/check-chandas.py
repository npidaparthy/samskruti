#!/usr/bin/env python3
"""
check-chandas.py — audit subhāṣitam metre (chandas) metadata.

For every verse it:
  1. counts aksharas (syllables) per pāda from the Devanagari,
  2. checks that count against the syllable count the assigned metre requires
     (from data/chandas/_meters.json), and
  3. detects duplicate verses (identical Devanagari) across the collection.

For flagged verses it also prints the laghu/guru (L/G) scansion so the correct
metre can be identified by hand.

Usage:
    python3 scripts/check-chandas.py                 # audit data/subhashitam
    python3 scripts/check-chandas.py --path data/v-dindhima
    python3 scripts/check-chandas.py --patterns       # print L/G for every verse

Exit code is non-zero if any mismatch or duplicate is found (handy for CI).
"""
import json, glob, re, sys, argparse, collections, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METERS_FILE = os.path.join(ROOT, "data/chandas/_meters.json")

# expected aksharas per pāda for the varṇa (syllable-count) metres
EXPECTED = {
    "anushtubh": 8, "gayatri": 8, "upajati": 11, "indravajra": 11, "trishtubh": 11,
    "vamshastha": 12, "vasantatilaka": 14, "malini": 15, "mandakranta": 17,
    "prithvi": 17, "shardula": 19, "sragdhara": 21,
}
# metres whose lakṣaṇa is mora-based or which are not fixed vṛttas — skip count check
SKIP = {"arya", "matrasamaka", "matra-misc", "non-vrtta"}

# ── Devanagari akshara (syllable) count ──
IND_VOWELS = set("अआइईउऊऋॠऌॡएऐओऔ")
VIRAMA = "्"
def _is_cons(c): return "क" <= c <= "ह" or "क़" <= c <= "य़"
def akshara_count(s):
    s = re.sub(r"[०-९\d]", "", s)
    chars = list(s); n = 0
    for i, c in enumerate(chars):
        if c in IND_VOWELS:
            n += 1
        elif _is_cons(c):
            nxt = chars[i + 1] if i + 1 < len(chars) else ""
            if nxt != VIRAMA:
                n += 1
    return n

# ── laghu/guru scansion (via IAST) ──
try:
    from indic_transliteration import sanscript
    from indic_transliteration.sanscript import transliterate as _tr
    _HAVE_SANSCRIPT = True
except Exception:
    _HAVE_SANSCRIPT = False

_LONG = {"ā", "ī", "ū", "ṝ", "e", "ai", "o", "au"}
_VOW = ["ai", "au", "ā", "ī", "ū", "ṝ", "ḹ", "a", "i", "u", "ṛ", "ḷ", "e", "o"]
_CONS = ["kh","gh","ch","jh","ṭh","ḍh","th","dh","ph","bh","ṅ","ñ","ṇ","ś","ṣ",
         "k","g","c","j","ṭ","ḍ","t","d","n","p","b","m","y","r","l","v","s","h"]
def _tokenize(iast):
    s = iast; toks = []; i = 0
    while i < len(s):
        c = s[i]
        if c == " ": i += 1; continue
        if c in ("ṃ", "ṁ"): toks.append(("M", c)); i += 1; continue
        if c == "ḥ": toks.append(("H", c)); i += 1; continue
        if c in "'’|।॥-—.,": i += 1; continue
        hit = None
        for v in _VOW:
            if s[i:i+len(v)] == v: hit = ("V", v); i += len(v); break
        if hit: toks.append(hit); continue
        for k in _CONS:
            if s[i:i+len(k)] == k: hit = ("C", k); i += len(k); break
        if hit: toks.append(hit); continue
        i += 1
    return toks
def scansion(sa):
    """Return list of L/G strings, one per line."""
    if not _HAVE_SANSCRIPT:
        return []
    iast = _tr(sa, sanscript.DEVANAGARI, sanscript.IAST)
    out = []
    for line in iast.split("\n"):
        toks = _tokenize(line)
        vidx = [i for i, t in enumerate(toks) if t[0] == "V"]
        pat = ""
        for n, vi in enumerate(vidx):
            guru = toks[vi][1] in _LONG
            end = vidx[n + 1] if n + 1 < len(vidx) else len(toks)
            cons = sum(1 for k in range(vi + 1, end) if toks[k][0] == "C")
            heavy = any(toks[k][0] in ("M", "H") for k in range(vi + 1, end))
            if heavy or cons >= 2:
                guru = True
            pat += "G" if guru else "L"
        if pat:
            out.append(pat)
    return out

def count_ok(counts, exp):
    # each segment is 1 pāda (==exp) or 2 pādas (==2*exp), ±1 tolerance
    return all(any(abs(c - m) <= 1 for m in (exp, 2 * exp)) for c in counts)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default="data/subhashitam", help="dir to scan")
    ap.add_argument("--patterns", action="store_true", help="print L/G for every verse")
    args = ap.parse_args()

    files = sorted(f for f in glob.glob(os.path.join(ROOT, args.path, "**/*.json"), recursive=True)
                   if "_index" not in os.path.basename(f) and "_meters" not in os.path.basename(f))
    flagged = []
    bysa = collections.defaultdict(list)
    for f in files:
        d = json.load(open(f))
        sa = d.get("shlokam", {}).get("sa", "")
        k = d.get("chanda_key", "")
        bysa[re.sub(r"[।॥\s\d०-९ऽ]", "", sa)].append(d["id"])
        segs = [s for s in re.split(r"[।॥\n]", sa) if s.strip()]
        counts = [akshara_count(s) for s in segs]
        if args.patterns:
            print(f"{d['id']:14} {k:14} {counts}  {scansion(sa)}")
            continue
        if k in SKIP or k not in EXPECTED:
            continue
        if not count_ok(counts, EXPECTED[k]):
            flagged.append((d["id"], k, EXPECTED[k], counts, scansion(sa)))

    if args.patterns:
        return 0

    print(f"Scanned {len(files)} verses.\n")
    print(f"── Metre mismatches: {len(flagged)} ──")
    for i, k, exp, counts, pat in flagged:
        print(f"  {i:14} {k:14} expected {exp}/pāda  got {counts}")
        for p in pat:
            print(f"       {len(p):2} {p}")

    dups = [ids for ids in bysa.values() if len(ids) > 1]
    print(f"\n── Duplicate verses: {len(dups)} groups ──")
    for ids in dups:
        print("  ", ids)

    return 1 if (flagged or dups) else 0

if __name__ == "__main__":
    sys.exit(main())
