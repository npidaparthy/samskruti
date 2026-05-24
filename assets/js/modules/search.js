/**
 * search.js — Fuse.js powered search against pre-built or inline index.
 */

window.StotramSearch = {
  fuse: null,
  index: [],

  async init(stotramsIndex) {
    // Try to load pre-built index first
    try {
      const resp = await fetch('data/search-index.json');
      if (resp.ok) {
        this.index = await resp.json();
      }
    } catch {
      // Build a basic index from stotrams metadata for now
      this.index = stotramsIndex.map(s => ({
        id: s.slug,
        stotram: s.title_te,
        stotram_en: s.title_en,
        tags: (s.tags || []).join(' '),
        synonyms: (s.synonyms || []).join(' '),
        description: s.description_en || '',
        type: 'stotram',
        slug: s.slug,
      }));
    }

    if (window.Fuse) {
      this.fuse = new Fuse(this.index, {
        keys: ['stotram', 'stotram_en', 'tags', 'synonyms', 'description', 'shloka_text'],
        threshold: 0.35,
        includeMatches: true,
        minMatchCharLength: 2,
      });
    }

    this._bindSearchUI();
  },

  _bindSearchUI() {
    const input = document.getElementById('globalSearch');
    const results = document.getElementById('searchResults');
    const clearBtn = document.getElementById('searchClear');

    if (!input) return;

    let debounceTimer;
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const q = e.target.value.trim();
      clearBtn?.classList.toggle('hidden', !q);
      if (!q) { results?.classList.add('hidden'); return; }
      debounceTimer = setTimeout(() => this._runSearch(q), 220);
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      results?.classList.add('hidden');
      clearBtn.classList.add('hidden');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar-wrap')) {
        results?.classList.add('hidden');
      }
    });
  },

  _runSearch(query) {
    const results = document.getElementById('searchResults');
    if (!results) return;

    if (!this.fuse) {
      results.innerHTML = `<div class="search-result-item" style="color:var(--c-text-muted)">Search not available (Fuse.js not loaded)</div>`;
      results.classList.remove('hidden');
      return;
    }

    const hits = this.fuse.search(query).slice(0, 12);

    if (!hits.length) {
      results.innerHTML = `<div class="search-result-item" style="color:var(--c-text-muted)">${window.i18n?.t('no_results') || 'No results found.'}</div>`;
      results.classList.remove('hidden');
      return;
    }

    results.innerHTML = hits.map(hit => {
      const item = hit.item;
      const meta = item.type === 'stotram' ? item.stotram : `${item.stotram} — ${window.i18n?.t('shloka_label')} ${item.shloka_index || ''}`;
      const text = item.description || item.shloka_text || '';
      return `
        <div class="search-result-item"
             data-nav="reader" data-slug="${item.slug}"
             role="option" tabindex="0">
          <div class="sr-meta">${meta}</div>
          <div class="sr-text">${this._highlight(text.slice(0, 120), query)}</div>
        </div>`;
    }).join('');

    results.classList.remove('hidden');
  },

  _highlight(text, query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'),
      '<span class="sr-highlight">$1</span>');
  }
};
