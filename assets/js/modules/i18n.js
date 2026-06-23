/**
 * i18n.js — Bilingual UI (Telugu + English)
 *
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────────
 * The language toggle (EN ↔ తె) controls which language is shown in
 * data-i18n-bilingual elements (settings labels, page headings, buttons, etc.)
 *
 * The nav tabs are ALWAYS bilingual (Telugu on top, English smaller below) —
 * they do NOT change with the language toggle. That is by design.
 *
 * HTML attribute conventions:
 *   data-i18n="key"           → replace textContent with t(key) in current lang
 *   data-i18n-bilingual="key" → replace textContent with translation in current lang
 *   data-i18n-placeholder="key" → update placeholder attribute (inputs)
 *   data-i18n-title="key"    → update title attribute (tooltips)
 *   data-i18n-aria="key"     → update aria-label attribute
 *
 * Dynamic JS content (cards, reader, section tabs) must call
 *   window.i18n.t('key')
 * and listen to the 'uilangchange' event to re-render when language switches.
 */

window.I18N = {
  en: {
    // ── Brand ──────────────────────────────────────────────
    app_name:   'Stotram',

    // ── Nav (these appear in dynamically generated mobile menu too) ──
    nav_home:       'Home',
    nav_stotrams:   'Stotrams',
    nav_about:      'About',
    nav_contact:    'Contact',
    nav_credits:    'Credits',
    nav_stats:      'Statistics',

    // ── Tooltips / aria ─────────────────────────────────────
    tip_settings:   'Settings',
    tip_bookmarks:  'Bookmarks',
    tip_menu:       'Toggle menu',
    tip_langswitch: 'Switch to Telugu',

    // ── Settings panel ──────────────────────────────────────
    settings_title:    'Settings',
    setting_fontsize:  'Font Size',
    setting_textcolor: 'Text Colour',
    setting_theme:     'Theme',
    setting_bookmarks: 'Bookmarks',
    theme_global:      'Apply to all stotrams',
    theme_reset:       'Reset to stotram default',
    reset:             'Reset',
    bm_export:         'Export',
    bm_import:         'Import',

    // ── Reader ───────────────────────────────────────────────
    back:              'Back',
    hide_img:          'Hide Image',
    show_img:          'Show Image',
    repeat:            'Repeat',
    times:             'times',
    speed:             'Speed',
    no_audio:          'No audio',
    ready:             'Ready',
    done:              'Done ✓',
    commentary:        'Commentary:',
    shloka_label:      'Shloka',
    bookmark_add:      'Bookmark',
    bookmark_remove:   'Remove bookmark',

    // ── Home page ────────────────────────────────────────────
    hero_sub:          'Sanskrit Devotional Library',
    hero_desc:         'Read, listen and understand the sacred shlokas.',
    hero_cta:          'Browse Stotrams',
    featured:          'Featured Stotrams',

    // ── Stotrams list ────────────────────────────────────────
    all_stotrams:      'All Stotrams',
    tag_all:           'All',

    // ── About / Contact / Credits ────────────────────────────
    about_title:       'About',
    contact_title:     'Contact Us',
    contact_intro:     'Send your feedback and suggestions',
    credits_title:     'Credits',
    cf_name:           'Name',
    cf_email:          'Email',
    cf_subject:        'Subject',
    cf_message:        'Message',
    cf_send:           'Send',

    // ── Footer ───────────────────────────────────────────────
    footer_msg:        'Sanskrit Stotrams — Built with devotion',
    install_app:       'Install App',

    // ── Search ───────────────────────────────────────────────
    search_placeholder: 'Search shlokas…',
    no_results:         'No results found.',
    loading:            'Loading…',

    // ── Stats ────────────────────────────────────────────────
    stats_title:        'Site Statistics',
    stats_page_views:   'Page Views',
    stats_country:      'Visitors by Country',
    stats_top_pages:    'Top Pages',
    stats_today:        'Today',
    stats_total:        'Total',

    // ── Errors ───────────────────────────────────────────────
    err_file_load:      'Could not load',
    err_file_missing:   'Make sure this file exists in your GitHub repository.',
    err_no_stotrams:    'No stotrams found. Check data/stotram/stotrams.json.',
  },

  te: {
    // ── Brand ──────────────────────────────────────────────
    app_name:   'స్తోత్రం',

    // ── Nav ──────────────────────────────────────────────────
    nav_home:       'హోమ్',
    nav_stotrams:   'స్తోత్రాలు',
    nav_about:      'గురించి',
    nav_contact:    'సంప్రదించండి',
    nav_credits:    'కృతజ్ఞతలు',
    nav_stats:      'గణాంకాలు',

    // ── Tooltips / aria ─────────────────────────────────────
    tip_settings:   'అమరికలు',
    tip_bookmarks:  'గుర్తులు',
    tip_menu:       'మెనూ తెరువు',
    tip_langswitch: 'English కి మార్చు',

    // ── Settings panel ──────────────────────────────────────
    settings_title:    'అమరికలు',
    setting_fontsize:  'అక్షర పరిమాణం',
    setting_textcolor: 'అక్షర రంగు',
    setting_theme:     'రంగు అమరిక',
    setting_bookmarks: 'గుర్తులు',
    theme_global:      'అన్నింటికీ వర్తించు',
    theme_reset:       'స్తోత్రం డిఫాల్ట్‌కు రీసెట్',
    reset:             'రీసెట్',
    bm_export:         'ఎగుమతి',
    bm_import:         'దిగుమతి',

    // ── Reader ───────────────────────────────────────────────
    back:              'వెనక్కి',
    hide_img:          'చిత్రం దాచు',
    show_img:          'చిత్రం చూపు',
    repeat:            'పునరావృత్తి',
    times:             'సార్లు',
    speed:             'వేగం',
    no_audio:          'ఆడియో లేదు',
    ready:             'సిద్ధంగా ఉంది',
    done:              'పూర్తయింది ✓',
    commentary:        'వ్యాఖ్యానం:',
    shloka_label:      'శ్లోకం',
    bookmark_add:      'గుర్తు',
    bookmark_remove:   'గుర్తు తొలగించు',

    // ── Home page ────────────────────────────────────────────
    hero_sub:          'సంస్కృత స్తోత్ర గ్రంథాలయం',
    hero_desc:         'శ్లోకాలు చదవండి, వినండి, అర్థం తెలుసుకోండి.',
    hero_cta:          'స్తోత్రాలు చూడండి',
    featured:          'ముఖ్యమైన స్తోత్రాలు',

    // ── Stotrams list ────────────────────────────────────────
    all_stotrams:      'అన్ని స్తోత్రాలు',
    tag_all:           'అన్నీ',

    // ── About / Contact / Credits ────────────────────────────
    about_title:       'గురించి',
    contact_title:     'సంప్రదించండి',
    contact_intro:     'మీ అభిప్రాయాలు, సూచనలు పంపండి',
    credits_title:     'కృతజ్ఞతలు',
    cf_name:           'పేరు',
    cf_email:          'ఇమెయిల్',
    cf_subject:        'విషయం',
    cf_message:        'సందేశం',
    cf_send:           'పంపండి',

    // ── Footer ───────────────────────────────────────────────
    footer_msg:        'సంస్కృత స్తోత్రాలు — భక్తితో నిర్మించబడింది',
    install_app:       'యాప్ ఇన్‌స్టాల్ చేయండి',

    // ── Search ───────────────────────────────────────────────
    search_placeholder: 'శ్లోకాలు వెతకండి…',
    no_results:         'ఫలితాలు కనుగొనబడలేదు.',
    loading:            'లోడవుతోంది…',

    // ── Stats ────────────────────────────────────────────────
    stats_title:        'గణాంకాలు',
    stats_page_views:   'పేజీ వీక్షణలు',
    stats_country:      'దేశం వారీ సందర్శకులు',
    stats_top_pages:    'అగ్ర పేజీలు',
    stats_today:        'నేడు',
    stats_total:        'మొత్తం',

    // ── Errors ───────────────────────────────────────────────
    err_file_load:      'ఫైల్ లోడ్ కాలేదు',
    err_file_missing:   'ఈ ఫైల్ మీ GitHub రిపోజిటరీలో ఉందో లేదో తనిఖీ చేయండి.',
    err_no_stotrams:    'స్తోత్రాలు కనుగొనబడలేదు. data/stotram/stotrams.json తనిఖీ చేయండి.',
  }
};

window.i18n = {
  lang: 'en',

  init() {
    this.lang = window.StotramSettings?.get('uilang') || 'en';
    this.apply();
  },

  /** Get a translated string for the current language */
  t(key) {
    return I18N[this.lang]?.[key] ?? I18N.en[key] ?? key;
  },

  /** Apply translations to every annotated element in the DOM */
  apply() {
    const lang = this.lang;
    document.documentElement.setAttribute('data-uilang', lang);

    // data-i18n="key" → textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = this.t(el.dataset.i18n);
      if (v !== undefined) el.textContent = v;
    });

    // data-i18n-bilingual="key" → same as data-i18n but named
    // clearly so readers of the HTML understand these switch with language
    document.querySelectorAll('[data-i18n-bilingual]').forEach(el => {
      const v = this.t(el.dataset.i18nBilingual);
      if (v !== undefined) el.textContent = v;
    });

    // data-i18n-placeholder="key" → placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const v = this.t(el.dataset.i18nPlaceholder);
      if (v !== undefined) el.placeholder = v;
    });

    // data-i18n-title="key" → title attribute (tooltip)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const v = this.t(el.dataset.i18nTitle);
      if (v !== undefined) el.title = v;
    });

    // data-i18n-aria="key" → aria-label attribute
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const v = this.t(el.dataset.i18nAria);
      if (v !== undefined) el.setAttribute('aria-label', v);
    });

    // Search input placeholder (legacy — also handled by data-i18n-placeholder)
    const srch = document.getElementById('globalSearch');
    if (srch) srch.placeholder = this.t('search_placeholder');

    // Language toggle button: show which language you'll switch TO
    const toggleBtn = document.getElementById('uilangToggle');
    if (toggleBtn) {
      toggleBtn.title = this.t('tip_langswitch');
      // CSS [data-uilang="en/te"] on <html> highlights the active label via main.css
    }

    // Fire event — dynamic JS content (cards, reader, section tabs) re-renders
    document.dispatchEvent(new CustomEvent('uilangchange', { detail: { lang } }));
  },

  /** Toggle between English and Telugu */
  toggle() {
    this.lang = this.lang === 'en' ? 'te' : 'en';
    window.StotramSettings?.set('uilang', this.lang);
    this.apply();
  }
};
