/**
 * parser.js — Parses stotram .txt files into structured shloka objects.
 *
 * ── TIMESTAMP FORMAT ────────────────────────────────────────────────────────
 *
 *   Current format — decimal seconds (plain float):
 *     [AUDIO_START=24.21]   →  24.21 seconds
 *     [AUDIO_START=95]      →  95 seconds
 *     [AUDIO_START=0.5]     →  0.5 seconds
 *
 *   Future format — colon-separated (auto-detected when : is present):
 *     [AUDIO_START=05:12]       →  mm:ss  → 5m 12s = 312s
 *     [AUDIO_START=05:12:22]    →  mm:ss:ms → 5m 12s 220ms = 312.22s
 *
 *   Both formats can be mixed freely in the same file.
 *   No migration needed when you switch — old decimal tags keep working.
 *
 * ── FILE LAYOUT — ALL VARIANTS HANDLED ──────────────────────────────────────
 *
 *   Compact (recommended):          Spaced out (also fine):
 *   [AUDIO_START=24.21]             [AUDIO_START=24.21]
 *   శ్లోకం వచనం ॥ 1 ॥             
 *   [AUDIO_END=33.10]               శ్లోకం వచనం ॥ 1 ॥
 *                                   
 *                                   [AUDIO_END=33.10]
 *
 *   No audio (plain shlokas separated by blank lines):
 *   శ్లోకం వచనం ॥ 1 ॥
 *
 *   తదుపరి శ్లోకం ॥ 2 ॥
 *
 * ── OTHER RULES ─────────────────────────────────────────────────────────────
 *   # text    →  section heading (styled, not counted as shloka)
 *   blank line →  shloka separator
 */

window.StotramParser = {

  async fetchAndParse(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Could not load: ${url} (${resp.status})`);
    return this.parse(await resp.text());
  },

  parse(text) {
    const lines = text.split(/\r?\n/);
    const blocks = [];
    let currentLines = [];
    let pendingStart = null;
    let pendingEnd = null;
    let shlokaIndex = 0;

    const flush = () => {
      const joined = currentLines.join('\n').trim();
      if (!joined) return;
      shlokaIndex++;
      blocks.push({
        type: 'shloka',
        index: shlokaIndex,
        text: joined,
        audioStart: pendingStart,
        audioEnd: pendingEnd,
      });
      currentLines = [];
      pendingStart = null;
      pendingEnd = null;
    };

    // When [AUDIO_END] appears after a blank line that already flushed the shloka,
    // patch the end time back into the last committed shloka.
    const patchLastEnd = (val) => {
      for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].type === 'shloka') { blocks[i].audioEnd = val; return; }
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();

      // Blank line — flush only if shloka text is already accumulating.
      // Blank lines between [AUDIO_START] and shloka text are silently ignored
      // so pendingStart is preserved.
      if (trimmed === '') {
        if (currentLines.length > 0) flush();
        continue;
      }

      // Section heading
      if (trimmed.startsWith('#')) {
        flush();
        blocks.push({ type: 'heading', text: trimmed.replace(/^#+\s*/, '') });
        continue;
      }

      // [AUDIO_START=...]
      const sm = trimmed.match(/^\[AUDIO_START=([^\]]+)\]$/i);
      if (sm) {
        if (currentLines.length > 0) flush();
        pendingStart = this._parseTimestamp(sm[1]);
        continue;
      }

      // [AUDIO_END=...]
      const em = trimmed.match(/^\[AUDIO_END=([^\]]+)\]$/i);
      if (em) {
        const val = this._parseTimestamp(em[1]);
        if (currentLines.length > 0) {
          pendingEnd = val;
          flush();
        } else {
          patchLastEnd(val);
        }
        continue;
      }

      // Shloka text
      currentLines.push(line);
    }

    flush();
    return { blocks, totalShlokas: shlokaIndex };
  },

  /**
   * Parse a timestamp string to seconds (float).
   *
   * Formats:
   *   "24.21"     → 24.21s      (decimal seconds — current format)
   *   "95"        → 95s         (integer seconds)
   *   "05:12"     → 312s        (mm:ss)
   *   "05:12:22"  → 312.22s     (mm:ss:ms — future format)
   */
  _parseTimestamp(raw) {
    const s = raw.trim();

    if (s.includes(':')) {
      const parts = s.split(':');

      // mm:ss:ms  e.g. 05:12:22 → 5*60 + 12 + 22/100 = 312.22s
      if (parts.length === 3) {
        const mm = parseInt(parts[0], 10);
        const ss = parseInt(parts[1], 10);
        const ms = parseInt(parts[2], 10);
        if ([mm, ss, ms].some(isNaN)) {
          console.warn(`[parser] Invalid timestamp: "${s}"`);
          return null;
        }
        // 2-digit ms → centiseconds (22 → 0.22s); 3-digit → milliseconds (220 → 0.22s)
        const msSeconds = parts[2].length <= 2 ? ms / 100 : ms / 1000;
        return mm * 60 + ss + msSeconds;
      }

      // mm:ss  e.g. 05:12 → 312s
      if (parts.length === 2) {
        const mm = parseInt(parts[0], 10);
        const ss = parseInt(parts[1], 10);
        if ([mm, ss].some(isNaN)) {
          console.warn(`[parser] Invalid timestamp: "${s}"`);
          return null;
        }
        return mm * 60 + ss;
      }

      console.warn(`[parser] Invalid timestamp: "${s}"`);
      return null;
    }

    // Decimal or integer seconds
    const num = parseFloat(s);
    if (isNaN(num)) {
      console.warn(`[parser] Invalid timestamp: "${s}"`);
      return null;
    }
    return num;
  },

  // Transliteration (unchanged)
  transliterate(parsed, fromScript, toScript) {
    if (!window.Sanscript || fromScript === toScript) return parsed;
    const tr = t => { try { return Sanscript.t(t, fromScript, toScript); } catch (e) { return t; } };
    return {
      ...parsed,
      blocks: parsed.blocks.map(b => b.type !== 'shloka' ? b : { ...b, text: tr(b.text) })
    };
  },

  detectScript(sample) {
    const counts = {
      devanagari: (sample.match(/[\u0900-\u097F]/g) || []).length,
      telugu: (sample.match(/[\u0C00-\u0C7F]/g) || []).length,
      kannada: (sample.match(/[\u0C80-\u0CFF]/g) || []).length,
    };
    const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return max[1] > 0 ? max[0] : 'unknown';
  },

  schemeFor(lipi) {
    return { sa: 'devanagari', te: 'telugu', iast: 'iast', kn: 'kannada' }[lipi] || 'telugu';
  },

  /**
   * Debug helper — call from browser console to verify timestamps.
   * Usage:  StotramParser.debugTimestamps(rawTextString)
   */
  debugTimestamps(text) {
    const parsed = this.parse(text);
    const rows = parsed.blocks
      .filter(b => b.type === 'shloka')
      .map(b => ({
        '#': b.index,
        text: b.text.slice(0, 40).replace(/\n/g, ' ') + '…',
        start: b.audioStart !== null ? `${b.audioStart}s` : '—',
        end: b.audioEnd !== null ? `${b.audioEnd}s` : '—',
      }));
    console.table(rows);
    return rows;
  }
};