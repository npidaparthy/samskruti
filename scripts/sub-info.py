#!/usr/bin/env python3
"""
sub-info.py — Subhashitam data utility

Usage:
  python3 scripts/sub-info.py                        # summary: category counts
  python3 scripts/sub-info.py --validate              # validate all JSON files
  python3 scripts/sub-info.py --list                  # list all entries (id, slug, source)
  python3 scripts/sub-info.py --show <id-or-slug>     # print full detail for one entry
  python3 scripts/sub-info.py --tags                  # show all tags and their counts
  python3 scripts/sub-info.py --tag <tag>             # list entries for a specific tag
  python3 scripts/sub-info.py --missing <field>       # find entries missing a field in JSON
  python3 scripts/sub-info.py --sources               # all sources sorted alphabetically
  python3 scripts/sub-info.py --slug <slug>           # print full detail by slug
"""

import json
import sys
import os
from pathlib import Path

ROOT   = Path(__file__).parent.parent
INDEX  = ROOT / 'data' / 'subhashitam' / '_index.json'
SUBDIR = ROOT / 'data' / 'subhashitam'

REQUIRED_FIELDS = ['id', 'tags', 'shlokam', 'chandaH', 'granthaH',
                   'padavibhagam', 'anvayam', 'meaning', 'tatparyam']
SHLOKAM_SCRIPTS = ['te', 'sa', 'iast']
BILINGUAL       = ['padavibhagam', 'anvayam', 'meaning', 'tatparyam']


def load_index():
    with open(INDEX, encoding='utf-8') as f:
        return json.load(f)


def load_entry(file_rel):
    path = SUBDIR / file_rel
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def cmd_summary(index):
    from collections import Counter
    cats = Counter()
    for e in index:
        cats[e.get('category') or (e.get('tags') or ['?'])[0]] += 1
    print(f"\n{'Category':<16} {'Count':>5}")
    print('─' * 23)
    for cat, n in sorted(cats.items()):
        print(f"  {cat:<14} {n:>5}")
    print('─' * 23)
    print(f"  {'TOTAL':<14} {len(index):>5}\n")


def cmd_validate(index):
    errors = []
    for e in index:
        eid  = e.get('id', '?')
        file = e.get('file')

        # index-level checks
        for k in ['id', 'file', 'slug']:
            if not e.get(k):
                errors.append(f"{eid}: missing index field '{k}'")

        if not file:
            continue

        path = SUBDIR / file
        if not path.exists():
            errors.append(f"{eid}: file not found — {file}")
            continue

        try:
            data = load_entry(file)
        except json.JSONDecodeError as ex:
            errors.append(f"{eid}: JSON parse error — {ex}")
            continue

        # required top-level fields
        for f_name in REQUIRED_FIELDS:
            if f_name not in data:
                errors.append(f"{eid}: missing field '{f_name}'")

        # shlokam scripts
        shlokam = data.get('shlokam', {})
        for script in SHLOKAM_SCRIPTS:
            if not shlokam.get(script, '').strip():
                errors.append(f"{eid}: shlokam.{script} is empty")

        # bilingual fields
        for field in BILINGUAL:
            block = data.get(field, {})
            for lang in ['te', 'en']:
                if not block.get(lang, '').strip():
                    errors.append(f"{eid}: {field}.{lang} is empty")

    if errors:
        print(f"\n✗ {len(errors)} error(s) found:\n")
        for err in errors:
            print(f"  • {err}")
    else:
        print(f"\n✓ All {len(index)} entries valid\n")
    return len(errors) == 0


def cmd_list(index):
    print(f"\n{'ID':<16} {'Slug':<44} {'Source'}")
    print('─' * 100)
    for e in index:
        print(f"  {e.get('id',''):<14} {e.get('slug',''):<44} {e.get('source_en','')}")
    print(f"\n  {len(index)} entries total\n")


def cmd_show(index, query):
    query = query.strip()
    match = next((e for e in index if e.get('id') == query or e.get('slug') == query), None)
    if not match:
        print(f"\n  Not found: '{query}'\n")
        sys.exit(1)

    file = match.get('file')
    if not file or not (SUBDIR / file).exists():
        print(f"\n  Index entry found but file missing: {file}\n")
        sys.exit(1)

    data = load_entry(file)
    sep  = '─' * 60

    print(f"\n{sep}")
    print(f"  ID      : {data.get('id')}")
    print(f"  Slug    : {match.get('slug')}")
    print(f"  Source  : {data.get('granthaH', {}).get('name_en', '')}")
    print(f"  Tags    : {', '.join(data.get('tags', []))}")
    print(f"  Metre   : {data.get('chandaH', '')}")
    print(sep)

    sh = data.get('shlokam', {})
    print(f"\n  [Telugu]\n  {sh.get('te','')}")
    print(f"\n  [Devanagari]\n  {sh.get('sa','')}")
    print(f"\n  [IAST]\n  {sh.get('iast','')}")

    print(f"\n  Meaning (en):\n  {data.get('meaning',{}).get('en','')}")
    print(f"\n  Meaning (te):\n  {data.get('meaning',{}).get('te','')}")

    print(f"\n  Commentary (en):\n  {data.get('tatparyam',{}).get('en','')}")
    print(f"\n{sep}\n")


def cmd_tags(index):
    from collections import Counter
    tag_counts = Counter()
    for e in index:
        for t in e.get('tags', []):
            tag_counts[t] += 1
    print(f"\n{'Tag':<28} {'Count':>5}")
    print('─' * 36)
    for tag, n in sorted(tag_counts.items()):
        print(f"  {tag:<26} {n:>5}")
    print(f"\n  {len(tag_counts)} unique tags\n")


def cmd_tag_filter(index, tag):
    matches = [e for e in index if tag in e.get('tags', [])]
    if not matches:
        print(f"\n  No entries with tag '{tag}'\n")
        return
    print(f"\n  Tag: {tag}  ({len(matches)} entries)\n")
    for e in matches:
        print(f"  {e.get('id',''):<16} {e.get('slug',''):<44} {e.get('source_en','')}")
    print()


def _base_source(raw):
    """Reduce to canonical source name for grouping/dedup.
    'Bhagavad Gītā 9.22'                          → 'Bhagavad Gītā'
    'Bhaja Govindam — Ādi Śaṅkarācārya (verse 1)' → 'Bhaja Govindam'
    'Taittirīya Upaniṣad Śānti pāṭha'             → 'Taittirīya Upaniṣad'
    'Bṛhadāraṇyaka Upaniṣad / widely cited…'      → 'Bṛhadāraṇyaka Upaniṣad'
    """
    import re
    s = raw.strip()
    s = re.sub(r'\s*[/—–(,].*$', '', s)           # slash / dash / paren / comma qualifiers
    s = re.sub(r'\s+\d[\d\.]*$', '', s)            # trailing chapter.verse numbers
    s = re.sub(r'\s+(Śānti|Śikṣā|Anu|Upāsanā).*$', '', s)  # sub-section suffixes
    return s.strip() or raw.strip()


def cmd_sources(index):
    from collections import defaultdict
    src_map = defaultdict(list)
    for e in index:
        file = e.get('file')
        if not file or not (SUBDIR / file).exists():
            raw = e.get('source_en', '—')
        else:
            data = load_entry(file)
            raw = data.get('granthaH', {}).get('name_en') or e.get('source_en') or '—'
        base = _base_source(raw)
        src_map[base].append(e.get('id', ''))

    print(f"\n{'Source':<48} {'Count':>5}")
    print('─' * 56)
    for src in sorted(src_map.keys(), key=lambda s: s.lower()):
        print(f"  {src:<46} {len(src_map[src]):>5}")
    print('─' * 56)
    print(f"  {'TOTAL':<46} {len(index):>5}")
    print(f"\n  {len(src_map)} unique sources\n")


def cmd_missing(index, field):
    missing = []
    for e in index:
        file = e.get('file')
        if not file or not (SUBDIR / file).exists():
            continue
        data = load_entry(file)
        # support dot-notation: e.g. shlokam.sa
        parts = field.split('.')
        val = data
        for p in parts:
            val = val.get(p, '') if isinstance(val, dict) else ''
        if not str(val).strip():
            missing.append(e.get('id'))
    if missing:
        print(f"\n  {len(missing)} entries missing '{field}':\n")
        for m in missing:
            print(f"  • {m}")
    else:
        print(f"\n  All entries have '{field}'\n")
    print()


def main():
    args = sys.argv[1:]
    index = load_index()

    if not args:
        cmd_summary(index)
    elif args[0] == '--validate':
        ok = cmd_validate(index)
        sys.exit(0 if ok else 1)
    elif args[0] == '--list':
        cmd_list(index)
    elif args[0] == '--show' and len(args) > 1:
        cmd_show(index, args[1])
    elif args[0] == '--tags':
        cmd_tags(index)
    elif args[0] == '--tag' and len(args) > 1:
        cmd_tag_filter(index, args[1])
    elif args[0] == '--missing' and len(args) > 1:
        cmd_missing(index, args[1])
    elif args[0] == '--sources':
        cmd_sources(index)
    elif args[0] == '--slug' and len(args) > 1:
        cmd_show(index, args[1])   # cmd_show already resolves by slug
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
