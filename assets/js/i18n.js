/**
 * i18n.js — Bilingual UI strings (Telugu + English)
 * Plug-and-play: add new keys here; they auto-apply via data-i18n attributes.
 */

window.I18N = {
  en: {
    brand_te: 'స్తోత్రం', brand_en: 'Stotram',
    nav_home: 'Home', nav_stotrams: 'Stotrams',
    nav_about: 'About', nav_contact: 'Contact', nav_credits: 'Credits',
    settings_title: 'Settings',
    setting_fontsize: 'Font Size', setting_textcolor: 'Text Colour',
    setting_theme: 'Theme', setting_bookmarks: 'Bookmarks',
    theme_global: 'Apply to all stotrams',
    theme_reset: 'Reset to stotram default',
    reset: 'Reset', bm_export: 'Export', bm_import: 'Import',
    back: 'Back', hide_img: 'Hide Image', show_img: 'Show Image',
    repeat: 'Repeat', times: 'times', speed: 'Speed',
    no_audio: 'No audio', commentary: 'Commentary:',
    featured: 'Featured Stotrams', all_stotrams: 'All Stotrams',
    tag_all: 'All', hero_sub: 'Sanskrit Devotional Library',
    hero_desc: 'Read, listen and understand the sacred shlokas.',
    hero_cta: 'Browse Stotrams',
    about_title: 'About', contact_title: 'Contact Us',
    contact_intro: 'Send your feedback and suggestions',
    credits_title: 'Credits',
    cf_name: 'Name', cf_email: 'Email', cf_subject: 'Subject',
    cf_message: 'Message', cf_send: 'Send',
    footer_msg: 'Sanskrit Stotrams — Built with devotion',
    install_app: 'Install App',
    shloka_label: 'Shloka',
    bookmark_add: 'Bookmark', bookmark_remove: 'Remove bookmark',
    search_placeholder: 'Search shlokas…',
    loading: 'Loading…', no_results: 'No results found.',
  },
  te: {
    brand_te: 'స్తోత్రం', brand_en: 'Stotram',
    nav_home: 'హోమ్', nav_stotrams: 'స్తోత్రాలు',
    nav_about: 'గురించి', nav_contact: 'సంప్రదించండి', nav_credits: 'కృతజ్ఞతలు',
    settings_title: 'అమరికలు',
    setting_fontsize: 'అక్షర పరిమాణం', setting_textcolor: 'అక్షర రంగు',
    setting_theme: 'రంగు అమరిక', setting_bookmarks: 'గుర్తులు',
    theme_global: 'అన్నింటికీ వర్తించు',
    theme_reset: 'స్తోత్రం డిఫాల్ట్‌కు రీసెట్',
    reset: 'రీసెట్', bm_export: 'ఎగుమతి', bm_import: 'దిగుమతి',
    back: 'వెనక్కి', hide_img: 'చిత్రం దాచు', show_img: 'చిత్రం చూపు',
    repeat: 'పునరావృత్తి', times: 'సార్లు', speed: 'వేగం',
    no_audio: 'ఆడియో లేదు', commentary: 'వ్యాఖ్యానం:',
    featured: 'ముఖ్యమైన స్తోత్రాలు', all_stotrams: 'అన్ని స్తోత్రాలు',
    tag_all: 'అన్నీ', hero_sub: 'సంస్కృత స్తోత్ర గ్రంథాలయం',
    hero_desc: 'శ్లోకాలు చదవండి, వినండి, అర్థం తెలుసుకోండి.',
    hero_cta: 'స్తోత్రాలు చూడండి',
    about_title: 'గురించి', contact_title: 'సంప్రదించండి',
    contact_intro: 'మీ అభిప్రాయాలు, సూచనలు పంపండి',
    credits_title: 'కృతజ్ఞతలు',
    cf_name: 'పేరు', cf_email: 'ఇమెయిల్', cf_subject: 'విషయం',
    cf_message: 'సందేశం', cf_send: 'పంపండి',
    footer_msg: 'సంస్కృత స్తోత్రాలు — భక్తితో నిర్మించబడింది',
    install_app: 'యాప్ ఇన్‌స్టాల్ చేయండి',
    shloka_label: 'శ్లోకం',
    bookmark_add: 'గుర్తు', bookmark_remove: 'గుర్తు తొలగించు',
    search_placeholder: 'శ్లోకాలు వెతకండి…',
    loading: 'లోడవుతోంది…', no_results: 'ఫలితాలు కనుగొనబడలేదు.',
  }
};

window.i18n = {
  lang: 'en',

  init() {
    this.lang = window.StotramSettings?.get('uilang') || 'en';
    document.documentElement.setAttribute('data-uilang', this.lang);
    this.apply();
  },

  t(key) {
    return I18N[this.lang]?.[key] || I18N.en[key] || key;
  },

  apply() {
    // data-i18n="key" — replaces textContent with single language
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = this.t(key);
      if (val) el.textContent = val;
    });

    // data-i18n-bilingual="key" — shows "te / en" or "en" depending on mode
    document.querySelectorAll('[data-i18n-bilingual]').forEach(el => {
      const key = el.dataset.i18nBilingual;
      const te = I18N.te[key] || '';
      const en = I18N.en[key] || '';
      if (this.lang === 'te') {
        el.textContent = te || en;
      } else {
        el.textContent = en || te;
      }
    });

    // Placeholder update
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) searchInput.placeholder = this.t('search_placeholder');

    // Update UI lang toggle highlight
    document.documentElement.setAttribute('data-uilang', this.lang);
  },

  toggle() {
    this.lang = this.lang === 'en' ? 'te' : 'en';
    window.StotramSettings?.set('uilang', this.lang);
    this.apply();
  }
};
