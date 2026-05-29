/**
 * search.js — Fuse.js search against stotram metadata + loaded shloka text.
 *
 * Bugs fixed:
 *  1. _bindUI() had no guard — calling init() twice stacked duplicate listeners
 *  2. Result click called navigate() then openStotram() separately — wrong order
 *  3. Document click listener closed results before result click could fire
 *  4. Fuse threshold too tight for short Sanskrit/Telugu queries
 */

window.StotramSearch = {
  fuse: null,
  index: [],
  _uiBound: false,   // guard: bind DOM listeners exactly once

  async init(stotramsIndex) {
    // Build base index from metadata
    this.index = stotramsIndex.map(s => ({
      id: s.slug,
      type: 'stotram',
      slug: s.slug,
      stotram: (s.title_te || '') + ' ' + (s.title_sa || ''),
      stotram_en: s.title_en || '',
      tags: (s.tags || []).join(' '),
      synonyms: (s.synonyms || []).join(' '),
      description: (s.description_en || '') + ' ' + (s.description_te || ''),
      shloka_text: '',
      section: '',
    }));

    // Try pre-built index from GitHub Actions
    try {
      const resp = await fetch('data/search-index.json');
      if (resp.ok) {
        const extra = await resp.json();
        if (Array.isArray(extra) && extra.length) {
          this.index = [...this.index, ...extra];
        }
      }
    } catch { /* not generated yet — metadata-only search still works */ }

    this._buildFuse();

    // BUG 1 FIX: bind UI only once — init() may be called again on hot reload
    if (!this._uiBound) {
      this._bindUI();
      this._uiBound = true;
    }
  },

  // Called by app.js after each section renders — adds shloka text to index
  addShlokas(slug, sectionTitle, blocks) {
    // Remove stale entries for this slug+section
    this.index = this.index.filter(
      e => !(e.type === 'shloka' && e.slug === slug && e.section === sectionTitle)
    );
    blocks.filter(b => b.type === 'shloka').forEach(b => {
      this.index.push({
        id: `${slug}:${b.index}`,
        type: 'shloka',
        slug,
        stotram: '',
        stotram_en: '',
        tags: '',
        synonyms: '',
        description: '',
        shloka_text: b.text,
        section: sectionTitle,
        shloka_index: b.index,
      });
    });
    this._buildFuse();
  },

  _buildFuse() {
    if (!window.Fuse) return;
    this.fuse = new Fuse(this.index, {
      keys: [
        { name: 'stotram', weight: 0.30 },
        { name: 'stotram_en', weight: 0.25 },
        { name: 'tags', weight: 0.20 },
        { name: 'synonyms', weight: 0.15 },
        { name: 'description', weight: 0.07 },
        { name: 'shloka_text', weight: 0.03 },
      ],
      threshold: 0.45,   // slightly looser — handles "krishna" → "Krishna"
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
      useExtendedSearch: false,
    });
  },

  _bindUI() {
    const input = document.getElementById('globalSearch');
    const results = document.getElementById('searchResults');
    const clear = document.getElementById('searchClear');
    if (!input) return;

    // Typing → debounced search
    let timer;
    input.addEventListener('input', e => {
      clearTimeout(timer);
      const q = e.target.value.trim();
      clear?.classList.toggle('hidden', !q);
      if (!q) { results?.classList.add('hidden'); return; }
      timer = setTimeout(() => this._run(q), 220);
    });

    // Clear button
    clear?.addEventListener('click', () => {
      input.value = '';
      results?.classList.add('hidden');
      clear.classList.add('hidden');
      input.focus();
    });

    // BUG 2 FIX: use navigate() which calls openStotram() internally
    // Old code: openStotram() then navigate() separately — wrong order, wrong hash
    results?.addEventListener('click', e => {
      const item = e.target.closest('.search-result-item[data-slug]');
      if (!item) return;
      const slug = item.dataset.slug;
      results.classList.add('hidden');
      input.value = '';
      clear?.classList.add('hidden');
      // navigate('reader', slug) handles both URL hash AND openStotram()
      window.StotramApp?.navigate('reader', slug);
    });

    // Keyboard: Enter on focused result
    results?.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const item = e.target.closest('.search-result-item[data-slug]');
      if (!item) return;
      item.click();
    });

    // BUG 3 FIX: close results on outside click, but use mousedown not click
    // so the results click handler fires BEFORE the outside-click handler
    document.addEventListener('mousedown', e => {
      if (!e.target.closest('.search-bar-wrap')) {
        results?.classList.add('hidden');
      }
    });
  },

  _run(query) {
    const results = document.getElementById('searchResults');
    if (!results) return;

    if (!this.fuse) {
      results.innerHTML = `<div class="search-result-item" style="color:var(--c-text-muted)">
        ${window.i18n?.t('loading') || 'Loading search…'}</div>`;
      results.classList.remove('hidden');
      return;
    }

    const hits = this.fuse.search(query).slice(0, 15);

    if (!hits.length) {
      results.innerHTML = `<div class="search-result-item" style="color:var(--c-text-muted);font-style:italic">
        ${window.i18n?.t('no_results') || 'No results found.'}</div>`;
      results.classList.remove('hidden');
      return;
    }

    results.innerHTML = hits.map(({ item }) => {
      const meta = item.type === 'stotram'
        ? (item.stotram_en || item.stotram)
        : `${item.stotram_en || item.slug} › ${item.section} › ${window.i18n?.t('shloka_label') || 'Shloka'} ${item.shloka_index}`;
      const body = (item.shloka_text || item.description || '').slice(0, 140);
      return `
        <div class="search-result-item" data-slug="${item.slug}"
             role="option" tabindex="0">
          <div class="sr-meta">${this._esc(meta)}</div>
          <div class="sr-text">${this._highlight(this._esc(body), query)}</div>
        </div>`;
    }).join('');

    results.classList.remove('hidden');
  },

  _esc(t) {
    return String(t)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  _highlight(text, q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(
      new RegExp(`(${safe})`, 'gi'),
      '<span class="sr-highlight">$1</span>'
    );
  }
};