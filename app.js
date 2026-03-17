// Global state
let works = {};
let currentWork = null;
let currentSection = null;
let fuse = null;
let bookmarks = JSON.parse(localStorage.getElementById('stotraBookmarks') || '[]');

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
const bookmarksList = document.getElementById('bookmarksList');

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await loadManifestAndContent();
  initEventListeners();
  renderBookmarks();
  updateFontSize();
});

// 1. Auto‑discovery & content loading
async function loadManifestAndContent() {
  try {
    const response = await fetch('data/manifest.json');
    const manifest = await response.json();
    
    // Group files into works by filename pattern
    const fileGroups = {};
    manifest.files.forEach(file => {
      // Extract work name from filename (before first _)
      const workMatch = file.match(/^([^-]+-[^-]+)_/);
      if (workMatch) {
        const workId = workMatch[1];
        if (!fileGroups[workId]) fileGroups[workId] = [];
        fileGroups[workId].push(file);
      }
    });
    
    // Load and parse each file
    for (const [workId, files] of Object.entries(fileGroups)) {
      works[workId] = { id: workId, sections: {} };
      
      for (const file of files) {
        const sectionId = file.split('_')[1]?.replace('.txt', '') || 'main';
        const sectionTitle = titleFromSectionId(sectionId);
        
        const text = await fetch(`data/${file}`).then(r => r.text());
        works[workId].sections[sectionId] = {
          id: sectionId,
          title: sectionTitle,
          file: file,
          shlokas: parseShlokas(text)
        };
      }
    }
    
    buildTreeMenu();
    initSearch();
  } catch (err) {
    console.error('Failed to load content:', err);
  }
}

function parseShlokas(text) {
  return text.split('\n\n') // split on blank lines
    .map(block => block.trim())
    .filter(block => block && !block.startsWith('#'))
    .map((block, index) => ({
      id: index + 1,
      text: block.split('\n').filter(line => !line.startsWith('<')).join('\n'),
      // Parse inline tags if present
      tags: extractTags(block),
      // Add more parsing for audio, grammar etc. later
    }));
}

function extractTags(block) {
  const tagMatches = block.match(/<([^>]+)>/g);
  return tagMatches ? tagMatches.map(t => t.slice(1, -1)) : [];
}

function titleFromSectionId(id) {
  const titles = {
    'purva-peethika': 'పూర్వ పీఠిక',
    'uttara-peethika': 'ఉత్తర పీఠిక',
    'stotram': 'స్తోత్రం',
    'adhyaya-01': 'అధ్యాయం 01'
    // Add more mappings as needed
  };
  return titles[id] || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// 2. Build tree menu dynamically
function buildTreeMenu() {
  treeMenu.innerHTML = '';
  
  Object.values(works).forEach(work => {
    const workNode = document.createElement('div');
    workNode.className = 'tree-item';
    workNode.textContent = work.id.replace(/-/g, ' ').toUpperCase();
    workNode.onclick = () => selectWork(work.id);
    
    const submenu = document.createElement('div');
    submenu.className = 'tree-submenu';
    
    Object.values(work.sections).forEach(section => {
      const sectionNode = document.createElement('div');
      sectionNode.className = 'tree-item';
      sectionNode.textContent = `  ${section.title}`;
      sectionNode.onclick = (e) => {
        e.stopPropagation();
        selectSection(work.id, section.id);
      };
      submenu.appendChild(sectionNode);
    });
    
    workNode.appendChild(submenu);
    treeMenu.appendChild(workNode);
  });
}

// 3. Navigation
function selectWork(workId) {
  currentWork = works[workId];
  document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
  event.target.classList.add('active');
  // Auto‑select first section
  if (currentWork.sections) {
    const firstSectionId = Object.keys(currentWork.sections)[0];
    selectSection(workId, firstSectionId);
  }
}

function selectSection(workId, sectionId) {
  currentWork = works[workId];
  currentSection = currentWork.sections[sectionId];
  
  document.getElementById('contentTitle').textContent = 
    `${currentWork.id.replace(/-/g, ' ').toUpperCase()} – ${currentSection.title}`;
  
  renderShlokas(currentSection.shlokas);
}

// 4. Render shlokas
function renderShlokas(shlokas) {
  shlokasContainer.innerHTML = '';
  
  shlokas.forEach((shloka, index) => {
    const shlokaEl = document.createElement('div');
    shlokaEl.className = `shloka ${index % 2 === 0 ? 'even' : 'odd'}`;
    
    const textEl = document.createElement('div');
    textEl.className = 'shloka-text';
    textEl.textContent = shloka.text;
    
    const actionsEl = document.createElement('div');
    actionsEl.className = 'shloka-actions';
    actionsEl.innerHTML = `
      <button onclick="addBookmark('${currentWork.id}', '${currentSection.id}', ${shloka.id})">
        ⭐ Bookmark
      </button>
    `;
    
    shlokaEl.append(textEl, actionsEl);
    shlokasContainer.appendChild(shlokaEl);
  });
}

// 5. Search
function initSearch() {
  // Flatten all shlokas for search index
  const allShlokas = [];
  Object.values(works).forEach(work => {
    Object.values(work.sections).forEach(section => {
      section.shlokas.forEach(shloka => {
        allShlokas.push({
          ...shloka,
          workId: work.id,
          sectionId: section.id,
          workTitle: work.id,
          sectionTitle: section.title
        });
      });
    });
  });
  
  fuse = new Fuse(allShlokas, {
    keys: ['text', 'tags'],
    threshold: 0.4
  });
  
  searchInput.addEventListener('input', e => {
    const query = e.target.value;
    if (!query) {
      if (currentSection) renderShlokas(currentSection.shlokas);
      return;
    }
    
    const results = fuse.search(query);
    renderSearchResults(results.map(r => r.item));
  });
}

function renderSearchResults(results) {
  // Similar to renderShlokas but with work/section context
  // For v1, just show matching shlokas
  shlokasContainer.innerHTML = `<p>Found ${results.length} matches...</p>`;
  // TODO: full implementation
}

// 6. Bookmarks
function addBookmark(workId, sectionId, shlokaId) {
  const bookmark = {
    id: `${workId}:${sectionId}:${shlokaId}`,
    workId, sectionId, shlokaId,
    label: `${workId} ${sectionId} #${shlokaId}`,
    createdAt: Date.now()
  };
  
  if (!bookmarks.find(b => b.id === bookmark.id)) {
    bookmarks.unshift(bookmark);
    localStorage.setItem('stotraBookmarks', JSON.stringify(bookmarks));
    renderBookmarks();
  }
}

function renderBookmarks() {
  bookmarksList.innerHTML = bookmarks.slice(0, 20).map(b => `
    <div class="bookmark-item" onclick="goToBookmark('${b.id}')">
      ${b.label}
    </div>
  `).join('');
}

function goToBookmark(bookmarkId) {
  const [workId, sectionId] = bookmarkId.split(':');
  selectSection(workId, sectionId);
}

// 7. Event listeners
function initEventListeners() {
  // Mobile menu
  menuBtn.onclick = () => sidebarLeft.classList.toggle('open');
  rightMenuBtn.onclick = () => sidebarRight.classList.toggle('open');
  
  // Settings
  settingsBtn.onclick = () => settingsPanel.style.display = 
    settingsPanel.style.display === 'block' ? 'none' : 'block';
  
  // Font size
  document.getElementById('fontSize').oninput = updateFontSize;
  
  // Transliteration (basic)
  translitSelect.onchange = applyTransliteration;
  
  // Close settings on outside click
  document.onclick = (e) => {
    if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
      settingsPanel.style.display = 'none';
    }
  };
}

function updateFontSize() {
  const size = document.getElementById('fontSize').value;
  document.documentElement.style.setProperty('--font-size', `${size}px`);
}

function applyTransliteration() {
  const script = translitSelect.value;
  // Re‑render current shlokas with transliteration
  if (currentSection) {
    const transliterated = currentSection.shlokas.map(s => ({
      ...s,
      text: Sanscript.t(s.text, 'devanagari', script)
    }));
    renderShlokas(transliterated);
  }
}

// Expose functions globally for onclick handlers
window.addBookmark = addBookmark;
window.goToBookmark = goToBookmark;
