// Global state
let works = {};
let currentWork = null;
let currentSection = null;
let fuse = null;
let selectedScript = localStorage.getItem('selectedScript') || 'telugu';

// DOM elements
const treeMenu = document.getElementById('treeMenu');
const mainContent = document.getElementById('mainContent');
const shlokasContainer = document.getElementById('shlokasContainer');
const searchInput = document.getElementById('searchInput');
const translitSelect = document.getElementById('translitSelect');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const menuBtn = document.getElementById('menuBtn');
const sidebarLeft = document.getElementById('sidebarLeft');
const rightMenuBtn = document.getElementById('rightMenuBtn');

// Init
document.addEventListener('DOMContentLoaded', async () => {
  translitSelect.value = selectedScript;
  await loadManifestAndContent();
  initEventListeners();
  updateFontSize();
  updateTheme();
});

// [Keep all your existing functions: loadManifestAndContent, parseShlokas, etc.]
// Just replace initEventListeners and add these:

function initEventListeners() {
  // FIXED MENU TOGGLE
  menuBtn.onclick = (e) => {
    e.stopPropagation();
    sidebarLeft.classList.toggle('open');
    menuBtn.classList.toggle('active');
  };

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!sidebarLeft.contains(e.target) && !menuBtn.contains(e.target)) {
      sidebarLeft.classList.remove('open');
      menuBtn.classList.remove('active');
    }
  });

  // FIXED SETTINGS - Top right always
  settingsBtn.onclick = (e) => {
    e.stopPropagation();
    settingsPanel.classList.toggle('show');
  };

  // Theme toggle
  document.getElementById('themeToggle').onchange = (e) => {
    document.body.className = e.target.value;
    localStorage.setItem('theme', e.target.value);
  };

  // Font size - FIXED
  document.getElementById('fontSize').oninput = (e) => {
    const size = e.target.value;
    document.documentElement.style.setProperty('--font-size', `${size}px`);
    localStorage.setProperty('fontSize', size);
  };

  // Language - FIXED persistence
  translitSelect.onchange = (e) => {
    selectedScript = e.target.value;
    localStorage.setItem('selectedScript', selectedScript);
    if (currentSection) renderShlokas(currentSection.shlokas);
  };
}

function updateTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.className = savedTheme;
  document.getElementById('themeToggle').value = savedTheme;
}

function updateFontSize() {
  const savedSize = localStorage.getItem('fontSize') || '28';
  document.getElementById('fontSize').value = savedSize;
  document.documentElement.style.setProperty('--font-size', `${savedSize}px`);
}

// Update renderShlokas to use selectedScript (from previous fix)
function renderShlokas(shlokas) {
  shlokasContainer.innerHTML = '';
  shlokas.forEach((shloka, index) => {
    const shlokaEl = document.createElement('div');
    shlokaEl.className = `shloka ${index % 2 === 0 ? 'even' : 'odd'}`;
    
    const linesHTML = shloka.lines.map(line => 
      `<div class="shloka-line">${Sanscript.t(line, 'devanagari', selectedScript)}</div>`
    ).join('');
    
    shlokaEl.innerHTML = `<div class="shloka-text">${linesHTML}</div>`;
    shlokasContainer.appendChild(shlokaEl);
  });
}
