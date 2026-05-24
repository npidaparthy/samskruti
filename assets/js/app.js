/**
 * app.js — Main application bootstrap, routing, and page rendering.
 * Reads data/stotrams.json and wires all modules together.
 */

window.StotramApp = {
  currentSlug: null,
  currentMeta: null,
  currentSection: null,
  stotramsIndex: [],

  async init() {
    // 1. Init settings first (theme, lipi, font)
    window.StotramSettings?.init();

    // 2. Init i18n
    window.i18n?.init();

    // 3. Load master stotrams index
    await this.loadIndex();

    // 4. Setup navigation
    this.bindNav();

    // 5. Setup search
    window.StotramSearch?.init(this.stotramsIndex);

    // 6. Setup bookmarks UI
    window.StotramBookmarks?.init();

    // 7. Render home page
    this.renderHome();

    // 8. Handle PWA install prompt
    this.setupInstallPrompt();

    // 9. Listen for lipi changes → re-render if on reader
    document.addEventListener('lipichange', () => {
      if (this.currentSlug && this.currentSection !== null) {
        this.renderSection(this.currentSlug, this.currentSection);
      }
    });

    console.log('Stotram App initialised ✓');
  },

  // ── Index ────────────────────────────────────────────────

  async loadIndex() {
    try {
      const resp = await fetch('data/stotrams.json');
      if (!resp.ok) throw new Error('stotrams.json not found');
      const json = await resp.json();
      this.stotramsIndex = json.stotrams || [];
    } catch (e) {
      console.error('Failed to load stotrams.json:', e);
      this.stotramsIndex = [];
      this.showError('Could not load stotrams index. Please check data/stotrams.json exists.');
    }
  },

  // ── Navigation ───────────────────────────────────────────

  bindNav() {
    // All elements with data-nav attribute
    document.addEventListener('click', (e) => {
      const navEl = e.target.closest('[data-nav]');
      if (navEl) {
        e.preventDefault();
        this.navigate(navEl.dataset.nav, navEl.dataset);
      }
    });

    // Back button in reader
    document.getElementById('readerBack')?.addEventListener('click', () => {
      this.navigate('stotrams');
    });
  },

  navigate(page, data = {}) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.add('hidden');
      p.classList.remove('active');
    });

    // Update nav tab active state
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.nav === page);
    });

    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }

    // Page-specific actions
    switch (page) {
      case 'home':
        this.renderHome();
        break;
      case 'stotrams':
        this.renderStotramsList();
        break;
      case 'reader':
        if (data.slug) this.openStotram(data.slug);
        break;
    }

    // Close mobile menu
    document.getElementById('mobileNav')?.classList.add('hidden');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ── Home Page ────────────────────────────────────────────

  renderHome() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    const featured = this.stotramsIndex.filter(s => s.featured);
    if (featured.length === 0) {
      grid.innerHTML = `<p style="color:var(--c-text-muted);grid-column:1/-1">${window.i18n?.t('no_results') || 'No stotrams found.'}</p>`;
      return;
    }
    grid.innerHTML = featured.map(s => this.buildCard(s)).join('');
  },

  // ── Stotrams List ────────────────────────────────────────

  renderStotramsList() {
    // Build tag set
    const allTags = new Set(['all']);
    this.stotramsIndex.forEach(s => (s.tags || []).forEach(t => allTags.add(t)));

    const chipsEl = document.getElementById('tagChips');
    if (chipsEl) {
      chipsEl.innerHTML = [...allTags].map(tag =>
        `<button class="tag-chip${tag === 'all' ? ' active' : ''}" data-tag="${tag}">
          ${tag === 'all' ? (window.i18n?.t('tag_all') || 'All') : tag}
        </button>`
      ).join('');

      chipsEl.querySelectorAll('.tag-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          chipsEl.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.filterStotrams(chip.dataset.tag);
        });
      });
    }

    this.filterStotrams('all');
  },

  filterStotrams(tag) {
    const grid = document.getElementById('stotramsGrid');
    if (!grid) return;
    const list = tag === 'all'
      ? this.stotramsIndex
      : this.stotramsIndex.filter(s => (s.tags || []).includes(tag));
    grid.innerHTML = list.length
      ? list.map(s => this.buildCard(s)).join('')
      : `<p style="color:var(--c-text-muted);grid-column:1/-1">${window.i18n?.t('no_results')}</p>`;
  },

  buildCard(stotram) {
    const tags = (stotram.tags || []).slice(0, 3).map(t =>
      `<span class="tag-pill">${t}</span>`
    ).join('');

    return `
      <div class="stotram-card" data-nav="reader" data-slug="${stotram.slug}" tabindex="0"
           role="button" aria-label="Open ${stotram.title_en}"
           onkeydown="if(event.key==='Enter')this.click()">
        <div class="card-image" style="background:var(--c-primary)">
          <span class="card-image-om">ॐ</span>
        </div>
        <div class="card-body">
          <div class="card-title-te">${stotram.title_te || stotram.title_sa}</div>
          <div class="card-title-en">${stotram.title_en}</div>
          <div class="card-desc">${stotram.description_en || ''}</div>
          <div class="card-tags">${tags}</div>
        </div>
      </div>`;
  },

  // ── Reader ───────────────────────────────────────────────

  async openStotram(slug) {
    const meta = this.stotramsIndex.find(s => s.slug === slug);
    if (!meta) {
      this.showError(`Stotram not found: ${slug}`);
      return;
    }

    this.currentSlug = slug;
    this.currentMeta = meta;

    // Apply theme
    window.StotramSettings?.applyTheme(slug, meta.theme);

    // Update reader header
    document.getElementById('readerTitle').textContent = meta.title_te || meta.title_sa;
    document.getElementById('readerSubtitle').textContent = meta.title_en;

    // Build section tabs
    const sections = meta.sections || meta.chapters || [];
    const tabsEl = document.getElementById('sectionTabs');
    if (tabsEl && sections.length > 1) {
      tabsEl.innerHTML = sections.map((sec, i) =>
        `<button class="section-tab${i === 0 ? ' active' : ''}"
                 data-section-index="${i}">${sec.title_te || sec.title_en}</button>`
      ).join('');
      tabsEl.querySelectorAll('.section-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          tabsEl.querySelectorAll('.section-tab').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderSection(slug, parseInt(btn.dataset.sectionIndex));
        });
      });
    } else if (tabsEl) {
      tabsEl.innerHTML = '';
    }

    // Setup audio
    window.StotramAudio?.setup(meta);

    // Render first section
    await this.renderSection(slug, 0);

    // Show page
    this.navigate('reader');
  },

  async renderSection(slug, sectionIndex) {
    this.currentSection = sectionIndex;
    const meta = this.currentMeta;
    const sections = meta.sections || meta.chapters || [];
    const section = sections[sectionIndex];
    if (!section) return;

    const container = document.getElementById('shlokasContainer');
    if (!container) return;

    container.innerHTML = `<div class="skeleton-card" style="height:200px"></div>`;

    // Determine file path
    const basePath = `data/${slug}/`;
    const filePath = basePath + section.file;

    try {
      // Fetch the appropriate lipi file if pre-generated, else fallback
      const lipi = window.StotramSettings?.get('lipi') || 'te';
      const lipiFile = this.lipiFilePath(filePath, lipi);
      let parsed;

      try {
        parsed = await window.StotramParser.fetchAndParse(lipiFile);
      } catch {
        // Fallback: load source and transliterate live
        parsed = await window.StotramParser.fetchAndParse(filePath);
        const detectedScript = window.StotramParser.detectScript(
          parsed.blocks.find(b => b.type === 'shloka')?.text || ''
        );
        if (detectedScript !== window.StotramParser.schemeFor(lipi)) {
          parsed = window.StotramParser.transliterate(
            parsed,
            detectedScript,
            window.StotramParser.schemeFor(lipi)
          );
        }
      }

      container.innerHTML = this.renderBlocks(parsed.blocks, slug);

      // Pass shloka timestamps to audio
      const shlokas = parsed.blocks.filter(b => b.type === 'shloka');
      window.StotramAudio?.setShlokas(shlokas);

    } catch (e) {
      console.error('Failed to load section:', e);
      container.innerHTML = `
        <div style="padding:2rem;color:var(--c-text-muted);text-align:center">
          <p>⚠️ Could not load: <code>${filePath}</code></p>
          <p style="font-size:0.85rem;margin-top:0.5rem">Check the file exists in your repository.</p>
        </div>`;
    }
  },

  lipiFilePath(originalPath, lipi) {
    if (lipi === 'te') return originalPath; // source files are in Telugu
    // For generated files: insert _iast or _sa before .txt
    return originalPath.replace(/\.txt$/, `_${lipi}.txt`);
  },

  renderBlocks(blocks, slug) {
    return blocks.map((block, idx) => {
      if (block.type === 'heading') {
        return `<div class="section-head">${this.escapeHtml(block.text)}</div>`;
      }
      if (block.type === 'shloka') {
        const bmKey = `${slug}:${block.index}`;
        const isBookmarked = window.StotramBookmarks?.has(bmKey);
        return `
          <div class="shloka-block" id="shloka-${block.index}"
               data-index="${block.index}"
               data-audio-start="${block.audioStart ?? ''}"
               data-audio-end="${block.audioEnd ?? ''}">
            <div class="shloka-num">
              <span>${window.i18n?.t('shloka_label') || 'శ్లోకం'} ${block.index}</span>
              <button class="shloka-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}"
                      data-bm-key="${bmKey}"
                      title="${isBookmarked ? 'Remove bookmark' : 'Bookmark'}"
                      aria-label="Bookmark shloka ${block.index}">
                ${isBookmarked ? '🔖' : '🏷️'}
              </button>
            </div>
            <div class="shloka-text">${this.escapeHtml(block.text)}</div>
          </div>`;
      }
      return '';
    }).join('');
  },

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // ── Error display ────────────────────────────────────────

  showError(msg) {
    const container = document.getElementById('shlokasContainer');
    if (container) {
      container.innerHTML = `<div style="padding:2rem;color:var(--c-text-muted)">${msg}</div>`;
    }
    console.error(msg);
  },

  // ── PWA Install ──────────────────────────────────────────

  setupInstallPrompt() {
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      document.getElementById('installPrompt')?.classList.remove('hidden');
      document.getElementById('footerInstall')?.classList.remove('hidden');
    });

    document.getElementById('installBtn')?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA install outcome:', outcome);
      deferredPrompt = null;
    });
  }
};

// ── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.StotramApp.init();
});
