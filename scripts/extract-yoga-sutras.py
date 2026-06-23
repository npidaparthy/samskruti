#!/usr/bin/env python3
"""Extract SUTRAS arrays from yoga-sutra HTML files into JSON data files."""
import re, json, sys
from pathlib import Path

SRC = Path('/tmp/yoga-sutras-preview/samskruti-integration/yoga-sutras')
DEST = Path('data/stotram/yoga-sutras')
DEST.mkdir(parents=True, exist_ok=True)

PADAS = ['samadhi', 'sadhana', 'vibhuti', 'kaivalya']

for pada in PADAS:
    html = (SRC / f'{pada}-pada.html').read_text()

    # Extract the SUTRAS = [ ... ]; block
    m = re.search(r'const SUTRAS = (\[.*?\n\];)', html, re.DOTALL)
    if not m:
        print(f'ERROR: SUTRAS not found in {pada}-pada.html', file=sys.stderr)
        continue

    raw = m.group(1)
    # Strip trailing semicolon so it's valid JSON-ish JS — eval via node
    # Instead: use a safer approach — write to temp JS and eval
    tmp = Path(f'/tmp/{pada}_sutras.js')
    tmp.write_text(f'const s = {raw};\nconsole.log(JSON.stringify(s, null, 2));')

    import subprocess
    result = subprocess.run(['node', str(tmp)], capture_output=True, text=True)
    if result.returncode != 0:
        print(f'ERROR in {pada}: {result.stderr}', file=sys.stderr)
        continue

    sutras = json.loads(result.stdout)
    out = DEST / f'{pada}-pada.json'
    out.write_text(json.dumps(sutras, ensure_ascii=False, indent=2))
    print(f'{pada}-pada.json: {len(sutras)} sutras written')
