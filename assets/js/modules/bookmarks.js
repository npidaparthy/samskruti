/**
 * bookmarks.js — localStorage bookmarks with JSON export/import.
 * Plug-and-play: delete this file to disable bookmarks entirely.
 */

window.StotramBookmarks = {
  STORAGE_KEY: 'stotram_bookmarks',
  _data: {},

  init() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this._data = raw ? JSON.parse(raw) : {};
    } catch { this._data = {}; }

    this._bindControls();
    this._bindShlokasDelegate();
  },

  has(key) { return !!this._data[key]; },

  toggle(key, label) {
    if (this._data[key]) {
      delete this._data[key];
    } else {
      this._data[key] = { label, ts: Date.now() };
    }
    this._save();
    return !!this._data[key];
  },

  _save() {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._data)); } catch {}
  },

  export() {
    const blob = new Blob([JSON.stringify(this._data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'stotram-bookmarks.json';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  import(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        this._data = { ...this._data, ...imported };
        this._save();
        alert(`Imported ${Object.keys(imported).length} bookmarks.`);
      } catch { alert('Invalid bookmarks file.'); }
    };
    reader.readAsText(file);
  },

  _bindControls() {
    document.getElementById('bmExport')?.addEventListener('click', () => this.export());
    const bmImportBtn = document.getElementById('bmImport');
    const bmImportFile = document.getElementById('bmImportFile');
    bmImportBtn?.addEventListener('click', () => bmImportFile?.click());
    bmImportFile?.addEventListener('change', (e) => {
      if (e.target.files[0]) this.import(e.target.files[0]);
    });
  },

  _bindShlokasDelegate() {
    document.getElementById('shlokasContainer')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.shloka-bookmark-btn');
      if (!btn) return;
      const key = btn.dataset.bmKey;
      const label = btn.closest('.shloka-block')?.querySelector('.shloka-text')?.textContent?.slice(0, 60) || key;
      const added = this.toggle(key, label);
      btn.classList.toggle('bookmarked', added);
      btn.textContent = added ? '🔖' : '🏷️';
      btn.title = added ? 'Remove bookmark' : 'Bookmark';
    });
  }
};
