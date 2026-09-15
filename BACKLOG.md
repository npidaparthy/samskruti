# Samskruti — Product Backlog

> **How to filter:** `grep` or Ctrl+F on tags in the Type / Severity / Status columns.  
> Tags: `bug` `enhancement` `wishlist` · `S1` `S2` `S3` · `open` `in-progress` `done` `wontfix`

---

## UX Issues

| # | Title | Type | Severity | Status | Current Behaviour | Options | Recommendation |
|---|-------|------|----------|--------|-------------------|---------|----------------|
| U1 | Lipi change loses scroll position | `enhancement` | `S2` | `open` | User is mid-page, changes Script (lipi) → section re-renders → page jumps to top → user must scroll back to where they were | **A.** Save & restore `scrollY` (simple but lands wrong shloka if line-height differs between scripts). **B.** Anchor by visible shloka — find shloka closest to viewport centre before re-render, scroll to same shloka index after (accurate). **C.** In-place text swap — replace text nodes without touching DOM structure (no scroll at all, most complex) | **Option B** — ~20 lines, handles height differences between Telugu/Devanagari cleanly |
| U2 | Font size control | `enhancement` | `S2` | `open` | Font size is fixed; older users or phone users may struggle to read dense Sanskrit text | **A.** A+/A− buttons in header (persist to localStorage). **B.** Slider in Settings panel. **C.** Respect OS font scale via `rem` (already partially done) | **Option A** — visible, one-tap, familiar pattern for devotional apps |
| U3 | Search navigates to stotram, not shloka | `enhancement` | `S2` | `open` | Search finds matching shlokas but tapping a result opens the section from top — user has to find the highlighted shloka manually | Jump to and highlight the matching shloka after navigation (use `#shloka-N` anchor or `scrollIntoView`) | Implement anchor scroll after search-result navigation |
| U4 | No bookmark / resume position | `wishlist` | `S3` | `open` | User closes app mid-stotram and loses their place; next visit starts from section 1 | **A.** Auto-save last-read shloka index to localStorage, resume on next open. **B.** Explicit bookmark button per shloka | **Option A** (auto-save) first, explicit bookmarks later |
| U5 | No progress indicator within a section | `wishlist` | `S3` | `open` | Long sections (Vishnu Sahasranamam has 108+ shlokas) give no sense of how far through the user is | Thin progress bar below section tabs showing scroll % through current section | Simple `scroll` listener → `width` on a `<div class="read-progress">` |

---

## Bugs

| # | Title | Type | Severity | Status | Description | Root Cause | Fix |
|---|-------|------|----------|--------|-------------|------------|-----|
| B1 | Service worker serves stale files locally | `bug` | `S1` | `done` | After code changes, localhost:8787 shows old UI even after Cmd+Shift+R | SW cache not invalidated; CI stamps new cache key only on deploy | Unregister SW in DevTools during local dev; CI stamps git hash on each deploy |
| B2 | Transliterated files missing on gh-pages | `bug` | `S1` | `done` | `_sa.txt` / `_iast.txt` not deployed → Devanagari/IAST lipi fails silently | `.gitignore` had `data/**/*_sa.txt` entries → `peaceiris/actions-gh-pages` excluded them | Removed those entries from `.gitignore` |
| B3 | generate-images.js overwrote chosen favicons | `bug` | `S2` | `done` | CI regenerated `icon-192.svg` / `icon-512.svg` unconditionally, losing manually chosen icons | No existence check before write | Added `if (!fs.existsSync(...))` guard |
| B4 | Section tab labels show wrong script | `bug` | `S2` | `done` | With lipi=తె, lang=EN → tabs showed IAST titles instead of Telugu | Tab label logic used `lang` instead of `lipi` to pick title field | Fixed: `lipi=te` always uses `title_te` regardless of `lang` |
| B5 | Favicon index CI step caused deploy failure | `bug` | `S2` | `done` | Shell quoting error in `echo` command blocked the deploy step | `$(echo $files \| jq length)` — unquoted variable with jq piping | Added `continue-on-error: true`; simplified command |

---

## Enhancements

| # | Title | Type | Severity | Status | Description | Notes |
|---|-------|------|----------|--------|-------------|-------|
| E1 | Audio / recitation playback | `wishlist` | `S3` | `open` | Play audio while reading along — shloka-by-shloka sync would be ideal | Needs audio files hosted externally (large); basic version = single mp3 per stotram |
| E2 | Night / dark mode | `enhancement` | `S2` | `open` | Current dark navy is close to dark mode but not a true toggle; useful for early-morning puja use | CSS variable swap; respect `prefers-color-scheme` as default |
| E3 | Share a shloka | `wishlist` | `S3` | `open` | Share individual shlokas via WhatsApp / copy-to-clipboard | Web Share API + fallback copy; needs shloka permalink (`#reader/slug/section/6`) |
| E4 | Offline first — full PWA | `enhancement` | `S2` | `open` | Service worker caches main shell; data files (`_sa.txt` etc.) not pre-cached — IAST/Devanagari fails offline | Add data files to SW pre-cache list during CI (generate manifest of all `.txt` files) |
| E5 | Add more stotrams | `wishlist` | `S3` | `open` | Only 4 stotrams currently; community likely wants Hanuman Chalisa, Durga Saptashati, Aditya Hridayam etc. | Content work; pipeline (transliterate.js + _meta.json) already handles new additions cleanly |

---

## Done (recent)

| # | Title | Shipped |
|---|-------|---------|
| D1 | Bottom nav (prev/next section at end of content) | 2026-06 |
| D2 | Floating ↑ FAB (scroll-to-top while reading) | 2026-06 |
| D3 | Pre-generated transliteration files (no client-side Sanscript) | 2026-06 |
| D4 | Random favicon picker from CI-generated index | 2026-06 |
| D5 | Help banner (first-visit script/lang explainer) | 2026-06 |
| D6 | Lang toggle active highlight (yellow pill) | 2026-06 |
| D7 | Script/Lang labels above controls | 2026-06 |
| D8 | CI service worker cache stamping (git hash) | 2026-06 |
| D9 | CNAME file to preserve custom domain on deploy | 2026-06 |

---

*Last updated: 2026-06*
