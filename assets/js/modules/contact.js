/**
 * contact.js — Fire-and-forget contact form via Google Apps Script.
 *
 * Usage (any project):
 *   Contact.init({ scriptUrl: 'https://script.google.com/...', siteName: 'mysite.com' });
 *
 * Posts fields: name, email, subject, message, lang, site
 * Uses mode:'no-cors' — Apps Script doesn't return CORS headers, so response is opaque.
 */
window.Contact = {
  _scriptUrl: '',
  _siteName:  '',

  init({ scriptUrl, siteName }) {
    this._scriptUrl = scriptUrl;
    this._siteName  = siteName;
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', e => this._onSubmit(e));
  },

  async _onSubmit(e) {
    e.preventDefault();
    const form    = e.target;
    const status  = document.getElementById('contact-status');
    const btn     = form.querySelector('[type="submit"]');
    const lang    = window.i18n?.lang || 'en';

    const body = JSON.stringify({
      name:    form.querySelector('#cf-name').value.trim(),
      email:   form.querySelector('#cf-email').value.trim(),
      subject: form.querySelector('#cf-subject').value,
      message: form.querySelector('#cf-message').value.trim(),
      lang,
      site:    this._siteName,
    });

    btn.disabled = true;
    if (status) { status.hidden = false; status.textContent = lang === 'te' ? 'పంపుతున్నాం…' : 'Sending…'; status.className = 'contact-status'; }

    try {
      await fetch(this._scriptUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body });
      form.reset();
      if (status) { status.textContent = lang === 'te' ? 'పంపబడింది! ధన్యవాదాలు.' : 'Sent! Thank you.'; status.className = 'contact-status success'; }
    } catch {
      if (status) { status.textContent = lang === 'te' ? 'పంపడంలో వైఫల్యం. తిరిగి ప్రయత్నించండి.' : 'Failed to send. Please try again.'; status.className = 'contact-status error'; }
    } finally {
      btn.disabled = false;
    }
  },
};
