#!/usr/bin/env python3
"""
Generate 8 design-variant card images per stotram.
Titles are pulled from _meta.json (preferred) falling back to stotrams.json.
Output: assets/images/<slug>-0N.svg  (N = 01..08)
"""

import os, json, math

# ── Load title data ────────────────────────────────────────────────────────────
with open("data/stotrams.json") as f:
    INDEX = {s["slug"]: s for s in json.load(f)["stotrams"]}

def get_titles(slug):
    """Return (title_te, title_sa, title_en, theme).
    Titles always come from stotrams.json — the canonical reference.
    theme falls back to _meta.json if not set in stotrams.json.
    """
    base = INDEX.get(slug, {})
    meta_path = f"data/{slug}/{slug}_meta.json"
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
    te    = base.get("title_te") or ""
    sa    = base.get("title_sa") or ""
    en    = base.get("title_en") or slug
    theme = base.get("theme") or meta.get("theme") or "theme-vishnu"
    return te, sa, en, theme

# ── Theme → palette ────────────────────────────────────────────────────────────
PALETTES = {
    "theme-vishnu":  [("#0D1259","#1A237E","#3949AB"), ("#060C3D","#0D1B6E","#1A3A8F"),
                      ("#0A0F4A","#283593","#3F51B5"), ("#050A2D","#1A237E","#5C6BC0")],
    "theme-lalita":  [("#3B0030","#6A0050","#AD1457"), ("#2D0038","#880E4F","#C2185B"),
                      ("#1A0020","#4A0050","#8E0060"), ("#3D0035","#880E4F","#E91E8C")],
    "theme-surya":   [("#1E0A00","#7B3000","#E65100"), ("#200800","#BF360C","#FF5722"),
                      ("#1A0500","#6D1F00","#D84315"), ("#220C00","#8B4000","#F4511E")],
    "theme-shiva":   [("#0D001A","#4A0072","#7B1FA2"), ("#10001F","#38006B","#9C27B0"),
                      ("#0A0014","#4A0060","#6A1B9A"), ("#150025","#560080","#8E24AA")],
    "theme-deities": [("#001A1A","#004D40","#00695C"), ("#00100E","#00352E","#00574A"),
                      ("#001515","#003D33","#005F50"), ("#001C1A","#00544A","#00796B")],
    "theme-bhakti":  [("#0D0A00","#3E2700","#6D4400"), ("#100900","#452B00","#7A4E00"),
                      ("#0A0800","#3A2200","#604000"), ("#120A00","#4A2E00","#7B5300")],
}
GOLD = "#FFD700"
SILVER = "#E0E0E0"

def palette(theme, variant):
    rows = PALETTES.get(theme, PALETTES["theme-vishnu"])
    return rows[variant % len(rows)]

def accent(theme):
    """Secondary accent colour per theme."""
    return {"theme-lalita":"#FF80AB","theme-surya":"#FFAB40",
            "theme-shiva":"#CE93D8","theme-deities":"#80CBC4",
            "theme-bhakti":"#FFCC80"}.get(theme, GOLD)

# ── SVG helpers ────────────────────────────────────────────────────────────────
W, H = 800, 500
CX, CY = W//2, H//2

def base_svg(bg1, bg2, body):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"  stop-color="{bg1}"/>
      <stop offset="100%" stop-color="{bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="44%" r="44%">
      <stop offset="0%"  stop-color="{GOLD}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="{GOLD}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#bg)"/>
  <rect width="{W}" height="{H}" fill="url(#glow)"/>
  <rect x="14" y="14" width="{W-28}" height="{H-28}" rx="10"
        fill="none" stroke="{GOLD}" stroke-width="1.4" stroke-opacity="0.38"/>
  <rect x="22" y="22" width="{W-44}" height="{H-44}" rx="6"
        fill="none" stroke="{GOLD}" stroke-width="0.6" stroke-opacity="0.18"/>
{body}
</svg>'''

def ring(cx, cy, r, color=GOLD, op=0.30, sw=1.5):
    return f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r:.0f}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-opacity="{op}"/>\n'

def rays(cx, cy, r1, r2, n, color=GOLD, op=0.35, sw=1.8):
    out = ""
    for i in range(n):
        a = math.radians(i * 360/n)
        out += (f'<line x1="{cx+r1*math.cos(a):.1f}" y1="{cy+r1*math.sin(a):.1f}" '
                f'x2="{cx+r2*math.cos(a):.1f}" y2="{cy+r2*math.sin(a):.1f}" '
                f'stroke="{color}" stroke-width="{sw}" stroke-opacity="{op}"/>\n')
    return out

def lotus(cx, cy, r_in, r_out, n=8, color=GOLD, op=0.20):
    out = ""
    for i in range(n):
        a = math.radians(i * 360/n)
        px = cx + (r_in+r_out)/2 * math.sin(a)
        py = cy - (r_in+r_out)/2 * math.cos(a)
        rx = (r_out-r_in)*0.38; ry = (r_out-r_in)*0.52
        out += (f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" '
                f'fill="{color}" fill-opacity="{op}" stroke="{color}" '
                f'stroke-width="1" stroke-opacity="{op+0.25}" '
                f'transform="rotate({i*360/n} {px:.1f} {py:.1f})"/>\n')
    return out

def starburst(cx, cy, r1, r2, n=12, color=GOLD, op=0.14):
    pts = []
    for i in range(n*2):
        a = math.radians(i*180/n - 90)
        r = r1 if i%2==0 else r2
        pts.append(f"{cx+r*math.cos(a):.1f},{cy+r*math.sin(a):.1f}")
    return f'<polygon points="{" ".join(pts)}" fill="{color}" fill-opacity="{op}" stroke="{color}" stroke-width="1" stroke-opacity="{op+0.3}"/>\n'

def tri(pts_str, color=GOLD, op=0.10, sw=1.4):
    return f'<polygon points="{pts_str}" fill="{color}" fill-opacity="{op}" stroke="{color}" stroke-width="{sw}" stroke-opacity="{op+0.45}"/>\n'

def corner_ornaments(color=GOLD, op=0.38):
    margin, r = 34, 4
    out = ""
    for x, y in [(margin,margin),(W-margin,margin),(margin,H-margin),(W-margin,H-margin)]:
        out += f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" fill-opacity="{op}"/>\n'
    return out

# ── Title renderer ─────────────────────────────────────────────────────────────
def titles_centered(te, sa, en, y_te, color=GOLD, acc=GOLD):
    """Three-line title block: Telugu big, Devanagari medium, Latin small."""
    return (
        f'<text x="{CX}" y="{y_te}" text-anchor="middle" '
        f'font-size="28" fill="{color}" fill-opacity="0.95" font-family="\'Noto Sans Telugu\',serif">{te}</text>\n'
        f'<text x="{CX}" y="{y_te+36}" text-anchor="middle" '
        f'font-size="20" fill="{color}" fill-opacity="0.72" font-family="\'Noto Sans Devanagari\',serif">{sa}</text>\n'
        f'<text x="{CX}" y="{y_te+62}" text-anchor="middle" '
        f'font-size="13" fill="{acc}" fill-opacity="0.55" font-family="sans-serif" letter-spacing="2">{en.upper()}</text>\n'
    )

def title_strip(te, sa, en, color=GOLD, acc=GOLD):
    """Bottom-strip title bar (used when symbol takes centre stage)."""
    return (
        f'<rect x="0" y="{H-90}" width="{W}" height="90" fill="#000000" fill-opacity="0.35"/>\n'
        f'<text x="{CX}" y="{H-58}" text-anchor="middle" '
        f'font-size="26" fill="{color}" fill-opacity="0.95" font-family="\'Noto Sans Telugu\',serif">{te}</text>\n'
        f'<text x="{CX}" y="{H-30}" text-anchor="middle" '
        f'font-size="16" fill="{color}" fill-opacity="0.70" font-family="\'Noto Sans Devanagari\',serif">{sa}</text>\n'
        f'<text x="{W-30}" y="{H-14}" text-anchor="end" '
        f'font-size="11" fill="{acc}" fill-opacity="0.50" font-family="sans-serif" letter-spacing="1.5">{en.upper()}</text>\n'
    )

def side_stripe(te, sa, color=GOLD):
    """Left vertical stripe with rotated title."""
    return (
        f'<rect x="0" y="0" width="72" height="{H}" fill="{color}" fill-opacity="0.08"/>\n'
        f'<line x1="72" y1="0" x2="72" y2="{H}" stroke="{color}" stroke-width="1" stroke-opacity="0.30"/>\n'
        f'<text x="36" y="{H//2}" text-anchor="middle" dominant-baseline="middle" '
        f'font-size="18" fill="{color}" fill-opacity="0.80" font-family="\'Noto Sans Telugu\',serif" '
        f'transform="rotate(-90 36 {H//2})">{te}</text>\n'
    )

# ── 8 design variants ──────────────────────────────────────────────────────────
def v1_om_center(te, sa, en, bg1, bg2, bg3, theme):
    """Variant 1: Big OM, concentric rings, titles below."""
    col = accent(theme)
    body = (
        corner_ornaments(GOLD) +
        ring(CX, CY-30, 175, GOLD, 0.22) +
        ring(CX, CY-30, 130, GOLD, 0.14) +
        ring(CX, CY-30,  80, GOLD, 0.10) +
        f'<text x="{CX}" y="{CY+30}" text-anchor="middle" dominant-baseline="middle" '
        f'font-size="160" fill="{GOLD}" fill-opacity="0.85" font-family="serif">ॐ</text>\n' +
        f'<line x1="{CX-160}" y1="{H-110}" x2="{CX+160}" y2="{H-110}" '
        f'stroke="{GOLD}" stroke-width="0.8" stroke-opacity="0.30"/>\n' +
        titles_centered(te, sa, en, H-102, GOLD, col)
    )
    return base_svg(bg1, bg2, body)

def v2_lotus_title(te, sa, en, bg1, bg2, bg3, theme):
    """Variant 2: 12-petal lotus centred, title strip at bottom."""
    col = accent(theme)
    body = (
        corner_ornaments(GOLD) +
        lotus(CX, CY-20, 50, 170, 12, GOLD, 0.16) +
        lotus(CX, CY-20, 22, 90,  8, GOLD, 0.22) +
        ring(CX, CY-20, 50, GOLD, 0.55, 2) +
        f'<circle cx="{CX}" cy="{CY-20}" r="48" fill="{GOLD}" fill-opacity="0.08"/>\n'
        f'<text x="{CX}" y="{CY-8}" text-anchor="middle" dominant-baseline="middle" '
        f'font-size="56" fill="{GOLD}" fill-opacity="0.80" font-family="serif">ॐ</text>\n' +
        title_strip(te, sa, en, GOLD, col)
    )
    return base_svg(bg1, bg2, body)

def v3_starburst_left(te, sa, en, bg1, bg2, bg3, theme):
    """Variant 3: Starburst left, titles right-aligned."""
    col = accent(theme)
    sx, sy = W*0.30, CY
    body = (
        corner_ornaments(GOLD) +
        starburst(sx, sy, 175, 145, 12, GOLD, 0.10) +
        ring(sx, sy, 145, GOLD, 0.28) +
        ring(sx, sy, 100, GOLD, 0.16) +
        ring(sx, sy,  55, GOLD, 0.40, 2) +
        f'<circle cx="{sx:.0f}" cy="{sy:.0f}" r="52" fill="{GOLD}" fill-opacity="0.10"/>\n'
        f'<text x="{sx:.0f}" y="{sy+14}" text-anchor="middle" dominant-baseline="middle" '
        f'font-size="58" fill="{GOLD}" fill-opacity="0.85" font-family="serif">ॐ</text>\n'
        f'<line x1="{W*0.56}" y1="{CY-90}" x2="{W*0.56}" y2="{CY+90}" '
        f'stroke="{GOLD}" stroke-width="0.8" stroke-opacity="0.22"/>\n'
        f'<text x="{W*0.60}" y="{CY-32}" text-anchor="start" '
        f'font-size="30" fill="{GOLD}" fill-opacity="0.92" font-family="\'Noto Sans Telugu\',serif">{te}</text>\n'
        f'<text x="{W*0.60}" y="{CY+8}" text-anchor="start" '
        f'font-size="20" fill="{GOLD}" fill-opacity="0.68" font-family="\'Noto Sans Devanagari\',serif">{sa}</text>\n'
        f'<text x="{W*0.60}" y="{CY+36}" text-anchor="start" '
        f'font-size="12" fill="{col}" fill-opacity="0.52" font-family="sans-serif" letter-spacing="2">{en.upper()}</text>\n'
    )
    return base_svg(bg1, bg2, body)

def v4_yantra(te, sa, en, bg1, bg2, bg3, theme):
    """Variant 4: Sri-yantra triangles + lotus ring, title bottom strip."""
    col = accent(theme)
    h = 155; w = 175
    body = (
        corner_ornaments(GOLD) +
        ring(CX, CY-20, 195, GOLD, 0.15) +
        ring(CX, CY-20, 170, GOLD, 0.20) +
        lotus(CX, CY-20, 155, 195, 16, GOLD, 0.10) +
        tri(f"{CX},{CY-20-h} {CX-w},{CY-20+h*0.65} {CX+w},{CY-20+h*0.65}", GOLD, 0.08, 1.6) +
        tri(f"{CX},{CY-20+h} {CX-w},{CY-20-h*0.65} {CX+w},{CY-20-h*0.65}", GOLD, 0.08, 1.6) +
        ring(CX, CY-20, 65, GOLD, 0.45, 2) +
        f'<circle cx="{CX}" cy="{CY-20}" r="62" fill="{GOLD}" fill-opacity="0.10"/>\n'
        f'<text x="{CX}" y="{CY-6}" text-anchor="middle" dominant-baseline="middle" '
        f'font-size="60" fill="{GOLD}" fill-opacity="0.85" font-family="serif">ॐ</text>\n' +
        title_strip(te, sa, en, GOLD, col)
    )
    return base_svg(bg1, bg2, body)

def v5_rays_title(te, sa, en, bg1, bg2, bg3, theme):
    """Variant 5: Dense sun rays from centre, title overlay top."""
    col = accent(theme)
    body = (
        corner_ornaments(GOLD) +
        rays(CX, CY+30, 65, 230, 24, GOLD, 0.22, 1.2) +
        rays(CX, CY+30, 65, 190, 12, GOLD, 0.35, 2.2) +
        ring(CX, CY+30, 65, GOLD, 0.55, 2.5) +
        f'<circle cx="{CX}" cy="{CY+30}" r="62" fill="{GOLD}" fill-opacity="0.10"/>\n'
        f'<text x="{CX}" y="{CY+44}" text-anchor="middle" dominant-baseline="middle" '
        f'font-size="62" fill="{GOLD}" fill-opacity="0.85" font-family="serif">ॐ</text>\n'
        # Top title area
        f'<rect x="0" y="0" width="{W}" height="80" fill="#000000" fill-opacity="0.30"/>\n'
        f'<text x="{CX}" y="34" text-anchor="middle" '
        f'font-size="26" fill="{GOLD}" fill-opacity="0.95" font-family="\'Noto Sans Telugu\',serif">{te}</text>\n'
        f'<text x="{CX}" y="62" text-anchor="middle" '
        f'font-size="17" fill="{GOLD}" fill-opacity="0.65" font-family="\'Noto Sans Devanagari\',serif">{sa}</text>\n'
        f'<text x="{W-24}" y="{H-18}" text-anchor="end" '
        f'font-size="11" fill="{col}" fill-opacity="0.48" font-family="sans-serif" letter-spacing="1.5">{en.upper()}</text>\n'
    )
    return base_svg(bg1, bg2, body)

def v6_diamond_frame(te, sa, en, bg1, bg2, bg3, theme):
    """Variant 6: Rotated-square (diamond) frame, titles centred inside."""
    col = accent(theme)
    d = 185
    pts = f"{CX},{CY-30-d} {CX+d},{CY-30} {CX},{CY-30+d} {CX-d},{CY-30}"
    inner = 115
    pts2 = f"{CX},{CY-30-inner} {CX+inner},{CY-30} {CX},{CY-30+inner} {CX-inner},{CY-30}"
    body = (
        corner_ornaments(GOLD) +
        starburst(CX, CY-30, 195, 175, 4, GOLD, 0.08) +
        tri(pts, GOLD, 0.06, 1.8) +
        tri(pts2, GOLD, 0.06, 1.2) +
        ring(CX, CY-30, 65, GOLD, 0.45, 2) +
        f'<text x="{CX}" y="{CY-16}" text-anchor="middle" dominant-baseline="middle" '
        f'font-size="58" fill="{GOLD}" fill-opacity="0.80" font-family="serif">ॐ</text>\n' +
        f'<line x1="{CX-180}" y1="{H-105}" x2="{CX+180}" y2="{H-105}" '
        f'stroke="{GOLD}" stroke-width="0.7" stroke-opacity="0.28"/>\n' +
        titles_centered(te, sa, en, H-98, GOLD, col)
    )
    return base_svg(bg1, bg2, body)

def v7_manuscript(te, sa, en, bg1, bg2, bg3, theme):
    """Variant 7: Manuscript ruling lines, side stripe, large title focus."""
    col = accent(theme)
    body = (
        # Ruled lines
        ''.join(
            f'<line x1="74" y1="{y}" x2="{W-24}" y2="{y}" '
            f'stroke="{GOLD}" stroke-width="0.6" stroke-opacity="0.12"/>\n'
            for y in range(55, H-30, 22)
        ) +
        side_stripe(te, sa, GOLD) +
        # Main area
        f'<text x="{CX+36}" y="{CY-40}" text-anchor="middle" '
        f'font-size="100" fill="{GOLD}" fill-opacity="0.18" font-family="serif" filter="url(#blur8)">ॐ</text>\n'
        f'<text x="{CX+36}" y="{CY-40}" text-anchor="middle" dominant-baseline="middle" '
        f'font-size="100" fill="{GOLD}" fill-opacity="0.65" font-family="serif">ॐ</text>\n'
        f'<text x="{CX+36}" y="{CY+52}" text-anchor="middle" '
        f'font-size="32" fill="{GOLD}" fill-opacity="0.90" font-family="\'Noto Sans Telugu\',serif">{te}</text>\n'
        f'<text x="{CX+36}" y="{CY+92}" text-anchor="middle" '
        f'font-size="21" fill="{GOLD}" fill-opacity="0.65" font-family="\'Noto Sans Devanagari\',serif">{sa}</text>\n'
        f'<text x="{CX+36}" y="{CY+122}" text-anchor="middle" '
        f'font-size="13" fill="{col}" fill-opacity="0.50" font-family="sans-serif" letter-spacing="2">{en.upper()}</text>\n'
    )
    return base_svg(bg1, bg2, body)

def v8_chakra_mandala(te, sa, en, bg1, bg2, bg3, theme):
    """Variant 8: Multi-ring mandala with petal layers, title inside/below."""
    col = accent(theme)
    cx2, cy2 = CX, CY-20
    body = (
        corner_ornaments(GOLD) +
        # Outer glow ring (blurred)
        f'<circle cx="{cx2}" cy="{cy2}" r="195" fill="none" stroke="{GOLD}" '
        f'stroke-width="14" stroke-opacity="0.08" filter="url(#blur4)"/>\n' +
        lotus(cx2, cy2, 150, 195, 16, GOLD, 0.10) +
        ring(cx2, cy2, 150, GOLD, 0.20) +
        lotus(cx2, cy2,  80, 140, 12, GOLD, 0.14) +
        ring(cx2, cy2, 80, GOLD, 0.18) +
        lotus(cx2, cy2,  32,  72,  8, GOLD, 0.22) +
        ring(cx2, cy2, 32, GOLD, 0.50, 2) +
        f'<circle cx="{cx2}" cy="{cy2}" r="30" fill="{GOLD}" fill-opacity="0.10"/>\n'
        f'<text x="{cx2}" y="{cy2+10}" text-anchor="middle" dominant-baseline="middle" '
        f'font-size="32" fill="{GOLD}" fill-opacity="0.85" font-family="serif">ॐ</text>\n' +
        f'<line x1="{CX-175}" y1="{H-108}" x2="{CX+175}" y2="{H-108}" '
        f'stroke="{GOLD}" stroke-width="0.8" stroke-opacity="0.28"/>\n' +
        titles_centered(te, sa, en, H-100, GOLD, col)
    )
    return base_svg(bg1, bg2, body)

VARIANTS = [v1_om_center, v2_lotus_title, v3_starburst_left, v4_yantra,
            v5_rays_title, v6_diamond_frame, v7_manuscript, v8_chakra_mandala]

# ── Generate ───────────────────────────────────────────────────────────────────
OUT = "assets/images"
os.makedirs(OUT, exist_ok=True)

slugs = [s["slug"] for s in json.load(open("data/stotrams.json"))["stotrams"]]
total = 0

for slug in slugs:
    te, sa, en, theme = get_titles(slug)
    palettes = PALETTES.get(theme, PALETTES["theme-vishnu"])

    for i, fn in enumerate(VARIANTS):
        pal_idx = i % len(palettes)
        bg1, bg2, bg3 = palettes[pal_idx]
        svg = fn(te, sa, en, bg1, bg2, bg3, theme)
        path = f"{OUT}/{slug}-{i+1:02d}.svg"
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        total += 1
        print(f"  {path}")

print(f"\n✓ {total} images ({len(slugs)} stotrams × 8 variants)")
