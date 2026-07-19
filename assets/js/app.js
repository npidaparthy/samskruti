// (constants live in assets/js/constants.js)

// ─────────────────────────────────────────────────────────────────────────────

// ── Beta access helpers ───────────────────────────────────────────────────────
function _checkBetaParam() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('beta');
  if (token === SUBHASHITAM_BETA_TOKEN) {
    localStorage.setItem('beta_subhashitam', SUBHASHITAM_BETA_TOKEN);
    // Strip the ?beta= from the URL cleanly
    const clean = window.location.pathname + window.location.hash;
    history.replaceState(null, '', clean);
    // Show toast after DOM is ready
    document.addEventListener('DOMContentLoaded', () => _showBetaToast('Beta access enabled — Subhāṣitam unlocked'), { once: true });
    return true;
  }
  return false;
}

function _showBetaToast(msg) {
  const toast = document.getElementById('betaToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

function _hasBetaAccess() {
  return ENABLE_SUBHASHITAM ||
    localStorage.getItem('beta_subhashitam') === SUBHASHITAM_BETA_TOKEN;
}
// ─────────────────────────────────────────────────────────────────────────────

window.StotramApp = {
  currentSlug: null,
  currentMeta: null,
  currentSection: null,
  stotramsIndex: [],

  async init() {
    _checkBetaParam(); // must run before nav render — sets localStorage if ?beta= present
    window.StotramSettings?.init();
    window.i18n?.init();
    await this.loadIndex();
    this._applyFeatureFlags();
    this.bindNav();
    await window.StotramSearch?.init(this.stotramsIndex);
    window.Contact?.init({ scriptUrl: 'https://script.google.com/macros/s/AKfycbxa0hLe7kRV3jhmTdvHNf9P8rVntm8wEAa7Xrz0f51mT8LJwrxRtD2Q0yU-m-UsTUrY3A/exec', siteName: 'samskruti.info' });
    this._initParayanamMode();
    this._loadVersion();

    this.setupInstallPrompt();

    /* URL hash routing — supports sharing links */
    this.handleHash();
    window.addEventListener('hashchange', () => this.handleHash());

    /* Re-render dynamic content when UI language toggles.
       Static data-i18n-bilingual elements are handled by i18n.apply().
       Dynamic JS-built content (cards, section tabs, reader labels) needs
       explicit re-render here. */
    const _subjectLabels = {
      feedback:   { te: 'అభిప్రాయం',    en: 'Feedback' },
      correction: { te: 'దోషం',          en: 'Error Correction' },
      suggestion: { te: 'సూచన',          en: 'Suggestion' },
      other:      { te: 'ఇతర',           en: 'Other' },
    };
    const _updateSubjectOptions = () => {
      const lang = window.i18n?.lang || 'en';
      document.querySelectorAll('#cf-subject option').forEach(opt => {
        opt.textContent = _subjectLabels[opt.value]?.[lang] || opt.value;
      });
    };
    _updateSubjectOptions();
    document.addEventListener('uilangchange', _updateSubjectOptions);

    document.addEventListener('uilangchange', () => {
      const activePage = document.querySelector('.page.active')?.id;
      if (activePage === 'page-home')     this.renderHome();
      if (activePage === 'page-stotrams')    this.renderStotramsList();
      if (activePage === 'page-subhashitam') {
        const detail = document.getElementById('subhashitamDetail');
        if (detail && !detail.classList.contains('hidden') && this._currentSubFile) {
          this.openSubhashitam(this._currentSubId, this._currentSubFile);
        } else {
          this.renderSubhashitamList();
        }
      }
      if (activePage === 'page-reader' && this.currentSlug) {
        this._updateReaderHeader();
        this._updateSectionTabs();
        const lang = window.i18n.lang;
        // Update shloka number labels inline
        document.querySelectorAll('.shloka-num > span:first-child').forEach(el => {
          const idx = el.closest('.shloka-block')?.dataset.index;
          if (idx) el.textContent = `${window.i18n.t('shloka_label')} ${idx}`;
        });
        // Update meaning button labels
        document.querySelectorAll('.meaning-toggle').forEach(btn => {
          const open = btn.getAttribute('aria-expanded') === 'true';
          btn.querySelector('.meaning-toggle-label').textContent =
            lang === 'te'
              ? (open ? 'అర్థం ▴' : 'అర్థం ▾')
              : (open ? 'Meaning ▴' : 'Meaning ▾');
        });
        // Reload meanings in new language; update any currently-open blocks
        this._loadMeanings(this.currentSlug).then(() => {
          document.querySelectorAll('.meaning-block:not(.hidden)').forEach(block => {
            const idx = parseInt(block.id.replace('meaning-', ''));
            const m = this._meanings?.[idx];
            if (m) block.querySelector('.meaning-text').textContent = m;
          });
        });
      }
    });

    /* Re-render reader when lipi changes */
    document.addEventListener('lipichange', () => {
      if (this.currentSlug && this.currentSection !== null) {
        this._updateSectionTabs();           // update tab labels for new script
        this.renderSection(this.currentSlug, this.currentSection);  // reload shloka text
      }
      const activePage = document.querySelector('.page:not(.hidden)')?.id;
      if (activePage === 'page-subhashitam') {
        const detail = document.getElementById('subhashitamDetail');
        if (detail && !detail.classList.contains('hidden') && this._currentSubFile) {
          this.openSubhashitam(this._currentSubId, this._currentSubFile);
        }
      }
    });

    this._initHelpBanner();
    this._initFabTop();

    console.log('Stotram App initialised ✓');
  },

  // ── Floating scroll-to-top FAB ───────────────────────────────────────────
  _initFabTop() {
    const fab = document.getElementById('fabTop');
    if (!fab) return;

    const update = () => {
      const reader = document.getElementById('page-reader');
      const inPM   = document.body.classList.contains('parayanam-mode');
      const scrollY = inPM ? (reader?.scrollTop || 0) : window.scrollY;
      fab.classList.toggle('hidden', scrollY < 300);
    };

    window.addEventListener('scroll', update, { passive: true });
    document.getElementById('page-reader')?.addEventListener('scroll', update, { passive: true });

    fab.addEventListener('click', () => {
      const inPM = document.body.classList.contains('parayanam-mode');
      if (inPM) document.getElementById('page-reader')?.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  },

  // ── First-time help banner ────────────────────────────────────────────────
  _initHelpBanner() {
    const SEEN_KEY = 'samskruti_help_seen';
    const banner   = document.getElementById('helpBanner');
    const closeBtn = document.getElementById('helpBannerClose');
    if (!banner || !closeBtn) return;

    // Show only on first visit — localStorage persists across sessions
    if (!localStorage.getItem(SEEN_KEY)) {
      banner.classList.remove('hidden');
    }

    closeBtn.addEventListener('click', () => {
      banner.classList.add('hidden');
      localStorage.setItem(SEEN_KEY, '1');
    });
  },

  // ── Index ─────────────────────────────────────────────────────────────────

  async loadIndex() {
    try {
      const resp = await fetch(DATA_STOTRAMS_INDEX);
      if (!resp.ok) throw new Error(`${DATA_STOTRAMS_INDEX} → HTTP ${resp.status}`);
      const json = await resp.json();
      const base = json.stotrams || [];

      // Merge each stotram's _meta.json on top of the stotrams.json entry.
      // This means stotrams.json only needs the minimal index fields
      // (slug, title, featured, theme, tags) — the _meta.json is the
      // single source of truth for rich content (descriptions, sections, images).
      // _meta.json fields WIN over stotrams.json fields when both exist.
      this.stotramsIndex = await Promise.all(base.map(async entry => {
        if (entry.type === 'html' || entry.type === 'external') return entry;
        try {
          const mr = await fetch(`data/stotram/${entry.slug}/${entry.slug}_meta.json`);
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
      document.getElementById('stotramsGrid').innerHTML =
        `<p style="color:var(--c-text-muted);grid-column:1/-1;padding:2rem">
          ⚠️ Could not load <code>${DATA_STOTRAMS_INDEX}</code>.<br>
          Check the file exists and GitHub Pages is deployed.
        </p>`;
    }
  },

  // ── Feature flags ─────────────────────────────────────────────────────────

  _applyFeatureFlags() {
    if (_hasBetaAccess()) {
      document.querySelectorAll('.nav-sub').forEach(el => el.classList.remove('hidden'));
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
    if (hash === '#stotrams')     { this._showPage('stotrams'); this.renderStotramsList(); return; }
    if (hash === '#about')        { this._showPage('about');    return; }
    if (hash === '#contact')      { this._showPage('contact');  return; }
    if (hash === '#credits')      { this._showPage('credits');  return; }
    if (hash === '#stats')        { this._showPage('stats'); window.StotramStats?.render(); return; }
    if (hash === '#subhashitam' && _hasBetaAccess()) {
      this._showPage('subhashitam');
      this.renderSubhashitamList();
      return;
    }

    const subMatch = hash.match(/^#subhashitam\/(.+)$/);
    if (subMatch && _hasBetaAccess()) {
      this._showPage('subhashitam');
      this._openSubhashitamBySlug(subMatch[1]);
      return;
    }

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
      const href = e.target.closest('[data-href]');
      if (href) { window.location.href = href.dataset.href; return; }
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
      if (page === 'home')         this.renderHome();
      if (page === 'stotrams')     this.renderStotramsList();
      if (page === 'subhashitam')  this.renderSubhashitamList();
      if (page === 'stats')        window.StotramStats?.render();
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
    const lang = window.i18n?.lang || 'en';
    const isTe = lang === 'te';

    const DEITIES = [
      { tag: 'shiva',   symbol: '🔱', te: 'శివుడు',    en: 'Shiva'    },
      { tag: 'vishnu',  symbol: '🪷', te: 'విష్ణువు',   en: 'Vishnu'   },
      { tag: 'devi',    symbol: '✨', te: 'దేవి',       en: 'Devi'     },
      { tag: 'ganesha', symbol: '🐘', te: 'గణేశుడు',   en: 'Ganesha'  },
      { tag: 'lakshmi', symbol: '🌸', te: 'లక్ష్మి',    en: 'Lakshmi'  },
      { tag: 'rama',    symbol: '🏹', te: 'రాముడు',    en: 'Rama'     },
      { tag: 'hanuman', symbol: '🌟', te: 'హనుమంతుడు', en: 'Hanuman'  },
      { tag: 'surya',   symbol: '☀️', te: 'సూర్యుడు',   en: 'Surya'    },
    ];

    const deityRow = document.getElementById('deityRow');
    if (deityRow) {
      deityRow.innerHTML = DEITIES.map(d => `
        <button class="deity-tile" data-tag="${d.tag}" data-nav="stotrams">
          <span class="deity-symbol">${d.symbol}</span>
          <span class="deity-name">${isTe ? d.te : d.en}</span>
        </button>`).join('');
      deityRow.querySelectorAll('.deity-tile').forEach(btn => {
        btn.addEventListener('click', () => {
          const tagChips = document.getElementById('tagChips');
          if (tagChips) tagChips.dataset.activeTag = btn.dataset.tag;
          document.querySelector('[data-nav="stotrams"]')?.click();
          // re-render with that tag active
          setTimeout(() => this._filterStotrams(btn.dataset.tag), 50);
        });
      });
    }

    const subCount = window._subhashitamIndex?.length || 0;
    const stotramsCount = this.stotramsIndex?.length || 0;
    const statsEl = document.getElementById('homeStats');
    if (statsEl) {
      const stats = [
        { num: stotramsCount, te: 'స్తోత్రాలు', en: 'Stotrams' },
        { num: subCount || '∞', te: 'సుభాషితాలు', en: 'Subhāṣitam' },
        { num: 3, te: 'లిపులు', en: 'Scripts' },
      ];
      statsEl.innerHTML = stats.map(s => `
        <div class="stat-tile">
          <span class="stat-num">${s.num}</span>
          <span class="stat-label">${isTe ? s.te : s.en}</span>
        </div>`).join('');
    }

    const exploreEl = document.getElementById('exploreCards');
    if (exploreEl) {
      const cards = [
        {
          nav: 'subhashitam',
          icon: '📜',
          te: 'సుభాషితాలు',   en: 'Subhāṣitam',
          descTe: 'జ్ఞానంతో నిండిన సంస్కృత సూక్తులు',
          descEn: 'Timeless Sanskrit wisdom verses',
        },
        {
          nav: 'stotrams', tag: 'shankaracharya',
          icon: '🕉️',
          te: 'శంకరాచార్య',  en: 'Shankaracharya',
          descTe: '15 అద్వైత స్తోత్రాలు',
          descEn: '15 Advaita stotrams',
        },
      ];
      exploreEl.innerHTML = cards.map(c => `
        <button class="explore-card" data-nav="${c.nav}"${c.tag ? ` data-tag="${c.tag}"` : ''}>
          <span class="explore-icon">${c.icon}</span>
          <div class="explore-text">
            <strong>${isTe ? c.te : c.en}</strong>
            <span>${isTe ? c.descTe : c.descEn}</span>
          </div>
          <span class="explore-arrow">→</span>
        </button>`).join('');
      exploreEl.querySelectorAll('.explore-card').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.tag) {
            const tagChips = document.getElementById('tagChips');
            if (tagChips) tagChips.dataset.activeTag = btn.dataset.tag;
          }
          document.querySelector(`[data-nav="${btn.dataset.nav}"]`)?.click();
          if (btn.dataset.tag) setTimeout(() => this._filterStotrams(btn.dataset.tag), 50);
        });
      });
    }
  },

  // ── Stotrams list ─────────────────────────────────────────────────────────

  renderStotramsList() {
    const allTags = new Set();
    this.stotramsIndex.forEach(s => (s.tags || []).forEach(t => allTags.add(t)));
    const tagList = [...allTags].sort();

    const chips = document.getElementById('tagChips');
    if (chips) {
      const activeTag = chips.dataset.activeTag || 'all';
      const tagLabel = activeTag === 'all' || activeTag === '__featured__'
        ? (window.i18n?.lang === 'te' ? 'ట్యాగ్ ▾' : 'Tags ▾')
        : `${activeTag} ▴`;

      chips.innerHTML = `
        <button class="tag-chip${activeTag === 'all' ? ' active' : ''}" data-tag="all">
          ${window.i18n?.t('tag_all') || 'All'}
        </button>
        <button class="tag-chip tag-chip-featured${activeTag === '__featured__' ? ' active' : ''}" data-tag="__featured__">
          ★ ${window.i18n?.lang === 'te' ? 'ముఖ్యమైనవి' : 'Featured'}
        </button>
        <div class="tag-dropdown-wrap">
          <button class="tag-chip tag-dropdown-btn${activeTag !== 'all' && activeTag !== '__featured__' ? ' active' : ''}" id="tagDropdownBtn">${this._esc(tagLabel)}</button>
          <div class="tag-dropdown-panel hidden" id="tagDropdownPanel">
            <input class="tag-search-input" id="tagSearchInput" type="search" placeholder="${window.i18n?.lang === 'te' ? 'ట్యాగ్ వెతకండి…' : 'Search tags…'}" autocomplete="off">
            <div class="tag-dropdown-chips" id="tagDropdownChips">
              ${tagList.map(tag =>
                `<button class="tag-chip tag-chip-sm${tag === activeTag ? ' active' : ''}" data-tag="${this._esc(tag)}">${this._esc(tag)}</button>`
              ).join('')}
            </div>
          </div>
        </div>`;

      // All / Featured chips
      chips.querySelector('[data-tag="all"]').addEventListener('click', () => {
        chips.dataset.activeTag = 'all';
        this.renderStotramsList();
      });
      chips.querySelector('[data-tag="__featured__"]').addEventListener('click', () => {
        chips.dataset.activeTag = '__featured__';
        this.renderStotramsList();
      });

      // Dropdown toggle
      const dropBtn = chips.querySelector('#tagDropdownBtn');
      const panel = chips.querySelector('#tagDropdownPanel');
      dropBtn.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) chips.querySelector('#tagSearchInput')?.focus();
      });
      document.addEventListener('click', e => {
        if (!chips.contains(e.target)) panel.classList.add('hidden');
      });

      // Tag selection inside dropdown
      chips.querySelector('#tagDropdownChips').addEventListener('click', e => {
        const chip = e.target.closest('[data-tag]');
        if (!chip) return;
        chips.dataset.activeTag = chip.dataset.tag;
        panel.classList.add('hidden');
        this.renderStotramsList();
      });

      // Search within dropdown
      chips.querySelector('#tagSearchInput').addEventListener('input', e => {
        const q = e.target.value.trim().toLowerCase();
        chips.querySelectorAll('#tagDropdownChips .tag-chip').forEach(c => {
          c.style.display = (!q || c.dataset.tag.toLowerCase().includes(q)) ? '' : 'none';
        });
      });
    }

    this._filterStotrams(chips?.dataset.activeTag || 'all');
  },

  _filterStotrams(tag) {
    const grid = document.getElementById('stotramsGrid');
    if (!grid) return;
    const list = tag === 'all'
      ? this.stotramsIndex
      : tag === '__featured__'
        ? this.stotramsIndex.filter(s => s.featured)
        : this.stotramsIndex.filter(s => (s.tags || []).includes(tag));
    grid.innerHTML = list.map(s => this.buildCard(s)).join('');
  },

  buildCard(s) {
    const title = window.i18n?.lang === 'te' ? (s.title_te || s.title_en) : s.title_en;
    const desc  = window.i18n?.lang === 'te' ? (s.description_te || s.description_en) : s.description_en;

    // Image lookup priority:
    //   1. s.image (single string in _meta.json)
    //   2. s.images[0] (array in _meta.json)
    //   3. convention: assets/images/<slug>-01.svg
    // onerror hides the <img> and shows the ॐ fallback.
    const imgSrc = s.image || (Array.isArray(s.images) && s.images[0]) || `assets/images/${s.slug}-01.svg`;

    const isHtml = s.type === 'html';
    const navAttr = isHtml
      ? `data-href="${s.href}"`
      : `data-nav="reader" data-slug="${s.slug}"`;

    return `
      <div class="stotram-card" ${navAttr}
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

    /* Section tabs — pills if ≤ SECTION_TAB_THRESHOLD, dropdown if more */
    const sections = meta.sections || meta.chapters || [];
    const tabsEl   = document.getElementById('sectionTabs');
    if (tabsEl && sections.length > 1) {
      this._renderSectionNav(tabsEl, slug, sections, 0);
    } else if (tabsEl) {
      tabsEl.innerHTML = '';
    }

    /* Bottom nav — delegate clicks on dynamically rendered buttons */
    const container = document.getElementById('shlokasContainer');
    if (container && !container._navBound) {
      container._navBound = true;
      container.addEventListener('click', e => {
        const prev = e.target.closest('.bottom-nav-prev');
        const next = e.target.closest('.bottom-nav-next');
        const back = e.target.closest('.bottom-nav-back');
        const top  = e.target.closest('.bottom-nav-top');
        if (prev || next) {
          const si = parseInt((prev || next).dataset.si);
          this._setSectionActive(si);
          this.renderSection(this.currentSlug, si);
          document.getElementById('page-reader')?.scrollTo({ top: 0, behavior: 'smooth' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (back) this.navigate('stotrams');
        if (top)  window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const basePath = `data/stotram/${slug}/`;
    const srcFile  = basePath + section.file;
    let lipiFile   = srcFile;

    try {
      const lipi = window.StotramSettings?.get('lipi') || 'te';
      lipiFile   = lipi !== 'te' ? srcFile.replace(/\.txt$/, `_${lipi}.txt`) : srcFile;

      // Pre-generated files used for all lipis — no client-side transliteration.
      // _sa.txt / _iast.txt are produced by scripts/transliterate.js (run locally
      // and on every CI deploy). Telugu (.txt) is the source file itself.
      const [parsed] = await Promise.all([
        window.StotramParser.fetchAndParse(lipiFile),
        this._loadMeanings(slug),
      ]);

      container.innerHTML = this.renderBlocks(parsed.blocks, slug)
                          + this._renderBottomNav(slug, idx, sections);

      this._initMeaningToggle(container);

      /* Feed shlokas into search index */
      window.StotramSearch?.addShlokas?.(slug, section.title_te || section.title_en, parsed.blocks);

      /* Feed shlokas into audio */
      window.StotramAudio?.setShlokas(parsed.blocks.filter(b => b.type === 'shloka'));

    } catch (e) {
      console.error('renderSection error:', e);
      container.innerHTML = `
        <div style="padding:2rem;color:var(--c-text-muted);text-align:center;word-break:break-word">
          <p>⚠️ ${window.i18n?.t('err_file_load')} <code style="word-break:break-all">${lipiFile}</code></p>
          <p style="font-size:.85rem;margin-top:.5rem">
            ${window.i18n?.t('err_file_missing')}
          </p>
        </div>`;
    }
  },

  renderBlocks(blocks, slug) {
    const meanings = ENABLE_STOTRAM_MEANING ? (this._meanings || {}) : {};
    return blocks.map(b => {
      if (b.type === 'heading') {
        return `<div class="section-head">${this._esc(b.text)}</div>`;
      }
      if (b.type === 'shloka') {
        const m = meanings[b.index];
        const meaningBtn = m
          ? `<button class="meaning-toggle" data-idx="${b.index}" aria-expanded="false" aria-label="Show meaning">
               <span class="meaning-toggle-label">${window.i18n?.lang === 'te' ? 'అర్థం' : 'Meaning'} ▾</span>
             </button>`
          : '';
        const meaningBlock = m
          ? `<div class="meaning-block hidden" id="meaning-${b.index}">
               <div class="meaning-text">${this._esc(m)}</div>
             </div>`
          : '';
        return `
          <div class="shloka-block" id="shloka-${b.index}"
               data-index="${b.index}"
               data-audio-start="${b.audioStart ?? ''}"
               data-audio-end="${b.audioEnd ?? ''}">
            <div class="shloka-num">
              <span>${window.i18n?.t('shloka_label') || 'శ్లోకం'} ${b.index}</span>
              ${meaningBtn}
            </div>
            <div class="shloka-text">${this._esc(b.text)}</div>
            ${meaningBlock}
          </div>`;
      }
      return '';
    }).join('');
  },

  // ── Stotram meaning loader ────────────────────────────────────────────────

  async _loadMeanings(slug) {
    this._meanings = {};
    if (!ENABLE_STOTRAM_MEANING) return;
    const lang = window.i18n?.lang || 'en';
    const url  = `data/stotram/${slug}/${slug}_meaning_${lang}.txt`;
    try {
      const res  = await fetch(url);
      if (!res.ok) return; // no meaning file — silently skip
      const text = await res.text();
      // Parse [N] blocks: each block starts with [N] on its own line (or [N] followed by text)
      const map = {};
      let current = null;
      let lines   = [];
      for (const raw of text.split('\n')) {
        const line  = raw.trim();
        const match = line.match(/^\[(\d+)\]\s*(.*)/);
        if (match) {
          if (current !== null) map[current] = lines.join('\n').trim();
          current = parseInt(match[1]);
          lines   = match[2] ? [match[2]] : [];
        } else if (current !== null) {
          lines.push(line);
        }
      }
      if (current !== null) map[current] = lines.join('\n').trim();
      this._meanings = map;
    } catch (_) { /* no meaning file available */ }
  },

  // ── Meaning toggle click handler (delegated) ──────────────────────────────

  _initMeaningToggle(container) {
    if (container._meaningToggleBound) return;
    container._meaningToggleBound = true;
    container.addEventListener('click', e => {
      const btn = e.target.closest('.meaning-toggle');
      if (!btn) return;
      e.stopPropagation();
      const idx   = btn.dataset.idx;
      const block = document.getElementById(`meaning-${idx}`);
      if (!block) return;
      const open = !block.classList.contains('hidden');
      block.classList.toggle('hidden', open);
      btn.setAttribute('aria-expanded', String(!open));
      btn.querySelector('.meaning-toggle-label').textContent =
        open
          ? (window.i18n?.lang === 'te' ? 'అర్థం ▾' : 'Meaning ▾')
          : (window.i18n?.lang === 'te' ? 'అర్థం ▴' : 'Meaning ▴');
    });
  },


  // Update reader title/subtitle when language toggles
  // ── Parayanam (focus) mode ───────────────────────────────────────────────

  _initParayanamMode() {
    document.getElementById('pmToggle')?.addEventListener('click', () => this._enterParayanam());
    document.getElementById('pmExit')?.addEventListener('click',   () => this._exitParayanam());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('parayanam-mode')) this._exitParayanam();
    });
  },

  _enterParayanam() {
    const meta  = this.currentMeta;
    const lang  = window.i18n?.lang || 'en';
    const title = lang === 'te' ? (meta?.title_te || meta?.title_sa) : (meta?.title_en || meta?.title_sa);
    const sections = meta?.sections || meta?.chapters || [];
    const sec   = sections[this.currentSection];
    const secLabel = sec ? (lang === 'te' ? (sec.title_te || sec.title_sa) : (sec.title_en || sec.title_sa)) : '';
    const label = secLabel ? `${title} · ${secLabel}` : title;
    document.getElementById('pmStotramLabel').textContent = label || '';
    document.body.classList.add('parayanam-mode');
    document.getElementById('pmExitBar')?.classList.remove('hidden');
    document.getElementById('page-reader')?.scrollTo({ top: 0 });
    document.documentElement.requestFullscreen?.().catch(() => {});
  },

  _exitParayanam() {
    document.body.classList.remove('parayanam-mode');
    document.getElementById('pmExitBar')?.classList.add('hidden');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  },

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

  // Re-render section tabs when UI language or lipi changes.
  // Tab labels follow lipi (same script as shloka text).
  // When lipi=te, UI lang (te/en) decides between title_te and title_en.
  // ── Section navigation helpers ────────────────────────────────────────────
  _sectionLabel(sec) {
    const lipi = window.StotramSettings?.get('lipi') || 'te';
    if (lipi === 'sa')   return sec.title_sa || sec.title_te || sec.title_en;
    if (lipi === 'iast') return sec.title_en || sec.title_te;
    return sec.title_te || sec.title_sa || sec.title_en;
  },

  _renderSectionNav(tabsEl, slug, sections, activeIdx) {
    if (sections.length <= SECTION_TAB_THRESHOLD) {
      // Pill tabs
      tabsEl.innerHTML = sections.map((sec, i) =>
        `<button class="section-tab${i === activeIdx ? ' active' : ''}" data-si="${i}">
          ${this._esc(this._sectionLabel(sec))}
        </button>`).join('');
      tabsEl.addEventListener('click', e => {
        const btn = e.target.closest('.section-tab');
        if (!btn) return;
        const si = parseInt(btn.dataset.si);
        this._setSectionActive(si);
        this.renderSection(slug, si);
      });
    } else {
      // Dropdown for large section counts
      const lang = window.i18n?.lang || 'en';
      const ofLabel = lang === 'te' ? 'లో' : 'of';
      tabsEl.innerHTML =
        `<div class="section-dropdown-wrap">
          <select class="section-dropdown" aria-label="Select section">
            ${sections.map((sec, i) =>
              `<option value="${i}"${i === activeIdx ? ' selected' : ''}>
                ${this._esc(this._sectionLabel(sec))}
              </option>`).join('')}
          </select>
          <span class="section-dropdown-count">${activeIdx + 1} ${ofLabel} ${sections.length}</span>
        </div>`;
      tabsEl.querySelector('.section-dropdown')?.addEventListener('change', e => {
        const si = parseInt(e.target.value);
        this._setSectionActive(si);
        this.renderSection(slug, si);
      });
    }
  },

  _setSectionActive(si) {
    // Pills
    document.querySelectorAll('#sectionTabs .section-tab').forEach(b =>
      b.classList.toggle('active', parseInt(b.dataset.si) === si));
    // Dropdown
    const sel = document.querySelector('#sectionTabs .section-dropdown');
    if (sel) {
      sel.value = si;
      const lang = window.i18n?.lang || 'en';
      const ofLabel = lang === 'te' ? 'లో' : 'of';
      const count = document.querySelector('.section-dropdown-count');
      if (count) count.textContent = `${si + 1} ${ofLabel} ${sel.options.length}`;
    }
  },

  _updateSectionTabs() {
    const meta = this.currentMeta;
    if (!meta) return;
    const sections = meta.sections || meta.chapters || [];
    if (sections.length <= SECTION_TAB_THRESHOLD) {
      // Update pill labels for lipi change
      document.querySelectorAll('#sectionTabs .section-tab').forEach((btn, i) => {
        const sec = sections[i];
        if (sec) btn.textContent = this._sectionLabel(sec);
      });
    } else {
      // Update dropdown option labels for lipi change
      document.querySelectorAll('#sectionTabs .section-dropdown option').forEach((opt, i) => {
        const sec = sections[i];
        if (sec) opt.textContent = this._sectionLabel(sec);
      });
    }
  },

  // ── Bottom navigation (end of section) ───────────────────────────────────
  _renderBottomNav(slug, idx, sections) {
    const prev = sections[idx - 1];
    const next = sections[idx + 1];
    const lang = window.i18n?.lang || 'en';

    // Section names in nav buttons are UI chrome → follow lang only, not lipi
    const secLabel = sec => lang === 'te'
      ? (sec.title_te || sec.title_en)
      : (sec.title_en || sec.title_te);

    const backLabel   = lang === 'te' ? 'స్తోత్రాలు' : 'Stotrams';
    const topLabel    = lang === 'te' ? '↑ పైకి' : '↑ Top';

    const prevBtn = prev
      ? `<button class="bottom-nav-btn bottom-nav-prev" data-si="${idx - 1}">← ${this._esc(secLabel(prev))}</button>`
      : `<button class="bottom-nav-btn bottom-nav-back" id="bottomNavBack">← ${backLabel}</button>`;

    const nextBtn = next
      ? `<button class="bottom-nav-btn bottom-nav-next" data-si="${idx + 1}">${this._esc(secLabel(next))} →</button>`
      : `<button class="bottom-nav-btn bottom-nav-top" id="bottomNavTop">${topLabel}</button>`;

    return `
      <div class="bottom-nav">
        ${prevBtn}
        ${nextBtn}
      </div>`;
  },

  _esc(t) {
    return String(t)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  // ── Subhashitam browse ────────────────────────────────────────────────────

  async renderSubhashitamList() {
    const container = document.getElementById('subhashitamList');
    if (!container) return;
    const lang = window.i18n?.lang || 'en';
    container.innerHTML = '<div class="skeleton-card" style="height:120px;margin:1rem 0"></div>';
    try {
      const res  = await fetch(DATA_SUBHASHITAM_INDEX);
      if (!res.ok) throw new Error(`${DATA_SUBHASHITAM_INDEX} → HTTP ${res.status}`);
      const list = await res.json();
      this._subIndex = list;  // cache for slug lookup

      // Feed into search index once (guard: only if not already added)
      if (!this._subIndexed) {
        window.StotramSearch?.addSubhashitam?.(list);
        this._subIndexed = true;
      }

      const activeTag = container.dataset.activeTag || 'all';

      // Category tags = first tag of each entry
      const catTags = ['all', ...new Set(list.map(e => (e.tags || [])[0]).filter(Boolean))].sort((a,b) => a === 'all' ? -1 : a.localeCompare(b));
      // Topic tags = all other tags not already a category
      const catSet = new Set(catTags);
      const topicTags = [...new Set(list.flatMap(e => (e.tags || []).slice(1)))].filter(t => !catSet.has(t)).sort();

      const filtered = (activeTag === 'all' ? list : list.filter(e => (e.tags||[]).includes(activeTag)))
        .slice().sort(() => Math.random() - 0.5);

      const catChips = catTags.map(tag =>
        `<button class="sub-tag-chip${tag === activeTag ? ' active' : ''}" data-tag="${this._esc(tag)}">${this._esc(tag)}</button>`
      ).join('');

      const topicChips = topicTags.map(tag =>
        `<button class="sub-tag-chip sub-topic-chip${tag === activeTag ? ' active' : ''}" data-tag="${this._esc(tag)}">${this._esc(tag)}</button>`
      ).join('');

      const topicBtnLabel = topicTags.includes(activeTag) ? `${activeTag} ▴` : `Topics ▾`;

      const cards = filtered.map(e => {
        const firstLine = lang === 'te' ? (e.firstline_te || e.firstline_sa || '') : (e.firstline_sa || e.firstline_te || '');
        const tags = (e.tags || []).map(t => `<span class="sub-tag">${this._esc(t)}</span>`).join('');
        return `<div class="sub-card" data-sub-id="${this._esc(e.id)}" data-file="${this._esc(e.file)}" role="button" tabindex="0">
          <div class="sub-card-verse">${this._esc(firstLine)}</div>
          <div class="sub-card-source">${this._esc(e.source_en || '')}</div>
          <div class="sub-card-tags">${tags}</div>
        </div>`;
      }).join('');

      const countLabel = lang === 'te' ? `${filtered.length} సుభాషితాలు` : `${filtered.length} verses`;

      container.innerHTML = `
        <div class="sub-filter-bar">
          <div class="sub-tag-chips">
            ${catChips}
            <div class="sub-topics-wrap">
              <button class="sub-topics-btn${topicTags.includes(activeTag) ? ' active' : ''}" id="subTopicsBtn">${topicBtnLabel}</button>
              <div class="sub-topics-dropdown hidden" id="subTopicsDropdown">${topicChips}</div>
            </div>
          </div>
          <span class="sub-count">${this._esc(countLabel)}</span>
        </div>
        <div class="sub-grid">${cards || '<p style="padding:2rem;color:var(--c-text-muted)">No verses found.</p>'}</div>`;

      // Topics dropdown toggle
      container.querySelector('#subTopicsBtn')?.addEventListener('click', e => {
        e.stopPropagation();
        container.querySelector('#subTopicsDropdown')?.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        container.querySelector('#subTopicsDropdown')?.classList.add('hidden');
      }, { once: true });

      // Tag filter clicks
      container.querySelectorAll('.sub-tag-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          container.dataset.activeTag = btn.dataset.tag;
          this.renderSubhashitamList();
        });
      });
      // Card clicks → open reader
      container.querySelectorAll('.sub-card').forEach(card => {
        const open = () => this.openSubhashitam(card.dataset.subId, card.dataset.file);
        card.addEventListener('click', open);
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
      });
    } catch (e) {
      container.innerHTML = `<p style="padding:2rem;color:var(--c-text-muted)">⚠️ Could not load subhashitam index.</p>`;
    }
  },

  async _openSubhashitamBySlug(slug) {
    // If index not yet loaded, fetch it first
    if (!this._subIndex) {
      const res = await fetch(DATA_SUBHASHITAM_INDEX);
      if (!res.ok) throw new Error(`${DATA_SUBHASHITAM_INDEX} → HTTP ${res.status}`);
      this._subIndex = await res.json();
    }
    const entry = this._subIndex.find(e => e.slug === slug);
    if (!entry) return;
    await this.renderSubhashitamList();
    this.openSubhashitam(entry.id, entry.file);
  },

  async openSubhashitam(id, file) {
    const detail = document.getElementById('subhashitamDetail');
    const list   = document.getElementById('subhashitamList');
    if (!detail || !list) return;
    const lang = window.i18n?.lang || 'en';

    this._currentSubId   = id;
    this._currentSubFile = file;

    // Update URL to the slug-based deep link
    const entry = this._subIndex?.find(e => e.id === id);
    if (entry?.slug) {
      history.replaceState(null, '', `#subhashitam/${entry.slug}`);
    }

    list.classList.add('hidden');
    detail.classList.remove('hidden');
    detail.innerHTML = '<div class="skeleton-card" style="height:300px;margin:1rem 0"></div>';

    try {
      const res  = await fetch(`${DATA_SUBHASHITAM_BASE}${file}`);
      if (!res.ok) throw new Error(`${DATA_SUBHASHITAM_BASE}${file} → HTTP ${res.status}`);
      const sub  = await res.json();

      const script  = window.StotramSettings?.get('lipi') || 'te';
      const verse   = script === 'sa' ? sub.shlokam.sa : script === 'iast' ? sub.shlokam.iast : sub.shlokam.te;
      const tags    = (sub.tags || []).map(t => `<span class="sub-tag">${this._esc(t)}</span>`).join('');
      const source  = lang === 'te' ? (sub.granthaH?.name_te || sub.granthaH?.name_en || '') : (sub.granthaH?.name_en || '');
      const chapter = sub.granthaH?.chapter ? ` — ${sub.granthaH.chapter}` : '';

      const section = (label, te, en) => {
        const body = lang === 'te' ? te : en;
        if (!body) return '';
        return `<details class="sub-detail-section">
          <summary class="sub-detail-head">${this._esc(label)}</summary>
          <div class="sub-detail-body">${this._esc(body)}</div>
        </details>`;
      };

      detail.innerHTML = `
        <div class="sub-detail-header">
          <button class="sub-back-btn" id="subBack">← ${window.i18n.t('back')}</button>
          <button class="sub-share-btn" id="subShare" title="${window.i18n.t('share')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            ${window.i18n.t('share')}
          </button>
        </div>
        <div class="sub-reader-card">
          <div class="sub-reader-tags">${tags}</div>
          <div class="sub-reader-verse">${this._esc(verse)}</div>
          <div class="sub-reader-meta">${this._esc(source + chapter)}${sub.chandaH ? ' · ' + this._esc(sub.chandaH) : ''}</div>
          ${section(lang === 'te' ? 'అర్థం' : 'Meaning',     sub.meaning?.te,      sub.meaning?.en)}
          ${section(lang === 'te' ? 'అన్వయం' : 'Anvayam',    sub.anvayam?.te,      sub.anvayam?.en)}
          ${section(lang === 'te' ? 'పదవిభాగం' : 'Padavibhāgam', sub.padavibhagam?.te, sub.padavibhagam?.en)}
          ${section(lang === 'te' ? 'తాత్పర్యం' : 'Tātparyam',   sub.tatparyam?.te,    sub.tatparyam?.en)}
        </div>`;

      document.getElementById('subBack')?.addEventListener('click', () => {
        detail.classList.add('hidden');
        list.classList.remove('hidden');
      });

      document.getElementById('subShare')?.addEventListener('click', () => {
        const script = window.StotramSettings?.get('lipi') || 'te';
        window.ShareCard?.share({
          slug:      entry?.slug || id,
          script,
          syllables: sub.syllablesPerQuarter || 8,
          source:    (source + chapter + (sub.chandaH ? ' · ' + sub.chandaH : '')),
          verse:     script === 'sa' ? sub.shlokam.sa : script === 'iast' ? sub.shlokam.iast : sub.shlokam.te,
          meaning:   lang === 'te' ? (sub.meaning?.te || sub.meaning?.en || '') : (sub.meaning?.en || ''),
          tatparyam: lang === 'te' ? (sub.tatparyam?.te || sub.tatparyam?.en || '') : (sub.tatparyam?.en || ''),
        });
      });
    } catch (e) {
      detail.innerHTML = `<p style="padding:2rem;color:var(--c-text-muted)">⚠️ Could not load verse.</p>`;
    }
  },

  // ── Site version pill ─────────────────────────────────────────────────────

  async _loadVersion() {
    const pill = document.getElementById('siteVersionPill');
    if (!pill) return;
    try {
      const res = await fetch('version.json', { cache: 'no-store' });
      if (!res.ok) return;
      const { hash, ts } = await res.json();
      pill.textContent = ts === 'local' ? `${hash}` : `${hash}.${ts}`;
    } catch { /* silently ignore */ }
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
