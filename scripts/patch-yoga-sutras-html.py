#!/usr/bin/env python3
"""Patch yoga-sutra HTML files: replace hardcoded SUTRAS with fetch from JSON."""
import re
from pathlib import Path

DEST = Path('data/stotram/yoga-sutras')
PADAS = ['samadhi', 'sadhana', 'vibhuti', 'kaivalya']

for pada in PADAS:
    p = DEST / f'{pada}-pada.html'
    html = p.read_text()

    # 1. Fix JS path: /assets/js/... → ../../assets/js/...
    html = html.replace(
        'src="/assets/js/devanagari-transliteration-utils.js"',
        'src="../../assets/js/devanagari-transliteration-utils.js"'
    )

    # 2. Fix breadcrumb back link to point to app hash
    html = html.replace('href="/stotrams"', 'href="/#stotrams"')
    html = html.replace('href="/index.html"', 'href="/"')

    # 3. Replace const SUTRAS = [...]; with async fetch
    fetch_block = f"""let SUTRAS = [];
async function loadSutras() {{
  const r = await fetch('{pada}-pada.json');
  SUTRAS = await r.json();
  render();
  buildPadaNav();
}}"""

    html = re.sub(
        r'const SUTRAS = \[.*?\n\];',
        fetch_block,
        html,
        flags=re.DOTALL
    )

    # 4. Replace DOMContentLoaded / init call to use loadSutras()
    # Find the existing init — usually render() or buildPadaNav() called at bottom
    html = re.sub(
        r'document\.addEventListener\([\'"]DOMContentLoaded[\'"]\s*,\s*\(\)\s*=>\s*\{(.*?)\}\s*\);',
        lambda m: f'document.addEventListener(\'DOMContentLoaded\', () => {{ loadSutras(); {_extract_non_render(m.group(1))} }});',
        html, flags=re.DOTALL
    )

    p.write_text(html)
    print(f'Patched {pada}-pada.html')

def _extract_non_render(body):
    # Keep anything in DOMContentLoaded that isn't render() or buildPadaNav()
    lines = [l.strip() for l in body.strip().splitlines()
             if l.strip() and 'render()' not in l and 'buildPadaNav()' not in l]
    return ' '.join(lines)
