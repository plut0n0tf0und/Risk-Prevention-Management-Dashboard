const tabs = document.querySelectorAll('.tab');
const contentEl = document.getElementById('tab-content');
const cache = {};

async function loadTab(tabId) {
  if (cache[tabId]) {
    renderContent(cache[tabId]);
    return;
  }

  contentEl.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const res = await fetch(`/content/${tabId}/index.html`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    cache[tabId] = html;
    renderContent(html);
  } catch (err) {
    contentEl.innerHTML = `<div class="loading">Failed to load content.</div>`;
    console.error(`Could not load /content/${tabId}.html:`, err);
  }
}

function renderContent(html) {
  contentEl.classList.add('fade-out');

  setTimeout(() => {
    // Wrap in .notion-content to scope styles and prevent conflicts
    const wrapper = document.createElement('div');
    wrapper.className = 'notion-content';

    // Strip <html>, <head>, <body> tags from Notion exports — keep inner content
    const cleaned = stripOuterTags(html);
    wrapper.innerHTML = cleaned;

    contentEl.innerHTML = '';
    contentEl.appendChild(wrapper);
    contentEl.classList.remove('fade-out');
  }, 150);
}

function stripOuterTags(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove Notion page title and page header icon (static icon)
  doc.querySelectorAll('.page-title, .page-header-icon, .page-header-icon-with-cover').forEach(el => el.remove());

  // If it's a full HTML doc (Notion export), grab body content
  const body = doc.body;
  if (body) return body.innerHTML;

  return html;
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabId = tab.dataset.tab;

    tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    loadTab(tabId);
  });
});

// Load first tab on init
loadTab('tab1');
