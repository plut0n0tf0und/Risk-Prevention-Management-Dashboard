const tabs = document.querySelectorAll('.tab');
const contentEl = document.getElementById('tab-content');
const cache = {};

async function loadTab(tabId) {
  if (cache[tabId]) {
    renderContent(cache[tabId], tabId);
    return;
  }

  contentEl.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const res = await fetch(`/content/${tabId}/index.html`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    cache[tabId] = html;
    renderContent(html, tabId);
  } catch (err) {
    contentEl.innerHTML = `<div class="loading">Failed to load content.</div>`;
    console.error(`Could not load /content/${tabId}/index.html:`, err);
  }
}

function renderContent(html, tabId) {
  contentEl.classList.add('fade-out');

  setTimeout(() => {
    // Wrap in .notion-content to scope styles and prevent conflicts
    const wrapper = document.createElement('div');
    wrapper.className = 'notion-content';

    // Strip <html>, <head>, <body> tags from Notion exports — keep inner content
    const cleaned = stripOuterTags(html, tabId);
    wrapper.innerHTML = cleaned;

    contentEl.innerHTML = '';
    contentEl.appendChild(wrapper);
    contentEl.classList.remove('fade-out');

    // Close all Notion toggles by default
    contentEl.querySelectorAll('.notion-content details').forEach(el => {
      el.removeAttribute('open');
    });
  }, 150);
}

function stripOuterTags(html, tabId) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove Notion internal bookmark cards (e.g. links to notion.so pages)
  doc.querySelectorAll('a.bookmark.source, a[class*="bookmark"]').forEach(a => {
    if (a.href && a.href.includes('notion.so')) {
      const block = a.closest('figure') || a.closest('div[style]') || a.parentElement;
      if (block) block.remove();
      else a.remove();
    }
  });

  // Remove Notion page title and page header icon (static icon)
  doc.querySelectorAll('.page-title, .page-header-icon, .page-header-icon-with-cover').forEach(el => el.remove());

  // Remove any element whose summary/heading text contains "Popup text 2"
  // Also remove "Project Overview" dropdown on non-overview tabs
  doc.querySelectorAll('details, h1, h2, h3, h4, p, summary').forEach(el => {
    const text = el.textContent.trim().toLowerCase();
    if (text.includes('popup text 2')) {
      const block = el.closest('details') || el.closest('div[style]') || el.parentElement;
      if (block) block.remove();
      else el.remove();
    }
  });

  // Convert known platform links to iframes
  convertEmbedsInDoc(doc);

  // Clean up junk blocks (pass tabId to skip removal on relevant tabs)
  removeJunkBlocks(doc, tabId);

  // If it's a full HTML doc (Notion export), grab body content
  const body = doc.body;
  if (body) return body.innerHTML;

  return html;
}

function removeJunkBlocks(doc, tabId) {
  // Remove "Project Overview" dropdown only on non-overview tabs
  if (tabId !== 'project-overview') {
    doc.querySelectorAll('details').forEach(details => {
      const summary = details.querySelector('summary');
      if (summary && summary.textContent.trim().toLowerCase() === 'project overview') {
        details.remove();
      }
    });
  }

  // Remove junk headings like "General"
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
    const text = el.textContent.trim().toLowerCase();
    if (text === 'general') {
      const wrapper = el.closest('div[style]') || el.parentElement;
      if (wrapper && wrapper !== doc.body) wrapper.remove();
      else el.remove();
    }
  });

  // Remove junk headings: "General" and similar noise
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
    const text = el.textContent.trim().toLowerCase();
    if (text === 'general') {
      el.remove();
    }
  });
  // These are toggles acting as list items — remove the bullet wrapper
  doc.querySelectorAll('ul.toggle').forEach(ul => {
    ul.style.listStyle = 'none';
    ul.style.paddingLeft = '0';
    ul.querySelectorAll('li').forEach(li => {
      li.style.listStyle = 'none';
    });
  });

  // Remove inline list-style from <li> that directly contain <details>
  // These are toggle wrappers, not content bullets
  doc.querySelectorAll('li').forEach(li => {
    if (li.querySelector(':scope > details')) {
      li.style.listStyle = 'none';
      li.style.paddingLeft = '0';
      li.style.marginLeft = '0';
    }
  });
}

function convertEmbedsInDoc(doc) {
  doc.querySelectorAll('a').forEach(a => {
    const href = a.href || '';
    const embedUrl = resolveEmbedUrl(href);
    if (!embedUrl) return;

    const isMockFlow = href.includes('mockflow.com');
    const isFigma = href.includes('figma.com');

    const wrapper = doc.createElement('div');
    wrapper.className = 'embed-container' + (isMockFlow ? ' mockflow-embed' : '') + (isFigma ? ' figma-embed' : '');

    const iframe = doc.createElement('iframe');
    iframe.src = embedUrl;
    iframe.allowFullscreen = true;
    iframe.setAttribute('allow', 'fullscreen');
    iframe.setAttribute('loading', 'lazy');

    const fallback = doc.createElement('a');
    fallback.href = href;
    fallback.target = '_blank';
    fallback.rel = 'noopener noreferrer';
    fallback.className = 'embed-fallback-link';
    fallback.textContent = 'Open in new tab ↗';

    wrapper.appendChild(iframe);
    wrapper.appendChild(fallback);

    const container = a.closest('.source') || a.closest('figure') || a;
    container.replaceWith(wrapper);
  });
}

function resolveEmbedUrl(href) {
  if (!href) return null;

  // Figma — proto links
  if (href.includes('figma.com/proto')) {
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(href)}`;
  }

  // Figma — already an embed link
  if (href.includes('embed.figma.com') || href.includes('figma.com/embed')) {
    return href;
  }

  // MockFlow
  if (href.includes('mockflow.com')) {
    return href.replace(/zoom=\d+/, 'zoom=100');
  }

  // Framer
  if (href.includes('framer.website') || href.includes('framer.com')) {
    return href;
  }

  return null;
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
loadTab('project-overview');
