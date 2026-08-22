const root = document.documentElement;
const body = document.body;
const articleDataUrl = '/allnewsdata.json';

const storyGrid = document.querySelector('#story-grid');
const relatedGrid = document.querySelector('#related-story-grid');
const topics = [...document.querySelectorAll('.topic')].filter(el => el.tagName === 'BUTTON');
const searchPanel = document.querySelector('#search-panel');
const search = document.querySelector('#site-search');
const searchSuggestions = document.querySelector('#search-suggestions');
const searchResults = document.querySelector('#search-results');
const searchHint = document.querySelector('#search-hint');
const savedDrawer = document.querySelector('#saved-drawer');
const toast = document.querySelector('#toast');
const themeToggle = document.querySelector('#theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const menuToggle = document.querySelector('#menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const dateEl = document.querySelector('#live-date');
const timeEl = document.querySelector('#live-time');
const desktopWeather = document.querySelector('#desktop-weather');
const desktopWeatherIcon = document.querySelector('#desktop-weather-icon');
const desktopWeatherTemp = document.querySelector('#desktop-weather-temp');
const mobileWeather = document.querySelector('#mobile-weather');
const mobileWeatherIcon = document.querySelector('#mobile-weather-icon');
const mobileWeatherTemp = document.querySelector('#mobile-weather-temp');
const desktopWeatherPopover = document.querySelector('#desktop-weather-popover');
const mobileWeatherPopover = document.querySelector('#mobile-weather-popover');
const weatherCloseButtons = [...document.querySelectorAll('[data-weather-close]')];
const desktopWeatherPopoverIcon = document.querySelector('#desktop-weather-popover-icon');
const desktopWeatherPopoverTemp = document.querySelector('#desktop-weather-popover-temp');
const desktopWeatherPopoverPlace = document.querySelector('#desktop-weather-popover-place');
const desktopWeatherPopoverMeta = document.querySelector('#desktop-weather-popover-meta');
const desktopWeatherPopoverHumidity = document.querySelector('#desktop-weather-popover-humidity');
const desktopWeatherPopoverWind = document.querySelector('#desktop-weather-popover-wind');
const desktopWeatherPopoverRain = document.querySelector('#desktop-weather-popover-rain');
const desktopWeatherPopoverChart = document.querySelector('#desktop-weather-popover-chart');
const desktopWeatherPopoverForecast = document.querySelector('#desktop-weather-popover-forecast');
const desktopWeatherPopoverHi = document.querySelector('#desktop-weather-popover-hi');
const desktopWeatherPopoverLo = document.querySelector('#desktop-weather-popover-lo');
const desktopWeatherPopoverDay = document.querySelector('#desktop-weather-popover-day');
const mobileWeatherPopoverIcon = document.querySelector('#mobile-weather-popover-icon');
const mobileWeatherPopoverTemp = document.querySelector('#mobile-weather-popover-temp');
const mobileWeatherPopoverPlace = document.querySelector('#mobile-weather-popover-place');
const mobileWeatherPopoverMeta = document.querySelector('#mobile-weather-popover-meta');
const mobileWeatherPopoverHumidity = document.querySelector('#mobile-weather-popover-humidity');
const mobileWeatherPopoverWind = document.querySelector('#mobile-weather-popover-wind');
const mobileWeatherPopoverRain = document.querySelector('#mobile-weather-popover-rain');
const mobileWeatherPopoverChart = document.querySelector('#mobile-weather-popover-chart');
const mobileWeatherPopoverForecast = document.querySelector('#mobile-weather-popover-forecast');
const mobileWeatherPopoverHi = document.querySelector('#mobile-weather-popover-hi');
const mobileWeatherPopoverLo = document.querySelector('#mobile-weather-popover-lo');
const mobileWeatherPopoverDay = document.querySelector('#mobile-weather-popover-day');
const weatherTabs = [...document.querySelectorAll('.weather-tab')];

let articles = [];
let visibleArticles = [];
let weatherSnapshot = null;
let activeWeatherMode = 'temperature';
let selectedWeatherDay = 0;

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[char]));

const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
};

const getPreferredTheme = () => localStorage.getItem('newsxphere-theme') || 'paper';

const applyTheme = (theme) => {
    const nextTheme = theme === 'dim' ? 'dim' : 'paper';
    root.dataset.theme = nextTheme;
    localStorage.setItem('newsxphere-theme', nextTheme);
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', nextTheme === 'dim' ? 'Switch to paper theme' : 'Switch to dark theme');
        const label = themeToggle.querySelector('.theme-toggle-label');
        if (label) label.textContent = nextTheme === 'dim' ? 'Light' : 'Dark';
    }
    if (themeMeta) themeMeta.content = nextTheme === 'dim' ? '#142322' : '#f4efe6';
};

const updateLiveClock = () => {
    const now = new Date();
    const resolvedZone = 'Asia/Kolkata';
    const locale = navigator.language || 'en-US';
    const dateText = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: resolvedZone
    }).format(now);
    const timeText = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: resolvedZone
    }).format(now);

    if (dateEl) dateEl.textContent = dateText;
    if (timeEl) timeEl.textContent = timeText;
};

const weatherLabelForCode = (code = 0) => {
    if (code === 0) return 'Clear sky';
    if ([1, 2].includes(code)) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if ([45, 48].includes(code)) return 'Foggy';
    if ([51, 53, 55].includes(code)) return 'Light drizzle';
    if ([61, 63, 65].includes(code)) return 'Rain';
    if ([71, 73, 75].includes(code)) return 'Snow';
    if ([80, 81, 82].includes(code)) return 'Showers';
    if ([95, 96, 99].includes(code)) return 'Thunderstorm';
    return 'Stable';
};

const formatHour = (value) => new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(value));
const formatDay = (value) => new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(value));

const renderWeatherChart = (container, hourly, mode = 'temperature') => {
    if (!container) return;
    const temps = hourly?.temperature_2m || [];
    const precip = hourly?.precipitation_probability || [];
    const wind = hourly?.wind_speed_10m || hourly?.windspeed_10m || [];
    const times = hourly?.time || [];
    const source = mode === 'precipitation' ? precip : mode === 'wind' ? wind : temps;
    const points = source.slice(0, 8);
    if (!points.length) {
        container.innerHTML = '';
        return;
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = Math.max(max - min, 1);
    const suffix = mode === 'precipitation' ? '%' : mode === 'wind' ? ' km/h' : '°';
    container.innerHTML = points.map((temp, index) => {
        const pct = 18 + ((temp - min) / range) * 64;
        const label = times[index] ? formatHour(times[index]) : '';
        return `<div class="weather-chart-point"><span style="bottom:${pct}%">${Math.round(temp)}${suffix}</span><i></i><small>${label}</small></div>`;
    }).join('');
};

const renderWeatherForecast = (container, daily) => {
    if (!container) return;
    const times = daily?.time || [];
    const maxes = daily?.temperature_2m_max || [];
    const mins = daily?.temperature_2m_min || [];
    const codes = daily?.weather_code || daily?.weathercode || [];
    const items = times.slice(0, 6);
    container.innerHTML = items.map((time, index) => `
        <button type="button" class="weather-forecast-pill ${index === selectedWeatherDay ? 'is-active' : ''}" data-weather-day="${index}">
            <span>${index === 0 ? 'Today' : formatDay(time)}</span>
            <b>${weatherIconForCode(codes[index] ?? 0)}</b>
            <small>${Math.round(maxes[index] ?? 0)}° ${Math.round(mins[index] ?? 0)}°</small>
        </button>
    `).join('');
};

const weatherIconForCode = (code = 0) => {
    if (code === 0) return '☀';
    if ([1, 2].includes(code)) return '⛅';
    if (code === 3) return '☁';
    if ([45, 48].includes(code)) return '🌫';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧';
    if ([71, 73, 75].includes(code)) return '❄';
    if ([95, 96, 99].includes(code)) return '⛈';
    return '●';
};

const syncWeatherTabs = () => {
    weatherTabs.forEach(tab => {
        tab.classList.toggle('is-active', tab.dataset.weatherTab === activeWeatherMode);
    });
};

const setWeatherMode = (mode) => {
    activeWeatherMode = mode;
    syncWeatherTabs();
    [desktopWeatherPopover, mobileWeatherPopover].forEach(panel => {
        if (!panel) return;
        panel.classList.toggle('is-precipitation', activeWeatherMode === 'precipitation');
        panel.classList.toggle('is-wind', activeWeatherMode === 'wind');
    });
    if (!weatherSnapshot) return;
    renderWeatherChart(desktopWeatherPopoverChart, weatherSnapshot.hourly, activeWeatherMode);
    renderWeatherChart(mobileWeatherPopoverChart, weatherSnapshot.hourly, activeWeatherMode);
};

const setSelectedWeatherDay = (dayIndex = 0) => {
    selectedWeatherDay = dayIndex;
    const panels = [
        [desktopWeatherPopoverForecast, desktopWeatherPopoverHi, desktopWeatherPopoverLo, desktopWeatherPopoverDay, desktopWeatherPopoverMeta],
        [mobileWeatherPopoverForecast, mobileWeatherPopoverHi, mobileWeatherPopoverLo, mobileWeatherPopoverDay, mobileWeatherPopoverMeta]
    ];
    if (!weatherSnapshot?.daily) return;
    const { daily } = weatherSnapshot;
    const times = daily.time || [];
    const maxes = daily.temperature_2m_max || [];
    const mins = daily.temperature_2m_min || [];
    const codes = daily.weather_code || daily.weathercode || [];
    const idx = Math.max(0, Math.min(dayIndex, times.length - 1));
    const label = idx === 0 ? 'Today' : formatDay(times[idx]);
    const hi = Number.isFinite(maxes[idx]) ? `H ${Math.round(maxes[idx])}°` : 'H --°';
    const lo = Number.isFinite(mins[idx]) ? `L ${Math.round(mins[idx])}°` : 'L --°';
    const condition = weatherLabelForCode(codes[idx] ?? 0);

    [desktopWeatherPopoverHi, mobileWeatherPopoverHi].forEach(el => { if (el) el.textContent = hi; });
    [desktopWeatherPopoverLo, mobileWeatherPopoverLo].forEach(el => { if (el) el.textContent = lo; });
    [desktopWeatherPopoverDay, mobileWeatherPopoverDay].forEach(el => { if (el) el.textContent = label; });
    [desktopWeatherPopoverMeta, mobileWeatherPopoverMeta].forEach(el => { if (el) el.textContent = condition; });

    panels.forEach(([forecastEl]) => {
        if (!forecastEl) return;
        forecastEl.querySelectorAll('.weather-forecast-pill').forEach((btn, index) => {
            btn.classList.toggle('is-active', index === idx);
        });
    });
};

const updateHeaderWeather = async () => {
    if (!desktopWeather && !mobileWeather) return;

    try {
        const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-store' });
        if (!geoRes.ok) throw new Error('Geo lookup failed');
        const geo = await geoRes.json();
        const lat = Number(geo.latitude);
        const lon = Number(geo.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Invalid coordinates');

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max&timezone=auto`, { cache: 'no-store' });
        if (!weatherRes.ok) throw new Error('Weather lookup failed');
        const weather = await weatherRes.json();
        const temp = weather?.current_weather?.temperature;
        const code = weather?.current_weather?.weather_code ?? weather?.current_weather?.weathercode;
        const daily = weather?.daily || {};
        const hourly = weather?.hourly || {};

        const tempText = Number.isFinite(temp) ? `${Math.round(temp)}°` : '--°';
        const iconText = weatherIconForCode(code);
        const place = geo.city ? [geo.city, geo.region || geo.country || ''].filter(Boolean).join(', ') : 'Current location';
        const condition = weatherLabelForCode(code);
        const hi = Number.isFinite(daily.temperature_2m_max?.[0]) ? `H ${Math.round(daily.temperature_2m_max[0])}°` : 'H --°';
        const lo = Number.isFinite(daily.temperature_2m_min?.[0]) ? `L ${Math.round(daily.temperature_2m_min[0])}°` : 'L --°';
        const dayLabel = daily.time?.[0] ? new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(daily.time[0])) : 'Today';
        const humidity = hourly.precipitation_probability?.[0];
        const wind = hourly.wind_speed_10m?.[0] ?? hourly.windspeed_10m?.[0];
        const rain = daily.precipitation_probability_max?.[0];
        weatherSnapshot = { tempText, iconText, place, condition, hi, lo, dayLabel, humidity, wind, rain, hourly, daily };

        [desktopWeatherTemp, mobileWeatherTemp].forEach(el => {
            if (el) el.textContent = tempText;
        });
        [desktopWeatherIcon, mobileWeatherIcon].forEach(el => {
            if (el) el.textContent = iconText;
        });
        const title = geo.city ? `${geo.city}, ${geo.region || geo.country || ''}`.trim() : 'Current weather';
        if (desktopWeather) desktopWeather.title = title;
        if (mobileWeather) mobileWeather.title = title;

        [
            [desktopWeatherPopoverIcon, desktopWeatherPopoverTemp, desktopWeatherPopoverPlace, desktopWeatherPopoverMeta, desktopWeatherPopoverHi, desktopWeatherPopoverLo, desktopWeatherPopoverDay, desktopWeatherPopoverHumidity, desktopWeatherPopoverWind, desktopWeatherPopoverRain, desktopWeatherPopoverChart, desktopWeatherPopoverForecast],
            [mobileWeatherPopoverIcon, mobileWeatherPopoverTemp, mobileWeatherPopoverPlace, mobileWeatherPopoverMeta, mobileWeatherPopoverHi, mobileWeatherPopoverLo, mobileWeatherPopoverDay, mobileWeatherPopoverHumidity, mobileWeatherPopoverWind, mobileWeatherPopoverRain, mobileWeatherPopoverChart, mobileWeatherPopoverForecast]
        ].forEach(([iconEl, tempEl, placeEl, metaEl, hiEl, loEl, dayEl, humidityEl, windEl, rainEl, chartEl, forecastEl]) => {
            if (iconEl) iconEl.textContent = iconText;
            if (tempEl) tempEl.textContent = tempText;
            if (placeEl) placeEl.textContent = place;
            if (metaEl) metaEl.textContent = condition;
            if (hiEl) hiEl.textContent = hi;
            if (loEl) loEl.textContent = lo;
            if (dayEl) dayEl.textContent = dayLabel;
            if (humidityEl) humidityEl.textContent = `Humidity ${Number.isFinite(humidity) ? `${Math.round(humidity)}%` : '--%'}`;
            if (windEl) windEl.textContent = `Wind ${Number.isFinite(wind) ? `${Math.round(wind)} km/h` : '-- km/h'}`;
            if (rainEl) rainEl.textContent = `Rain ${Number.isFinite(rain) ? `${Math.round(rain)}%` : '--%'}`;
            renderWeatherChart(chartEl, hourly, activeWeatherMode);
            renderWeatherForecast(forecastEl, daily);
        });
        syncWeatherTabs();
        setSelectedWeatherDay(selectedWeatherDay);
    } catch (error) {
        [desktopWeatherTemp, mobileWeatherTemp].forEach(el => {
            if (el) el.textContent = '--°';
        });
        [desktopWeatherIcon, mobileWeatherIcon].forEach(el => {
            if (el) el.textContent = '☀';
        });
        if (desktopWeather) desktopWeather.title = 'Weather unavailable';
        if (mobileWeather) mobileWeather.title = 'Weather unavailable';
    }
};

const closeWeatherPopovers = () => {
    [desktopWeatherPopover, mobileWeatherPopover].forEach(panel => {
        if (panel) panel.hidden = true;
    });
};

const openWeatherPopover = (source) => {
    const desktopPanel = desktopWeatherPopover;
    const mobilePanel = mobileWeatherPopover;
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const panel = isMobile ? mobilePanel : desktopPanel;
    if (!panel) return;
    const isOpen = !panel.hidden;
    closeWeatherPopovers();
    panel.hidden = isOpen;
    if (!isOpen && weatherSnapshot) {
        const [iconEl, tempEl, placeEl, metaEl, hiEl, loEl, dayEl] = isMobile
            ? [mobileWeatherPopoverIcon, mobileWeatherPopoverTemp, mobileWeatherPopoverPlace, mobileWeatherPopoverMeta, mobileWeatherPopoverHi, mobileWeatherPopoverLo, mobileWeatherPopoverDay]
            : [desktopWeatherPopoverIcon, desktopWeatherPopoverTemp, desktopWeatherPopoverPlace, desktopWeatherPopoverMeta, desktopWeatherPopoverHi, desktopWeatherPopoverLo, desktopWeatherPopoverDay];
        if (iconEl) iconEl.textContent = weatherSnapshot.iconText;
        if (tempEl) tempEl.textContent = weatherSnapshot.tempText;
        if (placeEl) placeEl.textContent = weatherSnapshot.place;
        if (metaEl) metaEl.textContent = weatherSnapshot.condition;
        if (hiEl) hiEl.textContent = weatherSnapshot.hi;
        if (loEl) loEl.textContent = weatherSnapshot.lo;
        if (dayEl) dayEl.textContent = weatherSnapshot.dayLabel;
    }
    source?.setAttribute('aria-expanded', String(!isOpen));
};

const getCurrentArticleId = () => body.dataset.articleId || document.querySelector('meta[name="newsxphere-article-id"]')?.content || '';

const articleSearchText = (article) => [
    article.title,
    article.excerpt,
    article.category,
    article.section,
    article.author,
    ...(article.keywords || [])
].join(' ').toLowerCase();

const formatDate = (dateValue) => {
    if (!dateValue) return '';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(dateValue));
};

const articleCardTemplate = (article, index = 0) => `
    <article class="story-card ${index === 0 ? 'card-dark' : ''}" data-topic="${escapeHtml(article.category)}" data-search="${escapeHtml(articleSearchText(article))}">
        <a class="story-card-link" href="${escapeHtml(article.url)}" aria-label="Read ${escapeHtml(article.title)}">
            <div class="card-visual image-card">
                <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.imageAlt || article.title)}" loading="${index === 0 ? 'eager' : 'lazy'}">
                <span>${escapeHtml(article.label || article.category)}</span>
                <b>↗</b>
            </div>
            <div class="card-body">
                <p class="card-topic">
                    ${escapeHtml(article.category)} <i>·</i>
                    ${escapeHtml(article.readTime || 'Quick read')}
                </p>
                <h3>${escapeHtml(article.title)}</h3>
                <p>${escapeHtml(article.excerpt)}</p>
            </div>
        </a>
        <div class="card-footer">
            <span>${escapeHtml(article.author)} · ${escapeHtml(formatDate(article.publishedAt))}</span>
            <button class="save-button" aria-label="Save story: ${escapeHtml(article.title)}" data-save="${escapeHtml(article.id)}" type="button">♡</button>
        </div>
    </article>
`;

const setCount = (count) => {
    const label = `${count} ${count === 1 ? 'story' : 'stories'}`;
    const status = document.querySelector('#result-status');
    const countEl = document.querySelector('#search-result-count');
    if (status) status.textContent = label;
    if (countEl) countEl.textContent = label;
};

const getFilteredArticles = (value = search ? search.value : '') => {
    const query = (value || '').trim().toLowerCase();
    const active = document.querySelector('.topic.active')?.dataset.topic || 'All';
    return articles.filter(article => {
        const matchTopic = active === 'All' || article.category === active;
        const matchSearch = !query || articleSearchText(article).includes(query);
        return matchTopic && matchSearch;
    });
};

const renderStoryGrid = (items) => {
    if (!storyGrid) return;
    storyGrid.dataset.ready = 'true';
    storyGrid.innerHTML = items.map(articleCardTemplate).join('');
    syncSaveButtons();
};

const renderRelatedArticles = () => {
    if (!relatedGrid) return;
    const currentId = getCurrentArticleId();
    const related = articles.filter(article => article.id !== currentId).slice(0, 6);
    relatedGrid.innerHTML = related.length
        ? related.map(articleCardTemplate).join('')
        : '<p class="empty-state">More published NewsXphere articles will appear here automatically.</p>';
    syncSaveButtons();
};

const getSavedArticles = () => articles.filter(article => localStorage.getItem(`newsxphere-save-${article.id}`) === 'true');

function updateSaved() {
    const saved = getSavedArticles();
    const savedCount = document.querySelector('#saved-count');
    const list = document.querySelector('#saved-list');
    if (savedCount) savedCount.textContent = saved.length;
    if (!list) return;
    list.innerHTML = saved.length
        ? saved.map(article => `<article class="saved-item"><small>${escapeHtml(article.category)}</small><h3><a href="${escapeHtml(article.url)}">${escapeHtml(article.title)}</a></h3></article>`).join('')
        : '<p class="saved-empty">No saved stories yet. Tap the heart on a story to keep it close.</p>';
}

function syncSaveButtons() {
    document.querySelectorAll('.save-button').forEach(button => {
        const key = button.dataset.save;
        const article = articles.find(item => item.id === key);
        if (!article) return;

        const storageKey = `newsxphere-save-${key}`;
        const sync = () => {
            const saved = localStorage.getItem(storageKey) === 'true';
            button.classList.toggle('saved', saved);
            button.textContent = saved ? '♥' : '♡';
            button.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} story: ${article.title}`);
        };

        sync();
        if (button.dataset.bound === 'true') return;
        button.dataset.bound = 'true';
        button.addEventListener('click', () => {
            localStorage.setItem(storageKey, String(localStorage.getItem(storageKey) !== 'true'));
            sync();
            updateSaved();
            showToast(localStorage.getItem(storageKey) === 'true' ? 'Story saved to your reading list' : 'Story removed from your reading list');
        });
    });
    updateSaved();
}

function renderSearchState(value = '') {
    if (!searchSuggestions || !searchResults || !searchHint) return;

    const query = value.trim().toLowerCase();
    const matches = getFilteredArticles(value);
    const hasQuery = query.length > 0;

    searchSuggestions.hidden = hasQuery;
    searchResults.hidden = !hasQuery;
    searchHint.textContent = hasQuery ? 'Matching stories and recent signals' : 'Recent searches and trending signals';
    searchResults.innerHTML = hasQuery
        ? matches.length
            ? matches.map(article => `
                <a class="result-item" href="${escapeHtml(article.url)}">
                    <small>${escapeHtml(article.category)}</small>
                    <strong>${escapeHtml(article.title)}</strong>
                </a>
            `).join('')
            : '<p class="result-empty">No stories match that search yet. Try another signal.</p>'
        : '';
}

function filterStories(value = search ? search.value : '') {
    visibleArticles = getFilteredArticles(value);
    renderStoryGrid(visibleArticles);
    setCount(visibleArticles.length);

    const empty = document.querySelector('#empty-state');
    if (empty) empty.hidden = visibleArticles.length > 0;
    renderSearchState(value);
}

const openSearch = () => {
    if (!searchPanel) return;
    if (!searchPanel.hidden && body.classList.contains('search-open')) {
        closeSearch();
        return;
    }
    searchPanel.hidden = false;
    body.classList.add('search-open');
    document.querySelector('.site-header')?.classList.remove('is-hidden');
    document.querySelector('#search-trigger')?.setAttribute('aria-expanded', 'true');
    renderSearchState(search ? search.value : '');
    search?.focus();
};

const closeSearch = () => {
    if (searchPanel) searchPanel.hidden = true;
    body.classList.remove('search-open');
    body.classList.remove('search-dropdown-open');
    document.querySelector('#search-trigger')?.setAttribute('aria-expanded', 'false');
};

async function loadArticleData() {
    try {
        const response = await fetch(articleDataUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Article data failed: ${response.status}`);
        const data = await response.json();
        articles = Array.isArray(data.articles) ? data.articles : [];
    } catch (error) {
        console.error(error);
        articles = [];
    }

    visibleArticles = [...articles];
    renderStoryGrid(visibleArticles);
    renderRelatedArticles();
    setCount(visibleArticles.length);
    syncSaveButtons();
    filterStories(search ? search.value : '');
}

document.querySelector('#search-trigger')?.addEventListener('click', openSearch);
document.querySelector('#hero-search')?.addEventListener('click', openSearch);
document.querySelector('#close-search')?.addEventListener('click', closeSearch);

search?.addEventListener('input', () => {
    body.classList.add('search-dropdown-open');
    filterStories();
});

search?.addEventListener('focus', () => {
    body.classList.add('search-dropdown-open');
    renderSearchState(search.value);
});

topics.forEach(topic => topic.addEventListener('click', () => {
    topics.forEach(item => item.classList.remove('active'));
    topic.classList.add('active');
    filterStories();
    primaryNav?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
}));

const closePrimaryNav = () => {
    if (!primaryNav) return;
    primaryNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
};

const isPrimaryNavOpen = () => primaryNav?.classList.contains('open');

menuToggle?.addEventListener('click', () => {
    const open = primaryNav?.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
});

document.querySelector('#saved-toggle')?.addEventListener('click', () => {
    savedDrawer?.classList.add('open');
    savedDrawer?.setAttribute('aria-hidden', 'false');
    updateSaved();
});

document.querySelector('#close-saved')?.addEventListener('click', () => {
    savedDrawer?.classList.remove('open');
    savedDrawer?.setAttribute('aria-hidden', 'true');
});

themeToggle?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dim' ? 'paper' : 'dim';
    applyTheme(nextTheme);
    showToast(nextTheme === 'dim' ? 'Dim reading theme on' : 'Paper reading theme on');
});

applyTheme(getPreferredTheme());
updateLiveClock();
setInterval(updateLiveClock, 1000);
updateHeaderWeather();

[desktopWeather, mobileWeather].forEach(button => {
    button?.addEventListener('click', () => openWeatherPopover(button));
});
weatherTabs.forEach(tab => {
    tab.addEventListener('click', () => setWeatherMode(tab.dataset.weatherTab || 'temperature'));
});
[
    desktopWeatherPopoverForecast,
    mobileWeatherPopoverForecast
].forEach(container => {
    container?.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-weather-day]');
        if (!btn) return;
        setSelectedWeatherDay(Number(btn.dataset.weatherDay || 0));
    });
});
weatherCloseButtons.forEach(button => {
    button.addEventListener('click', closeWeatherPopovers);
});
document.addEventListener('click', (event) => {
    if (!event.target.closest('.header-weather') && !event.target.closest('.weather-popover')) {
        closeWeatherPopovers();
    }
});

document.querySelector('#reading-mode')?.addEventListener('click', event => {
    const on = body.classList.toggle('reading-mode');
    event.currentTarget.textContent = on ? 'Exit reader' : 'Reader';
    localStorage.setItem('newsxphere-reader', String(on));
    showToast(on ? 'Reader mode on' : 'Reader mode off');
});

if (localStorage.getItem('newsxphere-reader') === 'true') {
    body.classList.add('reading-mode');
    const readingMode = document.querySelector('#reading-mode');
    if (readingMode) readingMode.textContent = 'Exit reader';
}

document.querySelectorAll('[data-read]').forEach(button => button.addEventListener('click', () => {
    body.classList.add('reading-mode');
    const readingMode = document.querySelector('#reading-mode');
    if (readingMode) readingMode.textContent = 'Exit reader';
    showToast('Reader mode on');
    const feature = document.querySelector('.feature');
    if (feature) {
        window.scrollTo({
            top: feature.offsetTop - 20,
            behavior: 'smooth'
        });
    }
}));

document.querySelector('#briefing-form')?.addEventListener('submit', event => {
    event.preventDefault();
    document.querySelector('#form-note').textContent = 'You are on the list. Watch your inbox for Friday\'s signal.';
    event.currentTarget.querySelector('button').innerHTML = 'You\'re in <span>→</span>';
    showToast('Welcome to the NewsXphere Briefing');
});

document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchPanel?.hidden ? openSearch() : search?.focus();
    }
    if (event.key === 'Escape') {
        if (searchPanel && !searchPanel.hidden) closeSearch();
        if (savedDrawer?.classList.contains('open')) document.querySelector('#close-saved')?.click();
        if (isPrimaryNavOpen()) closePrimaryNav();
    }
});

document.querySelector('#search-refresh')?.addEventListener('click', () => {
    if (search) search.value = '';
    filterStories('');
    search?.focus();
    showToast('Search refreshed');
});

document.querySelector('#search-suggestions')?.addEventListener('click', event => {
    const button = event.target.closest('.suggestion-item');
    if (!button || !search) return;
    search.value = button.textContent.trim();
    filterStories(search.value);
    closeSearch();
});

document.querySelector('#search-results')?.addEventListener('click', event => {
    if (event.target.closest('.result-item')) closeSearch();
});

const maybeClosePrimaryNav = (event) => {
    if (!isPrimaryNavOpen()) return;
    const target = event.target;
    if (primaryNav?.contains(target)) return;
    if (menuToggle?.contains(target)) return;
    closePrimaryNav();
};

document.addEventListener('mousedown', maybeClosePrimaryNav, true);
document.addEventListener('touchstart', maybeClosePrimaryNav, { passive: true, capture: true });
window.addEventListener('scroll', () => {
    if (isPrimaryNavOpen()) closePrimaryNav();
}, { passive: true });
window.addEventListener('resize', () => {
    if (isPrimaryNavOpen()) closePrimaryNav();
}, { passive: true });

loadArticleData();

/* YouTube-style header hide / show */
(function () {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let spacer = document.querySelector('.header-spacer');
    if (!spacer) {
        spacer = document.createElement('div');
        spacer.className = 'header-spacer';
        spacer.setAttribute('aria-hidden', 'true');
        if (header.nextSibling) {
            header.parentNode.insertBefore(spacer, header.nextSibling);
        } else {
            header.parentNode.appendChild(spacer);
        }
    }

    function syncSpacer() {
        const top = parseFloat(getComputedStyle(header).top) || 12;
        spacer.style.height = (header.offsetHeight + top + 8) + 'px';
    }

    let lastY = window.scrollY || 0;
    let hidden = false;
    let ticking = false;
    const delta = 8;
    const topShow = 40;

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

        if (y <= topShow) {
            show();
            lastY = y;
            ticking = false;
            return;
        }

        if (Math.abs(dy) >= delta) {
            dy > 0 ? hide() : show();
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
    syncSpacer();
    requestAnimationFrame(syncSpacer);
    setTimeout(syncSpacer, 100);
    setTimeout(syncSpacer, 400);
    document.querySelector('#search-trigger')?.addEventListener('click', show);
})();

/* Click outside search panel to close */
(function () {
    const panel = document.querySelector('#search-panel');
    const trigger = document.querySelector('#search-trigger');
    const heroSearch = document.querySelector('#hero-search');
    if (!panel) return;

    function isSearchOpen() {
        return body.classList.contains('search-open') && !panel.hidden;
    }

    function maybeClose(e) {
        if (!isSearchOpen()) return;
        const target = e.target;
        if (panel.contains(target)) return;
        if (trigger?.contains(target)) return;
        if (heroSearch?.contains(target)) return;
        closeSearch();
    }

    document.addEventListener('mousedown', maybeClose, true);
    document.addEventListener('touchstart', maybeClose, { passive: true, capture: true });
})();
