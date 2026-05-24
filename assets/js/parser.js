/**
 * parser.js — Parses stotram .txt files into structured shloka objects.
 *
 * Format rules:
 *   # heading text          → section heading
 *   [AUDIO_START=ss]        → audio start (seconds)
 *   [AUDIO_END=ss]          → audio end (seconds)
 *   blank line              → shloka separator
 *   everything else         → shloka text lines
 */

window.StotramParser = {

  /**
   * Fetch and parse a stotram text file.
   * @param {string} url  Path to the .txt file
   * @returns {Promise<ParsedStotram>}
   */
  async fetchAndParse(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Could not load: ${url} (${resp.status})`);
    const text = await resp.text();
    return this.parse(text);
  },

  /**
   * Parse raw text into structured output.
   * @param {string} text
   * @returns {ParsedStotram}
   */
  parse(text) {
    const lines = text.split(/\r?\n/);
    const blocks = [];   // { type: 'heading'|'shloka', ... }

    let currentLines = [];
    let audioStart = null;
    let audioEnd = null;
    let shlokaIndex = 0;

    const flush = () => {
      const joined = currentLines.join('\n').trim();
      if (!joined) return;
      shlokaIndex++;
      blocks.push({
        type: 'shloka',
        index: shlokaIndex,
        text: joined,
        audioStart,
        audioEnd,
      });
      currentLines = [];
      audioStart = null;
      audioEnd = null;
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      // Blank line → flush current shloka
      if (line.trim() === '') {
        flush();
        continue;
      }

      // Section heading
      if (line.startsWith('#')) {
        flush();
        blocks.push({
          type: 'heading',
          text: line.replace(/^#+\s*/, '').trim(),
        });
        continue;
      }

      // Audio start tag
      const audioStartMatch = line.match(/^\[AUDIO_START=(\d+(?:\.\d+)?)\]$/i);
      if (audioStartMatch) {
        audioStart = parseFloat(audioStartMatch[1]);
        continue;
      }

      // Audio end tag
      const audioEndMatch = line.match(/^\[AUDIO_END=(\d+(?:\.\d+)?)\]$/i);
      if (audioEndMatch) {
        audioEnd = parseFloat(audioEndMatch[1]);
        continue;
      }

      // Regular shloka text line
      currentLines.push(line);
    }

    // Flush any remaining
    flush();

    return { blocks, totalShlokas: shlokaIndex };
  },

  /**
   * Transliterate all shloka text blocks to the target lipi.
   * Falls back to original text if Sanscript is unavailable.
   *
   * @param {ParsedStotram} parsed
   * @param {string} fromScript  e.g. 'telugu', 'devanagari'
   * @param {string} toScript    e.g. 'telugu', 'devanagari', 'iast'
   * @returns {ParsedStotram}  new object with transliterated text
   */
  transliterate(parsed, fromScript, toScript) {
    if (!window.Sanscript || fromScript === toScript) return parsed;

    const transliterateText = (text) => {
      try {
        return Sanscript.t(text, fromScript, toScript);
      } catch (e) {
        console.warn('Transliteration failed:', e);
        return text;
      }
    };

    return {
      ...parsed,
      blocks: parsed.blocks.map(block => {
        if (block.type !== 'shloka') return block;
        return { ...block, text: transliterateText(block.text) };
      })
    };
  },

  /**
   * Detect the script of a sample of text.
   * Returns 'devanagari', 'telugu', 'kannada', or 'unknown'.
   */
  detectScript(sample) {
    const counts = {
      devanagari: (sample.match(/[\u0900-\u097F]/g) || []).length,
      telugu:     (sample.match(/[\u0C00-\u0C7F]/g) || []).length,
      kannada:    (sample.match(/[\u0C80-\u0CFF]/g) || []).length,
    };
    const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return max[1] > 0 ? max[0] : 'unknown';
  },

  /**
   * Map lipi UI value to Sanscript scheme name.
   */
  schemeFor(lipi) {
    const map = { sa: 'devanagari', te: 'telugu', iast: 'iast', kn: 'kannada' };
    return map[lipi] || 'telugu';
  }
};
