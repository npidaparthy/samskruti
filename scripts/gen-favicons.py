#!/usr/bin/env python3
"""Generate 24 favicon SVG variants for samskruti.info"""

import os

OUT = "assets/icons/options"
os.makedirs(OUT, exist_ok=True)

# ── Color schemes ─────────────────────────────────────────────────────────────
SCHEMES = [
    ("indigo-gold",   "#1A237E", "#3949AB", "#FFD700"),   # current app theme
    ("saffron-maroon","#E65100", "#BF360C", "#FFF8E1"),   # Vedic saffron
    ("maroon-gold",   "#4A0000", "#7B0000", "#F4D03F"),   # temple red
    ("forest-gold",   "#1B5E20", "#2E7D32", "#FFD700"),   # nature/Sarasvati
    ("teal-gold",     "#004D40", "#00695C", "#FFD700"),   # calm devotional
    ("purple-silver", "#4A148C", "#6A1B9A", "#E0E0E0"),   # mystical
]

# ── Symbol renderers ──────────────────────────────────────────────────────────

def ring_ornament(cx, cy, r, color, opacity=0.35):
    """Thin decorative ring."""
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="1.5" stroke-opacity="{opacity}"/>'

def corner_dots(color, opacity=0.4, size=512):
    margin = size * 0.07
    r = size * 0.012
    pts = [(margin, margin), (size-margin, margin),
           (margin, size-margin), (size-margin, size-margin)]
    return ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" fill-opacity="{opacity}"/>' for x,y in pts)

# ── 6 different symbol designs ─────────────────────────────────────────────────
def sym_om_plain(cx, cy, gold, size):
    """Large ॐ centred."""
    fs = int(size * 0.55)
    return f'<text x="{cx}" y="{cy+size*0.1}" text-anchor="middle" dominant-baseline="middle" font-size="{fs}" fill="{gold}" font-family="serif">ॐ</text>'

def sym_om_circle(cx, cy, gold, size):
    """ॐ inside a glowing circle."""
    r = size * 0.32
    fs = int(size * 0.42)
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{gold}" fill-opacity="0.12"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{gold}" stroke-width="{size*0.018}" stroke-opacity="0.7"/>'
            f'<text x="{cx}" y="{cy+size*0.08}" text-anchor="middle" dominant-baseline="middle" font-size="{fs}" fill="{gold}" font-family="serif">ॐ</text>')

def sym_om_diamond(cx, cy, gold, size):
    """ॐ with rotated-square frame."""
    h = size * 0.33
    pts = f"{cx},{cy-h} {cx+h},{cy} {cx},{cy+h} {cx-h},{cy}"
    fs = int(size * 0.38)
    return (f'<polygon points="{pts}" fill="{gold}" fill-opacity="0.1" stroke="{gold}" stroke-width="{size*0.016}" stroke-opacity="0.65"/>'
            f'<text x="{cx}" y="{cy+size*0.06}" text-anchor="middle" dominant-baseline="middle" font-size="{fs}" fill="{gold}" font-family="serif">ॐ</text>')

def sym_lotus_om(cx, cy, gold, size):
    """8-petal lotus with ॐ."""
    petals = ''
    for i in range(8):
        import math
        angle = i * 45
        rad = math.radians(angle)
        rx = size * 0.095; ry = size * 0.22
        petals += (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" '
                   f'fill="{gold}" fill-opacity="0.18" stroke="{gold}" stroke-width="{size*0.01}" stroke-opacity="0.5" '
                   f'transform="rotate({angle} {cx} {cy}) translate(0 -{size*0.14})"/>')
    fs = int(size * 0.3)
    return (petals +
            f'<circle cx="{cx}" cy="{cy}" r="{size*0.16}" fill="{gold}" fill-opacity="0.15"/>'
            f'<text x="{cx}" y="{cy+size*0.05}" text-anchor="middle" dominant-baseline="middle" font-size="{fs}" fill="{gold}" font-family="serif">ॐ</text>')

def sym_stotram_text(cx, cy, gold, size):
    """Sanskrit abbreviation स्तो + OM."""
    fs1 = int(size * 0.26)
    fs2 = int(size * 0.16)
    r = size * 0.30
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{gold}" fill-opacity="0.1" stroke="{gold}" stroke-width="{size*0.015}" stroke-opacity="0.6"/>'
            f'<text x="{cx}" y="{cy-size*0.04}" text-anchor="middle" dominant-baseline="middle" font-size="{fs1}" fill="{gold}" font-family="serif">ॐ</text>'
            f'<text x="{cx}" y="{cy+size*0.18}" text-anchor="middle" dominant-baseline="middle" font-size="{fs2}" fill="{gold}" fill-opacity="0.85" font-family="serif" letter-spacing="2">STOTRAM</text>')

def sym_sri_yantra_om(cx, cy, gold, size):
    """Simplified Sri-yantra triangle pair + ॐ."""
    h = size * 0.28
    w = size * 0.32
    # upward triangle
    tri_up = f"{cx},{cy-h} {cx-w},{cy+h*0.6} {cx+w},{cy+h*0.6}"
    # downward triangle
    tri_dn = f"{cx},{cy+h} {cx-w},{cy-h*0.6} {cx+w},{cy-h*0.6}"
    fs = int(size * 0.22)
    sw = size * 0.014
    return (f'<polygon points="{tri_up}" fill="{gold}" fill-opacity="0.08" stroke="{gold}" stroke-width="{sw}" stroke-opacity="0.55"/>'
            f'<polygon points="{tri_dn}" fill="{gold}" fill-opacity="0.08" stroke="{gold}" stroke-width="{sw}" stroke-opacity="0.55"/>'
            f'<text x="{cx}" y="{cy+size*0.04}" text-anchor="middle" dominant-baseline="middle" font-size="{fs}" fill="{gold}" font-family="serif">ॐ</text>')

SYMBOLS = [
    ("om-plain",    sym_om_plain),
    ("om-circle",   sym_om_circle),
    ("om-diamond",  sym_om_diamond),
    ("lotus-om",    sym_lotus_om),
    ("stotram",     sym_stotram_text),
    ("sri-yantra",  sym_sri_yantra_om),
]

# ── SVG builder ───────────────────────────────────────────────────────────────
def make_favicon(scheme_name, bg1, bg2, gold, sym_name, sym_fn, size=512):
    cx = cy = size / 2
    r_outer = size * 0.42
    corner = size * 0.12

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg1}"/>
      <stop offset="100%" stop-color="{bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="{gold}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="{gold}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="{size}" height="{size}" rx="{corner}" fill="url(#bg)"/>
  <rect width="{size}" height="{size}" rx="{corner}" fill="url(#glow)"/>

  <!-- Decorative rings -->
  {ring_ornament(cx, cy, r_outer, gold, 0.30)}
  {ring_ornament(cx, cy, r_outer*0.88, gold, 0.15)}

  <!-- Corner dots -->
  {corner_dots(gold, 0.35, size)}

  <!-- Symbol -->
  {sym_fn(cx, cy, gold, size)}
</svg>'''
    fname = f"{OUT}/{sym_name}_{scheme_name}.svg"
    with open(fname, "w") as f:
        f.write(svg)
    return fname

# ── Generate all 24 ───────────────────────────────────────────────────────────
generated = []
for sym_name, sym_fn in SYMBOLS:
    for scheme_name, bg1, bg2, gold in SCHEMES:
        path = make_favicon(scheme_name, bg1, bg2, gold, sym_name, sym_fn)
        generated.append(path)

print(f"Generated {len(generated)} favicon variants:")
for p in sorted(generated):
    print(" ", p)
