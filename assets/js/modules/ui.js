/**
 * ui.js — General UI interactions: mobile menu, image toggle, hamburger.
 */

window.StotramUI = {
  init() {
    this._bindHamburger();
    this._bindImageToggle();
    this._bindGrammarLang();
    this._bindBookmarksPanel();
  },

  _bindHamburger() {
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mobileNav');
    toggle?.addEventListener('click', () => nav?.classList.toggle('hidden'));
  },

  _bindImageToggle() {
    document.getElementById('imgToggle')?.addEventListener('click', function() {
      const wrap = document.getElementById('stotramImageWrap');
      const isHidden = wrap?.querySelector('img').style.display === 'none';
      wrap.querySelector('img').style.display = isHidden ? '' : 'none';
      this.querySelector('span').textContent = isHidden
        ? (window.i18n?.t('hide_img') || 'Hide Image')
        : (window.i18n?.t('show_img') || 'Show Image');
    });
  },

  _bindGrammarLang() {
    document.getElementById('grammarLangBar')?.addEventListener('click', (e) => {
      const pill = e.target.closest('.lang-pill');
      if (!pill) return;
      document.querySelectorAll('.lang-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const lang = pill.dataset.lang;
      document.querySelectorAll('.grammar-section-text').forEach(el => {
        el.style.display = el.dataset.lang === lang ? '' : 'none';
      });
    });
  },

  _bindBookmarksPanel() {
    document.getElementById('bookmarksBtn')?.addEventListener('click', () => {
      alert('Bookmarks panel coming soon! Use the Settings panel to Export/Import bookmarks.');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => window.StotramUI.init());
