const API_BASE = 'https://newsxphere.xtarnet.us.to';
const $ = selector => document.querySelector(selector);
let sessionToken = sessionStorage.getItem('newsxphere-admin-token') || '';
const api = (path, options = {}) => fetch(`${API_BASE}/api/admin${path}`, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}), ...(options.headers || {}) } });
const responseData = async response => { const text = await response.text(); try { return JSON.parse(text); } catch { return { error: text || `Request failed with HTTP ${response.status}` }; } };
const indexHistoryKey = 'newsxphere-index-history';
let liveIndexResults = null;
const indexHistory = () => { try { return JSON.parse(localStorage.getItem(indexHistoryKey) || '[]'); } catch { return []; } };
function recordIndex(url, status, message = '') { const history = [{ url, status, message, at: new Date().toISOString() }, ...indexHistory().filter(item => item.url !== url)].slice(0, 100); localStorage.setItem(indexHistoryKey, JSON.stringify(history)); renderIndexActivity(); }
function renderIndexActivity() { const stat = $('#indexing-status'); const history = indexHistory(); if (stat) stat.textContent = liveIndexResults ? `${liveIndexResults.filter(item => item.verdict === 'PASS').length}/${liveIndexResults.length} indexed` : (history.length ? 'Requests tracked' : 'Ready'); let panel = $('#index-activity'); if (!panel) { panel = document.createElement('section'); panel.id = 'index-activity'; panel.className = 'card index-activity'; $('.stat-grid')?.after(panel); } panel.innerHTML = `<div class="activity-head"><div><p class="eyebrow">INDEXING CONTROL</p><h3>Google Search status</h3></div><div class="activity-tools"><span>${liveIndexResults ? `${liveIndexResults.length} checked` : `${history.length} requests tracked`}</span><button id="refresh-index-status" class="text-button" type="button">Check live status</button></div></div>${liveIndexResults ? `<div class="activity-list">${liveIndexResults.map(item => `<div class="activity-row"><span class="activity-dot ${item.verdict === 'PASS' ? 'success' : 'failed'}"></span><span class="activity-url">${escapeHtml(item.url)}</span><b class="activity-status ${item.verdict === 'PASS' ? 'success' : 'failed'}">${escapeHtml(item.verdict || 'UNKNOWN')}</b><small>${escapeHtml(item.coverageState || item.error || 'No Google status')}</small></div>`).join('')}</div>` : (history.length ? `<div class="activity-list">${history.map(item => `<div class="activity-row"><span class="activity-dot ${item.status}"></span><span class="activity-url">${escapeHtml(item.url)}</span><b class="activity-status ${item.status}">${item.status === 'success' ? 'Requested' : 'Failed'}</b><time>${escapeHtml(new Date(item.at).toLocaleString())}</time></div>`).join('')}</div>` : '<p class="muted small">Click “Check live status” to inspect the URLs in allnewsdata.json with Google Search Console.</p>')}`; $('#refresh-index-status')?.addEventListener('click', checkLiveIndex); }
async function checkLiveIndex() { const button = $('#refresh-index-status'); if (button) { button.disabled = true; button.textContent = 'Checking…'; } showNotice('Checking live Google index status…'); try { const response = await api('/index-status'); const data = await responseData(response); if (!response.ok) throw Error(data.error || 'Live index check failed.'); liveIndexResults = data.results || []; renderIndexActivity(); showNotice(`Google checked ${liveIndexResults.length} article URLs.`); } catch (error) { showNotice(error.message || 'Live index check failed.', true); } finally { if ($('#refresh-index-status')) { $('#refresh-index-status').disabled = false; $('#refresh-index-status').textContent = 'Check live status'; } } }
let generatedPage = null;
let generatedHtml = '';
let articles = [];
let articleInventory = null;
let uploadedHero = null;

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const cleanJson = text => {
  let value = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(value); } catch {}
  const start = value.indexOf('{'); const end = value.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(value.slice(start, end + 1));
  throw new Error('AI returned an invalid article package. Please run the command again.');
};
const slugify = value => String(value || 'article').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'article';
const blockGroups = { 'Core story': ['takeaways','checklist','quote','comparison','faq','sources','video','timeline','key-numbers','pros-cons','what-we-know','what-we-dont-know','why-it-matters','what-next','context-box'], 'SEO and trust': ['seo-title','meta-description','keyword-map','canonical-check','schema-newsarticle','author-box','fact-check','source-quality','correction-note','reading-time','image-alt','image-credit','internal-links','external-links','related-stories'], 'Analysis': ['expert-angle','timeline-analysis','cause-effect','stakeholder-map','risk-analysis','scenario-analysis','market-impact','policy-impact','technology-impact','regional-impact','comparison-matrix','data-breakdown','myth-vs-fact','definition-box','glossary'], 'Reader experience': ['quick-summary','key-questions','faq-expanded','pull-quote','highlight-box','numbered-steps','checklist-expanded','callout-warning','callout-context','pros-cons-table','quote-card','source-notes','author-note','editor-note','newsletter-cta'], 'Media and distribution': ['youtube-embed','vimeo-embed','podcast-embed','image-gallery','captioned-image','social-embed','document-link','download-box','print-summary','share-card'] };
const blockLabels = value => value.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
function buildBlockSelector() { const fieldset = $('#writer-form fieldset'); if (!fieldset) return; fieldset.innerHTML = '<legend>Special page blocks · AI can auto-select</legend><label class="check auto-block"><input type="checkbox" name="autoBlocks" checked> Let AI choose the useful blocks from the story</label><div class="block-grid">' + Object.entries(blockGroups).map(([group, values]) => `<details class="block-group" open><summary>${group}<span>${values.length} options</span></summary>${values.map(value => `<label class="block-option"><input type="checkbox" name="blocks" value="${value}"><span>${blockLabels(value)}</span></label>`).join('')}</details>`).join('') + '</div>'; }
buildBlockSelector();
const connectGeminiButton = document.createElement('button'); connectGeminiButton.id = 'connect-gemini'; connectGeminiButton.type = 'button'; connectGeminiButton.className = 'button'; connectGeminiButton.textContent = 'Connect Google for Gemini';
const geminiAccountStatus = document.createElement('small'); geminiAccountStatus.id = 'gemini-account-status'; geminiAccountStatus.className = 'muted'; geminiAccountStatus.textContent = 'Existing admin login remains unchanged. Google access is only for Gemini API.';
$('#writer-form')?.before(connectGeminiButton, geminiAccountStatus);
connectGeminiButton.addEventListener('click', async () => { connectGeminiButton.disabled = true; connectGeminiButton.textContent = 'Opening Google…'; try { const response = await api('/oauth/google/start'); const data = await responseData(response); if (!response.ok || !data.url) throw Error(data.error || 'Google Gemini connection could not start.'); window.location.href = data.url; } catch (error) { connectGeminiButton.disabled = false; connectGeminiButton.textContent = 'Connect Google for Gemini'; geminiAccountStatus.textContent = error.message || 'Google connection failed.'; showNotice(geminiAccountStatus.textContent, true); } });
const googleResult = new URLSearchParams(window.location.search).get('google'); if (googleResult === 'connected') { geminiAccountStatus.textContent = 'Google account connected for Gemini API.'; showNotice('Google Gemini API access connected.'); window.history.replaceState({}, document.title, window.location.pathname); } else if (googleResult === 'error') { geminiAccountStatus.textContent = 'Google connection failed.'; showNotice(geminiAccountStatus.textContent, true); window.history.replaceState({}, document.title, window.location.pathname); }
const sourceNotes = $('#writer-form textarea[name="source"]'); if (sourceNotes) { sourceNotes.required = false; sourceNotes.placeholder = 'Optional: paste verified notes or links. For live research, describe the topic and angle in the Super AI editorial command box.'; }
const customLengthLabel = document.createElement('label'); customLengthLabel.innerHTML = 'Custom target length <input name="customLength" type="number" min="300" max="10000" step="50" placeholder="Example: 1800"><small class="muted">Words. Leave empty to use the selected preset.</small>'; const lengthSelect = $('#writer-form select[name="length"]'); lengthSelect?.closest('label')?.after(customLengthLabel);
const bytesToBase64 = bytes => { let binary = ''; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(binary); };
async function attachOpenImage(page) { if (page.heroImageUrl) return; try { const query = [page.title, page.category, ...(page.keywords || []).slice(0, 3)].filter(Boolean).join(' '); const response = await api(`/image/search?q=${encodeURIComponent(query)}`); if (!response.ok) return; const data = await response.json(); const image = data.candidates?.[0]; if (!image?.url) return; const mime = String(image.mime || '').toLowerCase(); page.heroImageUrl = image.url; page.heroImageExtension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('svg') ? 'svg' : 'jpg'; page.heroImageSource = image.sourceUrl || ''; page.heroImageLicense = image.license || ''; page.heroImageArtist = image.artist || ''; page.sources = [...(page.sources || []), { title: `Hero image: ${image.title || page.title} — ${image.license || 'license noted'}${image.artist ? ` — ${image.artist}` : ''}`, url: image.sourceUrl || image.url }]; } catch (error) { console.warn('Image search failed', error); } }
const coverSvg = page => { const title = escapeHtml(page.title || 'NewsXphere'); const category = escapeHtml(page.category || 'News'); const words = String(page.title || 'NewsXphere').split(/\s+/); const lines = []; for (let i = 0; i < words.length && lines.length < 4; i += 4) lines.push(words.slice(i, i + 4).join(' ')); return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#102f32"/><stop offset="1" stop-color="#0b1618"/></linearGradient><pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M0 80L80 0M-20 20L20-20M60 100L100 60" stroke="#d66b4e" stroke-opacity=".16" stroke-width="2"/></pattern></defs><rect width="1600" height="900" fill="url(#g)"/><rect width="1600" height="900" fill="url(#p)"/><circle cx="1270" cy="220" r="210" fill="#d66b4e" opacity=".18"/><circle cx="1370" cy="320" r="120" fill="none" stroke="#f2eee6" stroke-opacity=".35" stroke-width="2"/><text x="100" y="130" fill="#f2eee6" font-family="Arial,sans-serif" font-size="28" letter-spacing="7">NEWSXPHERE / ${category.toUpperCase()}</text><text x="100" y="650" fill="#f2eee6" font-family="Georgia,serif" font-size="76" font-weight="700">${lines.map((line, i) => `<tspan x="100" dy="${i ? 92 : 0}">${escapeHtml(line)}</tspan>`).join('')}</text><text x="100" y="820" fill="#d66b4e" font-family="Arial,sans-serif" font-size="25" letter-spacing="4">SIGNAL DESK · VERIFIED EDITORIAL COVER</text></svg>`; };
const showNotice = (message, error = false) => { const node = $('#notice'); node.textContent = message || ''; node.className = `notice ${error ? 'error' : 'success'}`; };
const explainGenerationError = value => {
  const message = String(value || 'Generation failed.');
  if (/user location is not supported|failed_precondition/i.test(message)) return 'Gemini rejected this Worker location. India is supported, so check the Google Cloud project billing and the Worker egress/IP region. If billing is already active, report the Worker IP to Google or use Vertex AI in a supported Cloud region.';
  if (/quota|rate.?limit|resource.?exhausted/i.test(message)) return 'Gemini quota was reached. Wait for the quota window or connect a paid/billed Gemini project.';
  if (/api key|unauthenticated|permission denied/i.test(message)) return 'Gemini credentials are invalid or do not have model access. Update GEMINI_API_KEY and confirm the project permissions.';
  return message;
};

function navigate(view) {
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  document.querySelectorAll('[data-view-panel]').forEach(panel => { panel.hidden = panel.dataset.viewPanel !== view; });
  const names = { dashboard: 'Dashboard', articles: 'Articles', writer: 'AI Writer', publish: 'Publish & Index', settings: 'Settings' };
  $('#page-title').textContent = names[view] || 'Dashboard';
  $('#app-view').classList.remove('menu-open');
}
const themeButton = document.createElement('button'); themeButton.type = 'button'; themeButton.className = 'theme-button'; themeButton.setAttribute('aria-label', 'Switch admin theme'); themeButton.innerHTML = '<span aria-hidden="true">◐</span><span>Theme</span>'; $('.topbar')?.append(themeButton);
const savedAdminTheme = localStorage.getItem('newsxphere-admin-theme') || 'night'; document.body.dataset.adminTheme = savedAdminTheme;
themeButton.addEventListener('click', () => { const next = document.body.dataset.adminTheme === 'night' ? 'paper' : 'night'; document.body.dataset.adminTheme = next; localStorage.setItem('newsxphere-admin-theme', next); });

async function checkSession() {
  try {
    const response = await api('/status');
    const status = await response.json();
    if (!status.authenticated) { $('#login-view').hidden = false; $('#app-view').hidden = true; return; }
    $('#login-view').hidden = true; $('#app-view').hidden = false;
    $('#gemini-status').textContent = status.gemini ? 'Ready' : 'Missing';
    if (status.geminiOAuth) { connectGeminiButton.textContent = 'Reconnect Google for Gemini'; geminiAccountStatus.textContent = 'Google account connected for Gemini API.'; }
    $('#github-status').textContent = status.github ? 'Ready' : 'Missing';
    $('#indexing-status').textContent = status.indexing ? 'Ready' : 'Missing';
    $('#worker-url').textContent = API_BASE;
    $('#repo-name').textContent = status.github ? 'Configured repository' : 'Not configured';
    await loadArticles();
    renderIndexActivity();
  } catch (error) { showNotice('Could not connect to the admin Worker.', true); }
}

async function repairIndexes() { const button = $('#repair-indexes'); if (button) { button.disabled = true; button.textContent = 'Verifying…'; } showNotice('Verifying articles, JSON, sitemap, and RSS feed…'); try { const response = await api('/repair-indexes', { method: 'POST' }); const data = await responseData(response); if (!response.ok || !data.ok) throw Error(data.error || 'Index repair failed.'); showNotice(`Indexes repaired: ${data.counts?.articles || 0} articles, ${data.counts?.sitemapUrls || 0} sitemap URLs, ${data.counts?.feedItems || 0} feed items.`); await loadArticles(); } catch (error) { showNotice(error.message || 'Index repair failed.', true); } finally { if (button) { button.disabled = false; button.textContent = 'Verify & Fix Indexes'; } } }
async function loadArticles() {
  try {
    const response = await api('/articles');
    const data = response.ok ? await response.json() : {};
    articleInventory = Array.isArray(data) ? { articles: data } : data;
    articles = Array.isArray(data) ? data : (Array.isArray(data.articles) ? data.articles : []);
  } catch { articles = []; articleInventory = null; }
  $('#article-count').textContent = articles.length || '0';
  let sourceNote = $('#article-source-note');
  if (!sourceNote) { sourceNote = document.createElement('p'); sourceNote.id = 'article-source-note'; sourceNote.className = 'muted small article-source-note'; $('#article-search')?.after(sourceNote); }
  const counts = articleInventory?.counts;
  sourceNote.textContent = counts ? `Loaded ${counts.pages} article pages directly from category folders${counts.missingFromCatalog ? ` · ${counts.missingFromCatalog} recovered outside allnewsdata.json` : ''}. Saving an article also repairs allnewsdata.json, sitemap.xml, and feed.xml.` : 'Loaded directly from the article source.';
  let repairButton = $('#repair-indexes'); if (!repairButton) { repairButton = document.createElement('button'); repairButton.id = 'repair-indexes'; repairButton.type = 'button'; repairButton.className = 'button'; repairButton.textContent = 'Verify & Fix Indexes'; sourceNote.before(repairButton); repairButton.addEventListener('click', repairIndexes); }
  renderArticles();
}

function renderArticles() {
  const query = ($('#article-search')?.value || '').toLowerCase();
  const list = articles.filter(article => JSON.stringify(article).toLowerCase().includes(query));
  $('#article-list').innerHTML = list.length ? list.map(article => {
    const title = article.title || article.headline || 'Untitled article';
    const url = article.url || article.href || '#';
    const path = article.sourcePath || `${String(url).replace(/^\//, '').replace(/\/$/, '')}/index.html`;
    const folderName = article.folderName || article.category || article.section || 'Unknown';
    const sourceLabel = article.source === 'category-page' ? 'GitHub folder · missing from JSON/XML' : article.source === 'catalog+category-page' ? 'GitHub folder · linked to JSON/XML' : 'JSON/XML catalog';
    const detail = `${folderName} · ${path}`;
    return `<div class="article-row"><a href="${escapeHtml(url)}" target="_blank" rel="noopener"><span><b>${escapeHtml(title)}</b><small>${escapeHtml(sourceLabel)}</small><small class="article-path">${escapeHtml(detail)}</small></span><span>↗</span></a><div class="article-actions"><button type="button" class="text-button" data-index-url="${escapeHtml(url)}">Index</button><button type="button" class="text-button" data-edit-path="${escapeHtml(path)}">Edit</button><button type="button" class="text-button danger" data-delete-id="${escapeHtml(article.id || article.slug)}" data-delete-path="${escapeHtml(path)}" data-delete-url="${escapeHtml(url)}">Delete</button></div></div>`;
  }).join('') : '<p class="muted">No articles found.</p>';
  document.querySelectorAll('[data-edit-path]').forEach(button => button.addEventListener('click', () => editArticle(button.dataset.editPath)));
  document.querySelectorAll('[data-delete-id]').forEach(button => button.addEventListener('click', () => deleteArticle(button.dataset.deleteId, button.dataset.deletePath, button.dataset.deleteUrl)));
  document.querySelectorAll('[data-index-url]').forEach(button => button.addEventListener('click', () => indexArticle(button.dataset.indexUrl, button)));
}

async function indexArticle(path, button) {
  const url = path.startsWith('http') ? path : `https://www.newsxphere.com${path}`;
  const original = button.textContent; button.disabled = true; button.textContent = '…'; showNotice(`Requesting indexing for ${url}…`);
  try { const response = await api('/index', { method: 'POST', body: JSON.stringify({ url }) }); const data = await responseData(response); if (!response.ok) throw Error(data.error || data.message || 'Google indexing request failed.'); recordIndex(url, 'success', data.message || 'Submitted'); button.textContent = 'Indexed'; showNotice(`Indexing request submitted successfully for ${url}`); } catch (error) { recordIndex(url, 'failed', error.message); button.textContent = original; showNotice(error.message || 'Indexing failed.', true); } finally { button.disabled = false; }
}

async function editArticle(path) {
  showNotice('Loading article editor…');
  try { const response = await api(`/article?path=${encodeURIComponent(path)}`); const data = await response.json(); if (!response.ok) throw Error(data.error || 'Article could not be loaded.'); generatedPage = null; generatedHtml = ''; const cleanPath = path.replace(/^\/+/, '').replace(/\/index\.html$/, '/'); const parts = cleanPath.split('/'); const normalizedContent = String(data.content).replace(/(?:\.\.\/)+public\//g, '/public/'); $('#github-form').dataset.originalPath = path; $('#github-form').dataset.originalContent = data.content; $('#publish-category').value = parts[0] || 'world'; $('#publish-slug').value = parts[1] || 'article'; syncPublishPath(); $('#github-form [name="content"]').value = normalizedContent; $('#github-form [name="message"]').value = 'Fix article image path'; const parsed = new DOMParser().parseFromString(normalizedContent, 'text/html'); const image = parsed.querySelector('.post-hero img'); $('#github-form').dataset.articleMeta = JSON.stringify({ title: parsed.querySelector('.post-title')?.textContent?.trim() || '', excerpt: parsed.querySelector('.post-dek')?.textContent?.trim() || '', author: parsed.querySelector('[itemprop="name"]')?.textContent?.trim() || '', category: parts[0] || 'world', slug: parts[1] || 'article', heroAlt: image?.getAttribute('alt') || '' }); const pageUrl = `https://www.newsxphere.com/${cleanPath}`; if (image?.getAttribute('src')) { const imageUrl = new URL(image.getAttribute('src'), pageUrl).href; previousImageBox.innerHTML = `<span>Previous hero image</span><img src="${escapeHtml(imageUrl)}" alt="Previous hero image" loading="lazy">`; previousImageBox.hidden = false; } else previousImageBox.hidden = true; navigate('publish'); showNotice(normalizedContent !== data.content ? 'The old image path was corrected to /public/. Submit to repair this article.' : 'Article loaded. Previous image is shown below; choose a new image if needed.'); } catch (error) { showNotice(error.message, true); }
}

async function deleteArticle(id, path, articleUrl) {
  if (!confirm(`Delete “${id}” from the website, cards list, sitemap, and feed? This cannot be undone.`)) return;
  showNotice('Deleting article and synchronizing indexes…');
  try { const response = await api('/delete', { method: 'POST', body: JSON.stringify({ id, path, url: articleUrl }) }); const data = await response.json(); if (!response.ok || !data.ok) throw Error(data.error || 'Delete failed.'); showNotice('Article deleted successfully.'); await loadArticles(); } catch (error) { showNotice(error.message, true); }
}

function textList(items) { return (Array.isArray(items) ? items : []).filter(Boolean).map(item => `<li>${escapeHtml(item)}</li>`).join(''); }
function safeVideoUrl(value) { try { const parsed = new URL(value); const host = parsed.hostname.replace(/^www\./, ''); if (host === 'youtube.com' || host === 'youtu.be') { const id = host === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v') || parsed.pathname.split('/').pop(); return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : ''; } if (host === 'vimeo.com') { const id = parsed.pathname.split('/').filter(Boolean).pop(); return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : ''; } return ''; } catch { return ''; } }
function renderSection(section) {
  const heading = section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : '';
  const paragraphs = (section.paragraphs || []).filter(Boolean).map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('');
  const list = section.list?.length ? `<ul class="checklist">${textList(section.list)}</ul>` : '';
  const quote = section.quote ? `<div class="pull-callout"><span class="quote-mark">“</span><div class="quote-body"><blockquote>${escapeHtml(section.quote)}</blockquote>${section.quoteAttribution ? `<cite>— ${escapeHtml(section.quoteAttribution)}</cite>` : ''}</div></div>` : '';
  const table = section.table?.headers?.length ? `<div class="spec-wrap"><table class="spec-table"><thead><tr>${section.table.headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${(section.table.rows || []).map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
  const videoUrl = safeVideoUrl(section.videoUrl); const video = videoUrl ? `<figure class="video-frame"><iframe src="${escapeHtml(videoUrl)}" title="Related video" loading="lazy" allowfullscreen></iframe></figure>` : '';
  return `${heading}${paragraphs}${list}${quote}${table}${video}`;
}

function generatedBody(page) {
  const intro = page.introduction ? `<p class="hook">${escapeHtml(page.introduction)}</p>` : '';
  const sections = (page.sections || []).map(renderSection).join('');
  const faq = page.faq?.length ? `<div class="faq-block"><span class="faq-kicker">Quick Answers</span>${page.faq.map((item, index) => `<details class="faq-item" ${index === 0 ? 'open' : ''}><summary>${escapeHtml(item.question)} <span class="toggle-icon">+</span></summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</div>` : '';
  return `${intro}${sections}${faq}`;
}

function setText(root, selector, value) { const node = root.querySelector(selector); if (node && value !== undefined && value !== null) node.textContent = value; return node; }
function setMeta(root, selector, value) { const node = root.querySelector(selector); if (node && value) node.setAttribute('content', value); }

async function buildPageFromTemplate(page) {
  const response = await api('/template');
  if (!response.ok) throw Error('The published NewsXphere article template is unavailable. Deploy the Worker and try again.');
  const source = await response.text();
  const doc = new DOMParser().parseFromString(source, 'text/html');
  doc.querySelectorAll('span').forEach(node => { if (node.textContent.trim() === 'Auto-filled from allnewsdata.json') node.remove(); });
  const category = page.category || page.section || 'News';
  const slug = slugify(page.slug || page.title);
  const canonical = `https://www.newsxphere.com/${slugify(category)}/${slug}/`;
  const heroExtension = page.heroImageUrl ? (page.heroImageExtension || 'jpg') : 'svg';
  const heroAsset = `/public/${slug}-hero.${heroExtension}`;
  doc.body.dataset.articleId = slug;
  const articleIdMeta = doc.querySelector('meta[name="newsxphere-article-id"]'); if (articleIdMeta) articleIdMeta.setAttribute('content', slug);
  const date = new Date().toISOString();
  doc.title = page.seoTitle || `${page.title} | NewsXphere`;
  setMeta(doc, 'meta[name="description"]', page.metaDescription || page.excerpt);
  setMeta(doc, 'meta[name="keywords"]', (page.keywords || []).join(', '));
  setMeta(doc, 'meta[property="og:title"]', page.title);
  setMeta(doc, 'meta[property="og:description"]', page.metaDescription || page.excerpt);
  setMeta(doc, 'meta[property="og:url"]', canonical);
  setMeta(doc, 'meta[property="og:image"]', `https://www.newsxphere.com${heroAsset}`);
  setMeta(doc, 'meta[name="twitter:creator"]', '@XtarNetCORP');
  setMeta(doc, 'meta[name="twitter:title"]', page.title);
  setMeta(doc, 'meta[name="twitter:description"]', page.metaDescription || page.excerpt);
  setMeta(doc, 'meta[name="twitter:image"]', `https://www.newsxphere.com${heroAsset}`);
  setMeta(doc, 'meta[property="article:section"]', category);
  setMeta(doc, 'meta[property="article:published_time"]', date);
  setMeta(doc, 'meta[property="article:modified_time"]', date);
  const alternate = doc.querySelector('link[hreflang="en"]'); if (alternate) alternate.href = canonical;
  const canonicalNode = doc.querySelector('link[rel="canonical"]'); if (canonicalNode) canonicalNode.href = canonical;
  setText(doc, '.post-tag', page.label || category.toUpperCase());
  setText(doc, '.post-title', page.title);
  setText(doc, '.post-dek', page.excerpt);
  setText(doc, '.byline [itemprop="name"]', page.author || 'Monu Sharma');
  setText(doc, '[itemprop="articleSection"]', category);
  const time = doc.querySelector('time[itemprop="datePublished"]');
  if (time) { time.setAttribute('datetime', date); time.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  const copy = doc.querySelector('.post-copy'); if (copy) copy.innerHTML = generatedBody(page);
  const hero = doc.querySelector('.post-hero img'); if (hero) { hero.src = heroAsset; hero.alt = page.heroAlt || `${page.title} — NewsXphere`; hero.title = page.title || ''; }
  const caption = doc.querySelectorAll('.post-hero figcaption span'); if (caption[0]) caption[0].textContent = page.heroCaption || `${category} visual analysis`; if (caption[1]) caption[1].textContent = 'NewsXphere Editorial Desk';
  const takeaways = (page.takeaways || []).filter(Boolean).slice(0, 4);
  const strip = doc.querySelector('.signal-strip');
  if (strip && takeaways.length) strip.innerHTML = takeaways.map((item, index) => `<div class="signal-card"><span class="ghost-index">0${index + 1}</span><span class="num">Key signal</span><p>${escapeHtml(item)}</p></div>`).join('');
  const sources = doc.querySelector('.article-sources');
  if (sources) {
    const sourceItems = (page.sources || []).filter(item => item?.url);
    sources.innerHTML = sourceItems.length ? `<h3 id="sources-heading">Sources and further reading</h3><p>Primary references and further reading used for this article.</p><ul>${sourceItems.map(item => `<li><a href="${escapeHtml(item.url)}" rel="noopener noreferrer">${escapeHtml(item.title || item.url)}</a></li>`).join('')}</ul>` : '';
    sources.hidden = !sourceItems.length;
  }
  const schema = doc.querySelector('script[type="application/ld+json"]');
  if (schema) { try { const data = JSON.parse(schema.textContent); const target = Array.isArray(data?.['@graph']) ? (data['@graph'].find(item => /NewsArticle/i.test(item?.['@type'] || '')) || data['@graph'][0]) : data; Object.assign(target, { headline: page.title, description: page.metaDescription || page.excerpt, datePublished: date, dateModified: date, articleSection: category, url: canonical, image: [`https://www.newsxphere.com${heroAsset}`], keywords: page.keywords || [] }); schema.textContent = JSON.stringify(data); } catch {} }
  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

$('#login-form').addEventListener('submit', async event => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); try { const response = await api('/login', { method: 'POST', body: JSON.stringify(body) }); const data = await responseData(response); if (!response.ok) { $('#login-error').textContent = data.error || 'Login failed. Check your credentials.'; return; } sessionToken = data.token || ''; if (sessionToken) sessionStorage.setItem('newsxphere-admin-token', sessionToken); $('#login-error').textContent = ''; await checkSession(); } catch { $('#login-error').textContent = 'The admin API could not be reached. Try again.'; } });
$('#logout').addEventListener('click', async () => { await api('/logout', { method: 'POST' }); sessionToken = ''; sessionStorage.removeItem('newsxphere-admin-token'); location.reload(); });
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.view)));
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.go)));
$('#mobile-menu').addEventListener('click', () => $('#app-view').classList.toggle('menu-open'));
$('#article-search').addEventListener('input', renderArticles);

$('#writer-form').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); body.source = body.instruction; body.angle = body.instruction; body.blocks = [...form.querySelectorAll('input[name="blocks"]:checked')].map(input => input.value); if (form.querySelector('input[name="autoBlocks"]')?.checked) body.blocks.unshift('auto-select'); if (body.customLength) body.length = `${body.customLength} words`; body.mode = 'page';
  $('#page-summary').textContent = 'Creating the full article using your existing NewsXphere page structure…'; $('#writer-output').hidden = true; $('#page-preview').hidden = true; showNotice('Generating a complete article page…');
  try { const response = await api('/generate', { method: 'POST', body: JSON.stringify(body) }); const raw = await response.text(); if (!response.ok) throw Error(raw || `Generation failed (${response.status})`); generatedPage = cleanJson(raw); generatedPage.slug = slugify(generatedPage.slug || generatedPage.title); await attachOpenImage(generatedPage); generatedHtml = await buildPageFromTemplate(generatedPage); $('#writer-output').textContent = generatedHtml; $('#writer-output').hidden = false; $('#page-summary').innerHTML = `<b>${escapeHtml(generatedPage.title)}</b><span>${escapeHtml(generatedPage.excerpt || '')}</span><small>${escapeHtml(generatedPage.category || body.category)} · ${escapeHtml(generatedPage.readTime || '')}${generatedPage.heroImageUrl ? ' · Open-license image attached' : ' · Branded cover attached'}</small>${generatedPage.alternativeHeadlines?.length ? `<small><b>Alternative headlines:</b> ${escapeHtml(generatedPage.alternativeHeadlines.join(' · '))}</small>` : ''}${generatedPage.hashtags?.length ? `<small><b>Hashtags:</b> ${escapeHtml(generatedPage.hashtags.join(' '))}</small>` : ''}${generatedPage.twitterThread?.length ? `<small><b>X thread:</b> ${escapeHtml(generatedPage.twitterThread.join(' · '))}</small>` : ''}${generatedPage.whyThisWillTrend ? `<small><b>Trend angle:</b> ${escapeHtml(generatedPage.whyThisWillTrend)}</small>` : ''}`; showNotice('Complete SEO article package generated. Preview it before publishing.'); } catch (error) { const message = explainGenerationError(error.message); $('#page-summary').textContent = message; showNotice(message, true); }
});
$('#preview-page').addEventListener('click', () => { if (!generatedHtml) return showNotice('Generate a page first.', true); const frame = $('#page-preview'); frame.srcdoc = generatedHtml.replace('<head>', '<head><base href="https://www.newsxphere.com/tech/agentic-ai-offline-models-replacing-cloud-2026/">'); frame.hidden = false; });
const changeImageButton = document.createElement('button'); changeImageButton.type = 'button'; changeImageButton.className = 'text-button'; changeImageButton.textContent = 'Change image'; $('#preview-page').before(changeImageButton);
changeImageButton.addEventListener('click', async () => { if (!generatedPage) return showNotice('Generate a page first.', true); changeImageButton.disabled = true; changeImageButton.textContent = 'Finding…'; generatedPage.heroImageUrl = ''; await attachOpenImage(generatedPage); generatedHtml = await buildPageFromTemplate(generatedPage); $('#writer-output').textContent = generatedHtml; changeImageButton.disabled = false; changeImageButton.textContent = 'Change image'; showNotice(generatedPage.heroImageUrl ? 'A new open-license image was selected.' : 'No suitable open-license image found; using a branded cover.'); });
const uploadLabel = document.createElement('label'); uploadLabel.innerHTML = 'Device hero image <input id="hero-upload" type="file" accept="image/avif,image/gif,image/jpeg,image/png,image/svg+xml,image/webp"><small class="muted">The file will be renamed with an SEO-friendly article filename and uploaded to public/.</small>'; $('#github-form').insertBefore(uploadLabel, $('#github-form button'));
$('#hero-upload').addEventListener('change', async event => { const file = event.target.files?.[0]; if (!file) { uploadedHero = null; return; } if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) { uploadedHero = null; event.target.value = ''; return showNotice('Choose an image smaller than 8 MB.', true); } const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, ''); uploadedHero = { base64: bytesToBase64(new Uint8Array(await file.arrayBuffer())), extension: ['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'].includes(extension) ? (extension === 'jpeg' ? 'jpg' : extension) : 'jpg' }; showNotice(`Image ready. It will be saved as an SEO filename in public/.`); });
const imageUrlLabel = document.createElement('label'); imageUrlLabel.innerHTML = 'Image URL from another source <input id="hero-image-url" type="url" placeholder="https://example.com/image.jpg"><small class="muted">Use only images you are allowed to republish. The Worker downloads and renames HTTPS images automatically.</small>'; $('#github-form').insertBefore(imageUrlLabel, $('#github-form button'));
const previousImageBox = document.createElement('div'); previousImageBox.className = 'previous-image-box'; previousImageBox.hidden = true; $('#github-form').insertBefore(previousImageBox, uploadLabel);
const categoryLabel = document.createElement('label'); categoryLabel.innerHTML = 'Article category<select id="publish-category" name="publishCategory"><option value="world">World</option><option value="tech">Tech</option><option value="startups">Startups</option><option value="culture">Culture</option><option value="business">Business</option><option value="science">Science</option></select>'; $('#github-form [name="path"]').closest('label').before(categoryLabel);
const slugLabel = document.createElement('label'); slugLabel.innerHTML = 'Article slug<input id="publish-slug" name="publishSlug" placeholder="generated-from-title" required><small class="muted">The public route is generated as category/slug/.</small>'; $('#github-form [name="path"]').closest('label').before(slugLabel);
const syncPublishPath = () => { const category = slugify($('#publish-category').value); const slug = slugify($('#publish-slug').value); $('#github-form [name="path"]').value = `${category}/${slug}/`; $('#index-form [name="url"]').value = `https://www.newsxphere.com/${category}/${slug}/`; };
$('#publish-category').addEventListener('change', syncPublishPath); $('#publish-slug').addEventListener('input', syncPublishPath); $('#github-form [name="path"]').readOnly = true; $('#github-form [name="path"]').placeholder = 'world/my-story/';
$('#use-page').addEventListener('click', () => { if (!generatedPage || !generatedHtml) return showNotice('Generate a page first.', true); $('#publish-category').value = slugify(generatedPage.category || 'news'); $('#publish-slug').value = slugify(generatedPage.slug || generatedPage.title); syncPublishPath(); $('#github-form [name="content"]').value = generatedHtml; $('#github-form').dataset.originalPath = ''; $('#github-form').dataset.originalContent = ''; navigate('publish'); showNotice('Page loaded into Publish & Index.'); });
const articleIndexPath = value => { const path = String(value || '').trim(); if (/\/index\.html$/i.test(path)) return path; return `${path.replace(/\/+$/, '')}/index.html`; };
$('#github-form').addEventListener('submit', async event => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); syncPublishPath(); const newPath = body.path; const originalPath = form.dataset.originalPath || ''; const originalContent = form.dataset.originalContent || ''; const result = $('#github-result'); if (originalPath && originalContent === body.content && originalPath.replace(/^\/+/, '').replace(/\/index\.html$/, '/') === newPath) { result.textContent = 'No changes detected. Nothing was sent to the API.'; showNotice('No changes detected.', false); return; } result.textContent = 'Publishing article, image, cards data, sitemap, and feed…'; try { let response; if (generatedPage && generatedHtml) { const slug = slugify(generatedPage.slug || generatedPage.title); const category = slugify(generatedPage.category || 'news'); const externalImage = $('#hero-image-url').value.trim(); if (uploadedHero) { generatedPage.heroImageUrl = ''; generatedPage.heroImageExtension = uploadedHero.extension; generatedHtml = await buildPageFromTemplate(generatedPage); } else if (externalImage) { if (!/^https:\/\//i.test(externalImage)) throw Error('Image URL must start with HTTPS.'); generatedPage.heroImageUrl = externalImage; generatedPage.heroImageExtension = /\.png(?:\?|$)/i.test(externalImage) ? 'png' : /\.webp(?:\?|$)/i.test(externalImage) ? 'webp' : 'jpg'; generatedPage.heroImageSource = externalImage; generatedHtml = await buildPageFromTemplate(generatedPage); } const extension = uploadedHero ? uploadedHero.extension : (generatedPage.heroImageUrl ? (generatedPage.heroImageExtension || 'jpg') : 'svg'); const assetPath = `public/${slug}-hero.${extension}`; response = await api('/publish', { method: 'POST', body: JSON.stringify({ articlePath: newPath, articleContent: generatedHtml, assetPath, assetContent: uploadedHero || generatedPage.heroImageUrl ? '' : coverSvg(generatedPage), uploadedImageBase64: uploadedHero?.base64 || '', sourceImageUrl: uploadedHero ? '' : (generatedPage.heroImageUrl || ''), article: generatedPage }) }); } else if (originalPath && originalPath.replace(/^\/+/, '').replace(/\/index\.html$/, '/') !== newPath) { response = await api('/move', { method: 'POST', body: JSON.stringify({ oldPath: originalPath, newPath, content: body.content, id: form.dataset.originalPath.split('/')[1]?.replace(/\/index\.html$/, ''), oldUrl: `/${form.dataset.originalPath.replace(/^\/+/, '').replace(/\/index\.html$/, '')}/` }) }); } else response = await api('/github/commit', { method: 'POST', body: JSON.stringify({ path: articleIndexPath(newPath), message: body.message, content: body.content }) }); const message = await response.text(); if (!response.ok) throw Error(`Publish failed: ${message}`); result.textContent = generatedPage ? 'Published article and SEO-renamed hero image, then updated cards, sitemap, and feed.' : originalPath ? 'Article updated successfully.' : 'Published successfully.'; form.dataset.originalPath = newPath; form.dataset.originalContent = body.content; } catch (error) { result.textContent = error.message || 'Publish failed.'; } });
$('#index-form').addEventListener('submit', async event => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); const result = $('#index-result'); result.textContent = 'Submitting…'; const response = await api('/index', { method: 'POST', body: JSON.stringify(body) }); const data = await responseData(response); if (response.ok) { recordIndex(body.url, 'success', data.message || 'Submitted'); result.textContent = 'Indexing request submitted successfully.'; } else { recordIndex(body.url, 'failed', data.error || 'Indexing failed'); result.textContent = `Indexing failed: ${data.error || 'Unknown error'}`; } });
checkSession();

/* Keep the selected publish category authoritative and handle image replacement
   when an existing article is being edited. */
document.addEventListener('change', async event => {
  if (event.target?.id !== 'publish-category' || !generatedPage || !generatedHtml) return;
  generatedPage.category = event.target.value;
  generatedPage.section = event.target.value;
  try { generatedHtml = await buildPageFromTemplate(generatedPage); $('#github-form [name="content"]').value = generatedHtml; } catch (error) { showNotice(error.message || 'Could not rebuild the article for this category.', true); }
}, true);

document.addEventListener('submit', async event => {
  const form = event.target;
  if (!form || form.id !== 'github-form') return;
  const originalPath = form.dataset.originalPath || '';
  const uploaded = uploadedHero;
  const externalImage = $('#hero-image-url')?.value.trim() || '';
  if (!originalPath || (!uploaded && !externalImage)) {
    if (generatedPage && $('#publish-category')) generatedPage.category = $('#publish-category').value;
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  syncPublishPath();
  const body = Object.fromEntries(new FormData(form));
  const newPath = body.path;
  const slug = slugify($('#publish-slug').value);
  const extension = uploaded ? uploaded.extension : (/\.png(?:\?|$)/i.test(externalImage) ? 'png' : /\.webp(?:\?|$)/i.test(externalImage) ? 'webp' : 'jpg');
  const assetPath = `public/${slug}-hero.${extension}`;
  const doc = new DOMParser().parseFromString(body.content, 'text/html');
  const image = doc.querySelector('.post-hero img, [itemprop="image"], main img');
  const result = $('#github-result');
  if (!image) { showNotice('This article has no hero image element to update.', true); return; }
  image.src = `/${assetPath}`;
  body.content = `<!doctype html>\n${doc.documentElement.outerHTML}`;
  result.textContent = 'Uploading image and updating the article…';
  try {
    const meta = JSON.parse(form.dataset.articleMeta || '{}');
    const response = await api('/publish', { method: 'POST', body: JSON.stringify({ articlePath: newPath, articleContent: body.content, assetPath, assetContent: '', uploadedImageBase64: uploaded?.base64 || '', sourceImageUrl: uploaded ? '' : externalImage, article: { ...meta, title: meta.title || slug, slug, category: $('#publish-category').value, heroAlt: image.alt || meta.heroAlt || meta.title || slug, heroImageSource: externalImage } }) });
    if (!response.ok) throw Error(`Image update failed: ${await response.text()}`);
    const routeChanged = originalPath.replace(/^\/+/, '').replace(/\/index\.html$/, '/') !== newPath;
    if (routeChanged) {
      const moved = await api('/move', { method: 'POST', body: JSON.stringify({ oldPath: originalPath, newPath, content: body.content, id: slug, oldUrl: `/${originalPath.replace(/^\/+/, '').replace(/\/index\.html$/, '')}/` }) });
      if (!moved.ok) throw Error(`Article route update failed: ${await moved.text()}`);
    }
    form.dataset.originalPath = newPath;
    form.dataset.originalContent = body.content;
    form.querySelector('[name="content"]').value = body.content;
    uploadedHero = null;
    result.textContent = 'New image uploaded and connected to the article successfully.';
    showNotice('Image updated successfully. The article, cards, sitemap, and feed were synchronized.');
  } catch (error) { result.textContent = error.message || 'Image update failed.'; showNotice(result.textContent, true); }
}, true);
