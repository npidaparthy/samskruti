/**
 * settings.js — User preferences (theme, font size, text colour, lipi, uilang)
 * All state in localStorage['stotram_settings'].
 * Plug-and-play: remove this file and nothing else breaks (defaults apply).
 */

window.StotramSettings = {
  STORAGE_KEY: 'stotram_settings',
  _data: {},

  defaults: {
    uilang: 'en',
    lipi: 'te',
    fontSize: 100,           // percent
    textColor: null,         // null = use CSS var
    themeGlobal: null,       // null = per-stotram
    themeOverrides: {},      // { 'vishnu-sahasranamam': 'theme-night' }
  },

  init() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this._data = raw ? JSON.parse(raw) : {};
    } catch (e) {
      this._data = {};
    }
    this._applyFontSize();
    this._applyTextColor();
    this._bindControls();
  },

  get(key) {
    return this._data[key] ?? this.defaults[key];
  },

  set(key, value) {
    this._data[key] = value;
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._data)); } catch (e) {}
  },

  // ── Theme ──────────────────────────────────────────────

  applyTheme(stotramSlug, metaTheme) {
    const globalOverride = this.get('themeGlobal');
    const overrides = this.get('themeOverrides') || {};
    const perStotram = overrides[stotramSlug];
    const theme = globalOverride || perStotram || metaTheme || 'theme-vishnu';
    document.documentElement.setAttribute('data-theme', theme);
    this._markActiveSwatch(theme);
  },

  _markActiveSwatch(theme) {
    document.querySelectorAll('.theme-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  },

  // ── Font Size ──────────────────────────────────────────

  _applyFontSize() {
    const pct = this.get('fontSize');
    const base = 18;
    document.documentElement.style.setProperty('--font-size-base', `${base * pct / 100}px`);
    const display = document.getElementById('fontSizeDisplay');
    if (display) display.textContent = pct + '%';
  },

  changeFontSize(delta) {
    const cur = this.get('fontSize');
    const next = Math.min(150, Math.max(70, cur + delta));
    this.set('fontSize', next);
    this._applyFontSize();
  },

  // ── Text Colour ────────────────────────────────────────

  _applyTextColor() {
    const col = this.get('textColor');
    if (col) {
      document.documentElement.style.setProperty('--c-text', col);
    } else {
      document.documentElement.style.removeProperty('--c-text');
    }
  },

  setTextColor(col) {
    this.set('textColor', col);
    this._applyTextColor();
  },

  resetTextColor() {
    this.set('textColor', null);
    this._applyTextColor();
    const picker = document.getElementById('textColorPicker');
    if (picker) picker.value = '#1a1a2e';
  },

  // ── Lipi ──────────────────────────────────────────────

  applyLipi(lipi) {
    this.set('lipi', lipi);
    document.documentElement.setAttribute('data-lipi', lipi);
    document.querySelectorAll('.lipi-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lipi === lipi);
    });
    // Signal to app to re-render shlokas in new lipi
    document.dispatchEvent(new CustomEvent('lipichange', { detail: { lipi } }));
  },

  // ── Control Bindings ───────────────────────────────────

  _bindControls() {
    // Settings open/close
    document.getElementById('settingsBtn')?.addEventListener('click', () => this.openPanel());
    document.getElementById('settingsClose')?.addEventListener('click', () => this.closePanel());
    document.getElementById('settingsOverlay')?.addEventListener('click', () => this.closePanel());

    // Font
    document.getElementById('fontIncrease')?.addEventListener('click', () => this.changeFontSize(10));
    document.getElementById('fontDecrease')?.addEventListener('click', () => this.changeFontSize(-10));

    // Text colour
    const picker = document.getElementById('textColorPicker');
    if (picker) {
      picker.value = this.get('textColor') || '#1a1a2e';
      picker.addEventListener('input', e => this.setTextColor(e.target.value));
    }
    document.getElementById('textColorReset')?.addEventListener('click', () => this.resetTextColor());

    // Theme swatches
    document.querySelectorAll('.theme-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        const isGlobal = document.getElementById('themeGlobal')?.checked;
        if (isGlobal) {
          this.set('themeGlobal', theme);
        } else {
          const overrides = this.get('themeOverrides') || {};
          const slug = window.StotramApp?.currentSlug;
          if (slug) overrides[slug] = theme;
          this.set('themeOverrides', overrides);
        }
        document.documentElement.setAttribute('data-theme', theme);
        this._markActiveSwatch(theme);
      });
    });

    // Theme reset
    document.getElementById('themeReset')?.addEventListener('click', () => {
      this.set('themeGlobal', null);
      const overrides = this.get('themeOverrides') || {};
      const slug = window.StotramApp?.currentSlug;
      if (slug) delete overrides[slug];
      this.set('themeOverrides', overrides);
      const meta = window.StotramApp?.currentMeta;
      if (meta?.theme) {
        document.documentElement.setAttribute('data-theme', meta.theme);
        this._markActiveSwatch(meta.theme);
      }
    });

    // Lipi buttons
    document.querySelectorAll('.lipi-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applyLipi(btn.dataset.lipi));
    });
    // Restore saved lipi
    this.applyLipi(this.get('lipi') || 'te');

    // UI lang toggle
    document.getElementById('uilangToggle')?.addEventListener('click', () => window.i18n?.toggle());
  },

  openPanel() {
    document.getElementById('settingsPanel')?.classList.remove('hidden');
    document.getElementById('settingsOverlay')?.classList.remove('hidden');
  },

  closePanel() {
    document.getElementById('settingsPanel')?.classList.add('hidden');
    document.getElementById('settingsOverlay')?.classList.add('hidden');
  }
};
