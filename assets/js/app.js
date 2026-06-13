/**
 * app.js — Main application bootstrap, routing, URL hash navigation.
 * FIX: URL now updates on navigation so stotrams are shareable.
 * FIX: Search now indexes loaded shlokas.
 */

window.StotramApp = {
  currentSlug: null,
  currentMeta: null,
  currentSection: null,
  stotramsIndex: [],

  async init() {
    window.StotramSettings?.init();
    window.i18n?.init();
    await this.loadIndex();
    this.bindNav();
    await window.StotramSearch?.init(this.stotramsIndex);
    window.StotramBookmarks?.init();
    this.setupInstallPrompt();

    /* URL hash routing — supports sharing links */
    this.handleHash();
    window.addEventListener('hashchange', () => this.handleHash());

    /* Re-render dynamic content when UI language toggles.
       Static data-i18n-bilingual elements are handled by i18n.apply().
       Dynamic JS-built content (cards, section tabs, reader labels) needs
       explicit re-render here. */
    document.addEventListener('uilangchange', () => {
      const activePage = document.querySelector('.page.active')?.id;
      if (activePage === 'page-home')     this.renderHome();
      if (activePage === 'page-stotrams') this.renderStotramsList();
      if (activePage === 'page-reader' && this.currentSlug) {
        this._updateReaderHeader();
        this._updateSectionTabs();
        // Update shloka number labels inline
        document.querySelectorAll('.shloka-num > span:first-child').forEach(el => {
          const idx = el.closest('.shloka-block')?.dataset.index;
          if (idx) el.textContent = `${window.i18n.t('shloka_label')} ${idx}`;
        });
      }
    });

    /* Re-render reader when lipi changes */
    document.addEventListener('lipichange', () => {
      if (this.currentSlug && this.currentSection !== null) {
        this._updateSectionTabs();           // update tab labels for new script
        this.renderSection(this.currentSlug, this.currentSection);  // reload shloka text
      }
    });

    console.log('Stotram App initialised ✓');
  },

  // ── Index ─────────────────────────────────────────────────────────────────

  async loadIndex() {
    try {
      const resp = await fetch('data/stotrams.json');
      if (!resp.ok) throw new Error(`stotrams.json → HTTP ${resp.status}`);
      const json = await resp.json();
      const base = json.stotrams || [];

      // Merge each stotram's _meta.json on top of the stotrams.json entry.
      // This means stotrams.json only needs the minimal index fields
      // (slug, title, featured, theme, tags) — the _meta.json is the
      // single source of truth for rich content (descriptions, sections, images).
      // _meta.json fields WIN over stotrams.json fields when both exist.
      this.stotramsIndex = await Promise.all(base.map(async entry => {
        try {
          const mr = await fetch(`data/${entry.slug}/${entry.slug}_meta.json`);
          if (mr.ok) {
            const meta = await mr.json();
            // Merge strategy: _meta.json wins for rich content (sections,
            // descriptions, images, theme) but stotrams.json is the
            // canonical source for titles — never let meta override them.
            const { title_te, title_sa, title_en, ...metaRest } = meta;
            return { ...entry, ...metaRest };
          } else {
            console.warn(`[loadIndex] _meta.json not found for "${entry.slug}" (HTTP ${mr.status}) — using stotrams.json entry`);
          }
        } catch (e) {
          console.warn(`[loadIndex] Could not fetch _meta.json for "${entry.slug}":`, e.message);
        }
        return entry;
      }));

    } catch (e) {
      console.error('loadIndex failed:', e);
      this.stotramsIndex = [];
      document.getElementById('featuredGrid').innerHTML =
        `<p style="color:var(--c-text-muted);grid-column:1/-1;padding:2rem">
          ⚠️ Could not load <code>data/stotrams.json</code>.<br>
          Check the file exists and GitHub Pages is deployed.
        </p>`;
    }
  },

  // ── Hash-based routing (shareable URLs) ──────────────────────────────────

  handleHash() {
    const hash = window.location.hash; // e.g. #stotrams, #reader/vishnu-sahasranamam
    if (!hash || hash === '#' || hash === '#home') {
      this._showPage('home');
      this.renderHome();
      return;
    }
    if (hash === '#stotrams') { this._showPage('stotrams'); this.renderStotramsList(); return; }
    if (hash === '#about')    { this._showPage('about');    return; }
    if (hash === '#contact')  { this._showPage('contact');  return; }
    if (hash === '#credits')  { this._showPage('credits');  return; }
    if (hash === '#stats')    { this._showPage('stats'); window.StotramStats?.render(); return; }

    const readerMatch = hash.match(/^#reader\/(.+)$/);
    if (readerMatch) {
      this._showPage('reader');
      this.openStotram(readerMatch[1]);
      return;
    }
    /* Default */
    this._showPage('home');
    this.renderHome();
  },

  setHash(hash) {
    /* Pushes URL without triggering hashchange listener loop */
    if (window.location.hash !== hash) {
      history.pushState(null, '', hash);
    }
  },

  // ── Navigation ────────────────────────────────────────────────────────────

  bindNav() {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-nav]');
      if (!el) return;
      e.preventDefault();
      const page = el.dataset.nav;
      const slug = el.dataset.slug;
      this.navigate(page, slug);
    });

    document.getElementById('readerBack')?.addEventListener('click', () => this.navigate('stotrams'));
  },

  navigate(page, slug) {
    if (page === 'reader' && slug) {
      this.setHash(`#reader/${slug}`);
      this._showPage('reader');
      this.openStotram(slug);
    } else {
      this.setHash(`#${page}`);
      this._showPage(page);
      if (page === 'home')     this.renderHome();
      if (page === 'stotrams') this.renderStotramsList();
      if (page === 'stats')    window.StotramStats?.render();
    }
    document.getElementById('mobileNav')?.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _showPage(page) {
    document.querySelectorAll('.page').forEach(p => {
      p.classList.add('hidden'); p.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.nav === page)
    );
    const el = document.getElementById(`page-${page}`);
    if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
  },

  // ── Home ──────────────────────────────────────────────────────────────────

  renderHome() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;
    const featured = this.stotramsIndex.filter(s => s.featured);
    grid.innerHTML = featured.length
      ? featured.map(s => this.buildCard(s)).join('')
      : `<p style="color:var(--c-text-muted);grid-column:1/-1">${window.i18n?.t('err_no_stotrams')}</p>`;
  },

  // ── Stotrams list ─────────────────────────────────────────────────────────

  renderStotramsList() {
    const allTags = new Set(['all']);
    this.stotramsIndex.forEach(s => (s.tags || []).forEach(t => allTags.add(t)));

    const chips = document.getElementById('tagChips');
    if (chips) {
      chips.innerHTML = [...allTags].map(tag =>
        `<button class="tag-chip${tag === 'all' ? ' active' : ''}" data-tag="${tag}">
          ${tag === 'all' ? (window.i18n?.t('tag_all') || 'All') : tag}
        </button>`
      ).join('');
      chips.addEventListener('click', e => {
        const chip = e.target.closest('.tag-chip');
        if (!chip) return;
        chips.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this._filterStotrams(chip.dataset.tag);
      });
    }
    this._filterStotrams('all');
  },

  _filterStotrams(tag) {
    const grid = document.getElementById('stotramsGrid');
    if (!grid) return;
    const list = tag === 'all'
      ? this.stotramsIndex
      : this.stotramsIndex.filter(s => (s.tags || []).includes(tag));
    grid.innerHTML = list.map(s => this.buildCard(s)).join('');
  },

  buildCard(s) {
    const tags  = (s.tags || []).slice(0, 3).map(t => `<span class="tag-pill">${t}</span>`).join('');
    const title = window.i18n?.lang === 'te' ? (s.title_te || s.title_en) : s.title_en;
    const desc  = window.i18n?.lang === 'te' ? (s.description_te || s.description_en) : s.description_en;

    // Image lookup priority:
    //   1. s.image (single string in _meta.json)
    //   2. s.images[0] (array in _meta.json)
    //   3. convention: assets/images/<slug>-01.svg
    // onerror hides the <img> and shows the ॐ fallback.
    const imgSrc = s.image || (Array.isArray(s.images) && s.images[0]) || `assets/images/${s.slug}-01.svg`;

    return `
      <div class="stotram-card" data-nav="reader" data-slug="${s.slug}"
           tabindex="0" role="button" aria-label="Open ${title}"
           onkeydown="if(event.key==='Enter')this.click()">
        <div class="card-image">
          <img src="${imgSrc}" alt="${title}" loading="lazy"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="card-image-om" style="display:none">ॐ</span>
        </div>
        <div class="card-body">
          <div class="card-title-te">${s.title_te || s.title_sa}</div>
          <div class="card-title-en">${s.title_en}</div>
          <div class="card-desc">${desc || ''}</div>
          <div class="card-tags">${tags}</div>
        </div>
      </div>`;
  },

  // ── Reader ────────────────────────────────────────────────────────────────

  async openStotram(slug) {
    const meta = this.stotramsIndex.find(s => s.slug === slug);
    if (!meta) { console.error('Stotram not found:', slug); return; }

    this.currentSlug   = slug;
    this.currentMeta   = meta;
    this.currentSection = 0;

    window.StotramSettings?.applyTheme(slug, meta.theme);
    window.StotramStats?.recordVisit(slug);

    this._updateReaderHeader();

    /* Section tabs */
    const sections = meta.sections || meta.chapters || [];
    const tabsEl   = document.getElementById('sectionTabs');
    if (tabsEl) {
      // Build tabs using lipi+lang-aware label from the start
      const _lipi = window.StotramSettings?.get('lipi') || 'te';
      const _lang = window.i18n?.lang || 'en';
      const _tabLabel = sec => {
        if (_lipi === 'sa')   return sec.title_sa || sec.title_te || sec.title_en;
        if (_lipi === 'iast') return sec.title_en || sec.title_te;
        return _lang === 'te' ? (sec.title_te || sec.title_en) : (sec.title_en || sec.title_te);
      };
      tabsEl.innerHTML = sections.length > 1
        ? sections.map((sec, i) =>
            `<button class="section-tab${i === 0 ? ' active' : ''}" data-si="${i}">
              ${this._esc(_tabLabel(sec))}
            </button>`).join('')
        : '';
      tabsEl.addEventListener('click', e => {
        const btn = e.target.closest('.section-tab');
        if (!btn) return;
        tabsEl.querySelectorAll('.section-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderSection(slug, parseInt(btn.dataset.si));
      });
    }

    window.StotramAudio?.setup(meta);
    await this.renderSection(slug, 0);
  },

  async renderSection(slug, idx) {
    this.currentSection = idx;
    const meta     = this.currentMeta;
    const sections = meta.sections || meta.chapters || [];
    const section  = sections[idx];
    if (!section) return;

    const container = document.getElementById('shlokasContainer');
    if (!container) return;
    container.innerHTML = '<div class="skeleton-card" style="height:200px;margin:1rem 0"></div>';

    const basePath = `data/${slug}/`;
    const srcFile  = basePath + section.file;

    try {
      const lipi     = window.StotramSettings?.get('lipi') || 'te';
      const lipiFile = lipi !== 'te' ? srcFile.replace(/\.txt$/, `_${lipi}.txt`) : srcFile;

      let parsed;
      try {
        parsed = await window.StotramParser.fetchAndParse(lipiFile);
      } catch {
        parsed = await window.StotramParser.fetchAndParse(srcFile);
        const sample  = parsed.blocks.find(b => b.type === 'shloka')?.text || '';
        const fromSch = window.StotramParser.detectScript(sample);
        const toSch   = window.StotramParser.schemeFor(lipi);
        if (fromSch !== toSch && fromSch !== 'unknown') {
          parsed = window.StotramParser.transliterate(parsed, fromSch, toSch);
        }
      }

      container.innerHTML = this.renderBlocks(parsed.blocks, slug);

      /* Feed shlokas into search index */
      window.StotramSearch?.addShlokas?.(slug, section.title_te || section.title_en, parsed.blocks);

      /* Feed shlokas into audio */
      window.StotramAudio?.setShlokas(parsed.blocks.filter(b => b.type === 'shloka'));

    } catch (e) {
      console.error('renderSection error:', e);
      container.innerHTML = `
        <div style="padding:2rem;color:var(--c-text-muted);text-align:center">
          <p>⚠️ ${window.i18n?.t('err_file_load')} <code>${srcFile}</code></p>
          <p style="font-size:.85rem;margin-top:.5rem">
            ${window.i18n?.t('err_file_missing')}
          </p>
        </div>`;
    }
  },

  renderBlocks(blocks, slug) {
    return blocks.map(b => {
      if (b.type === 'heading') {
        return `<div class="section-head">${this._esc(b.text)}</div>`;
      }
      if (b.type === 'shloka') {
        const key = `${slug}:${b.index}`;
        const bm  = window.StotramBookmarks?.has(key);
        return `
          <div class="shloka-block" id="shloka-${b.index}"
               data-index="${b.index}"
               data-audio-start="${b.audioStart ?? ''}"
               data-audio-end="${b.audioEnd ?? ''}">
            <div class="shloka-num">
              <span>${window.i18n?.t('shloka_label') || 'శ్లోకం'} ${b.index}</span>
              <button class="shloka-bookmark-btn ${bm ? 'bookmarked' : ''}"
                      data-bm-key="${key}" aria-label="Bookmark">
                ${bm ? '🔖' : '🏷️'}
              </button>
            </div>
            <div class="shloka-text">${this._esc(b.text)}</div>
          </div>`;
      }
      return '';
    }).join('');
  },


  // Update reader title/subtitle when language toggles
  _updateReaderHeader() {
    const meta = this.currentMeta;
    if (!meta) return;
    const lang = window.i18n?.lang;
    const title = lang === 'te'
      ? (meta.title_te || meta.title_sa || meta.title_en)
      : (meta.title_en || meta.title_sa);
    const subtitle = lang === 'te'
      ? (meta.title_en || '')
      : (meta.title_te || meta.title_sa || '');
    const titleEl    = document.getElementById('readerTitle');
    const subtitleEl = document.getElementById('readerSubtitle');
    if (titleEl)    titleEl.textContent    = title    || '';
    if (subtitleEl) subtitleEl.textContent = subtitle || '';
  },

  // Re-render section tabs when UI language OR lipi changes.
  // Priority: lipi wins for script choice; UI lang picks te vs en for non-sa lipis.
  //   lipi=sa   → show title_sa (Devanagari label)
  //   lipi=iast → show title_en (closest Latin equivalent)
  //   lipi=te   → show title_te when UI lang=te, else title_en
  _updateSectionTabs() {
    const meta = this.currentMeta;
    if (!meta) return;
    const sections = meta.sections || meta.chapters || [];
    const lipi     = window.StotramSettings?.get('lipi') || 'te';
    const lang     = window.i18n?.lang || 'en';

    document.querySelectorAll('#sectionTabs .section-tab').forEach((btn, i) => {
      const sec = sections[i];
      if (!sec) return;
      let label;
      if (lipi === 'sa')   label = sec.title_sa || sec.title_te || sec.title_en;
      else if (lipi === 'iast') label = sec.title_en || sec.title_te;
      else                 label = lang === 'te'
                                    ? (sec.title_te || sec.title_en)
                                    : (sec.title_en || sec.title_te);
      btn.textContent = label || '';
    });
  },

  _esc(t) {
    return String(t)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  // ── PWA install ───────────────────────────────────────────────────────────

  setupInstallPrompt() {
    let deferred;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); deferred = e;
      document.getElementById('installPrompt')?.classList.remove('hidden');
    });
    document.getElementById('installBtn')?.addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
    });
  }
};

document.addEventListener('DOMContentLoaded', () => window.StotramApp.init());
