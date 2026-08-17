const root = document.documentElement;
const body = document.body;
const topics = [...document.querySelectorAll('.topic')].filter(el => el.tagName === 'BUTTON');
const cards = [...document.querySelectorAll('.story-card')];
const searchPanel = document.querySelector('#search-panel');
const search = document.querySelector('#site-search');
const searchSuggestions = document.querySelector('#search-suggestions');
const searchResults = document.querySelector('#search-results');
const searchHint = document.querySelector('#search-hint');
const savedDrawer = document.querySelector('#saved-drawer');
const toast = document.querySelector('#toast');
const savedData = {
    startup: {
        topic: 'Startups',
        title: 'The anti-hustle startup is having a moment'
    },
    ai: {
        topic: 'Technology',
        title: 'AI\'s best feature might be making room for better questions'
    },
    city: {
        topic: 'Culture',
        title: 'What happens when a city leaves room for the unplanned?'
    }
};
const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout( () => toast.classList.remove('show'), 2400)
}
;
const openSearch = () => {
    if (!searchPanel.hidden && document.body.classList.contains('search-open')) {
        closeSearch();
        return;
    }
    if (searchPanel) searchPanel.hidden = false;
    document.body.classList.add('search-open');
    const hdr = document.querySelector('.site-header');
    if (hdr) hdr.classList.remove('is-hidden');
    document.querySelector('#search-trigger').setAttribute('aria-expanded', 'true');
    renderSearchState(search.value);
}
;
const closeSearch = () => {
    if (searchPanel) searchPanel.hidden = true;
    document.body.classList.remove('search-open');
    document.body.classList.remove('search-dropdown-open');
    document.querySelector('#search-trigger').setAttribute('aria-expanded', 'false');
}
;
function renderSearchState(value='') {
    const query = value.trim().toLowerCase();
    const active = document.querySelector('.topic.active')?.dataset.topic || 'All';
    const matches = cards.filter(card => {
        const matchTopic = active === 'All' || card.dataset.topic === active;
        const matchSearch = !query || card.dataset.search.includes(query) || card.textContent.toLowerCase().includes(query);
        return matchTopic && matchSearch;
    });
    const hasQuery = query.length > 0;
    searchSuggestions.hidden = hasQuery;
    searchResults.hidden = !hasQuery;
    searchHint.textContent = hasQuery ? 'Matching stories and recent signals' : 'Recent searches and trending signals';
    if (hasQuery) {
        searchResults.innerHTML = matches.length ? matches.map(card => {
            const title = card.querySelector('h3, h4')?.textContent || 'Story';
            const topic = card.dataset.topic || 'Signal';
            return `<button type="button" class="result-item"><small>${topic}</small><strong>${title}</strong></button>`;
        }).join('') : '<p class="result-empty">No stories match that search yet. Try another signal.</p>';
    } else {
        searchResults.innerHTML = '';
    }
}
document.querySelector('#search-trigger')?.addEventListener('click', openSearch);
document.querySelector('#hero-search')?.addEventListener('click', openSearch);
document.querySelector('#close-search')?.addEventListener('click', closeSearch);
function filterStories(value=search ? search.value : '') {
    if (!cards.length) {
        if (document.querySelector('#search-result-count')) {
            document.querySelector('#search-result-count').textContent = '0 stories';
        }
        if (typeof renderSearchState === 'function') renderSearchState(value);
        return;
    }
    const query = (value || '').trim().toLowerCase();
    const active = document.querySelector('.topic.active')?.dataset.topic || 'All';
    let visible = 0;
    cards.forEach(card => {
        const matchTopic = active === 'All' || card.dataset.topic === active;
        const matchSearch = !query || (card.dataset.search && card.dataset.search.includes(query)) || card.textContent.toLowerCase().includes(query);
        card.hidden = !(matchTopic && matchSearch);
        if (matchTopic && matchSearch) visible++;
    });
    const status = document.querySelector('#result-status');
    if (status) status.textContent = `${visible} ${visible === 1 ? 'story' : 'stories'}`;
    const countEl = document.querySelector('#search-result-count');
    if (countEl) countEl.textContent = `${visible} ${visible === 1 ? 'story' : 'stories'}`;
    const empty = document.querySelector('#empty-state');
    if (empty) empty.hidden = visible > 0;
    renderSearchState(value);
}
search.addEventListener('input', () => {
    document.body.classList.add('search-dropdown-open');
    filterStories()
});
search.addEventListener('focus', () => {
    document.body.classList.add('search-dropdown-open');
    renderSearchState(search.value)
});
topics.forEach(topic => topic.addEventListener('click', () => {
    topics.forEach(item => item.classList.remove('active'));
    topic.classList.add('active');
    filterStories();
    document.querySelector('#primary-nav').classList.remove('open');
    document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false')
}
));
document.querySelector('#menu-toggle')?.addEventListener('click', () => {
    const nav = document.querySelector('#primary-nav');
    const open = nav.classList.toggle('open');
    document.querySelector('#menu-toggle').setAttribute('aria-expanded', String(open))
}
);
function updateSaved() {
    const saved = Object.keys(savedData).filter(key => localStorage.getItem(`newsxphere-save-${key}`) === 'true');
    document.querySelector('#saved-count').textContent = saved.length;
    const list = document.querySelector('#saved-list');
    list.innerHTML = saved.length ? saved.map(key => `<article class="saved-item"><small>${savedData[key].topic}</small><h3>${savedData[key].title}</h3></article>`).join('') : '<p class="saved-empty">No saved stories yet. Tap the heart on a story to keep it close.</p>'
}
document.querySelectorAll('.save-button').forEach(button => {
    const key = button.dataset.save;
    const storageKey = `newsxphere-save-${key}`;
    const sync = () => {
        const saved = localStorage.getItem(storageKey) === 'true';
        button.classList.toggle('saved', saved);
        button.textContent = saved ? '♥' : '♡';
        button.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} story: ${savedData[key].title}`)
    }
    ;
    sync();
    button.addEventListener('click', () => {
        localStorage.setItem(storageKey, String(localStorage.getItem(storageKey) !== 'true'));
        sync();
        updateSaved();
        showToast(localStorage.getItem(storageKey) === 'true' ? 'Story saved to your reading list' : 'Story removed from your reading list')
    }
    )
}
);
updateSaved();
document.querySelector('#saved-toggle')?.addEventListener('click', () => {
    savedDrawer.classList.add('open');
    savedDrawer.setAttribute('aria-hidden', 'false');
    updateSaved()
}
);
document.querySelector('#close-saved')?.addEventListener('click', () => {
    savedDrawer.classList.remove('open');
    savedDrawer.setAttribute('aria-hidden', 'true')
}
);
document.querySelector('#theme-toggle')?.addEventListener('click', () => {
    const dim = root.dataset.theme !== 'dim';
    root.dataset.theme = dim ? 'dim' : 'paper';
    const themeToggle = document.querySelector('#theme-toggle');
    themeToggle.setAttribute('aria-label', dim ? 'Switch to paper theme' : 'Switch to dim theme');
    themeToggle.querySelector('.theme-toggle-label').textContent = dim ? 'Light' : 'Dark';
    document.querySelector('meta[name="theme-color"]').content = dim ? '#142322' : '#f4efe6';
    localStorage.setItem('newsxphere-theme', root.dataset.theme);
    showToast(dim ? 'Dim reading theme on' : 'Paper reading theme on')
}
);
if (localStorage.getItem('newsxphere-theme') === 'dim') {
    root.dataset.theme = 'dim';
    document.querySelector('#theme-toggle').setAttribute('aria-label', 'Switch to paper theme');
    document.querySelector('#theme-toggle .theme-toggle-label').textContent = 'Light';
    document.querySelector('meta[name="theme-color"]').content = '#142322'
}
document.querySelector('#reading-mode')?.addEventListener('click', event => {
    const on = body.classList.toggle('reading-mode');
    event.currentTarget.textContent = on ? 'Exit reader' : 'Reader';
    localStorage.setItem('newsxphere-reader', String(on));
    showToast(on ? 'Reader mode on' : 'Reader mode off')
}
);
if (localStorage.getItem('newsxphere-reader') === 'true') {
    body.classList.add('reading-mode');
    document.querySelector('#reading-mode').textContent = 'Exit reader'
}
document.querySelectorAll('[data-read]').forEach(button => button.addEventListener('click', () => {
    body.classList.add('reading-mode');
    document.querySelector('#reading-mode').textContent = 'Exit reader';
    showToast('Reader mode on');
    window.scrollTo({
        top: document.querySelector('.feature').offsetTop - 20,
        behavior: 'smooth'
    })
}
));
document.querySelector('#briefing-form')?.addEventListener('submit', event => {
    event.preventDefault();
    document.querySelector('#form-note').textContent = 'You are on the list. Watch your inbox for Friday\'s signal.';
    event.currentTarget.querySelector('button').innerHTML = 'You\'re in <span>→</span>';
    showToast('Welcome to the NewsXphere Briefing')
}
);
document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchPanel.hidden ? openSearch() : search.focus()
    }
    if (event.key === 'Escape') {
        if (!searchPanel.hidden)
            closeSearch();
        if (savedDrawer.classList.contains('open'))
            document.querySelector('#close-saved').click()
    }
}
);
document.querySelector('#search-refresh')?.addEventListener('click', () => {
    search.value = '';
    filterStories('');
    search.focus();
    showToast('Search refreshed')
});
document.querySelector('#search-suggestions')?.addEventListener('click', event => {
    const button = event.target.closest('.suggestion-item');
    if (!button)
        return;
    search.value = button.textContent.trim();
    filterStories(search.value);
    closeSearch()
});
document.querySelector('#search-results')?.addEventListener('click', event => {
    const button = event.target.closest('.result-item');
    if (!button)
        return;
    closeSearch()
});
filterStories();


/* ========== YouTube-style header hide / show (always fixed — no glitch) ========== */
(function () {
    const header = document.querySelector('.site-header');
    if (!header) return;

    // Spacer keeps content from sitting under the fixed header
    let spacer = document.querySelector('.header-spacer');
    if (!spacer) {
        spacer = document.createElement('div');
        spacer.className = 'header-spacer';
        spacer.setAttribute('aria-hidden', 'true');
        // Place spacer where header used to sit in flow (before header's next sibling logic)
        if (header.nextSibling) {
            header.parentNode.insertBefore(spacer, header.nextSibling);
        } else {
            header.parentNode.appendChild(spacer);
        }
    }

    function syncSpacer() {
        // header height + top offset
        const top = parseFloat(getComputedStyle(header).top) || 12;
        spacer.style.height = (header.offsetHeight + top + 8) + 'px';
    }

    let lastY = window.scrollY || 0;
    let hidden = false;
    let ticking = false;
    const DELTA = 8;
    const TOP_SHOW = 40; // always show near very top

    function hide() {
        if (hidden) return;
        header.classList.add('is-hidden');
        hidden = true;
    }

    function show() {
        if (!hidden) return;
        header.classList.remove('is-hidden');
        hidden = false;
    }

    function onScroll() {
        const y = window.scrollY || window.pageYOffset || 0;
        const dy = y - lastY;

        if (y <= TOP_SHOW) {
            show();
            lastY = y;
            ticking = false;
            return;
        }

        if (Math.abs(dy) >= DELTA) {
            if (dy > 0) {
                // scrolling down → hide
                hide();
            } else {
                // scrolling up → show
                show();
            }
            lastY = y;
        }

        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener('resize', syncSpacer, { passive: true });

    // Initial layout
    syncSpacer();
    // Re-measure after fonts/layout settle
    requestAnimationFrame(syncSpacer);
    setTimeout(syncSpacer, 100);
    setTimeout(syncSpacer, 400);

    // Keep header visible when search opens
    const openSearchBtn = document.querySelector('#search-trigger');
    if (openSearchBtn) {
        openSearchBtn.addEventListener('click', function () {
            show();
        });
    }
})();





