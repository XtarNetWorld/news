const root = document.documentElement;

const body = document.body;
const articleDataUrl = '/allnewsdata.json';
const recentSearchesKey = 'newsxphere-recent-searches';
const recentSearchIcon = '<svg class="recent-search-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8.515 1.019A7 7 0 0 0 1.83 6.5H.5a.5.5 0 0 0 0 1H3a.5.5 0 0 0 .5-.5V4.5a.5.5 0 0 0-1 0v1.308A6 6 0 1 1 8 14a.5.5 0 0 0 0 1A7 7 0 1 0 8.515 1.019z"></path><path d="M8 3.5a.5.5 0 0 1 .5.5v4.25l3.5 2.1a.5.5 0 0 1-.5.866l-3.75-2.25A.5.5 0 0 1 7.5 8.5V4a.5.5 0 0 1 .5-.5z"></path></svg>';
const searchIcon = '<svg class="search-result-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"></circle><path d="m16 16 4.2 4.2"></path></svg>';
const jobDataUrl = '/jobdata.json';

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
let orbitHero = document.querySelector('.hero-orbit');

// The assistant is owned by this shared script. Pages without the homepage
// orbit still get the same bot, without needing a placeholder in their HTML.
const universalBotPage = !orbitHero;
let orbitBotHost = orbitHero?.querySelector('.orbit-bot-host') || null;
let orbitBotHome = orbitBotHost?.parentElement || null;
let orbitBotAnchor = orbitBotHost ? document.createComment('orbit-bot-home') : null;

if (universalBotPage) {
    orbitHero = document.createElement('div');
    orbitHero.className = 'hero-orbit universal-bot-orbit';
    orbitBotHome = document.createElement('div');
    orbitBotHome.hidden = true;
    orbitBotHome.setAttribute('aria-hidden', 'true');
    orbitBotAnchor = document.createComment('orbit-bot-home');
    orbitBotHost = document.createElement('div');
    orbitBotHost.className = 'orbit-bot-host universal-bot-host';
    orbitBotHost.setAttribute('aria-label', 'NewsXphere AI assistant');
    orbitBotHost.innerHTML = '<div id="stage"></div><div id="shadow"></div><div id="label">click the bot</div><div class="orbit-bot-controls" aria-hidden="true"><input id="speakText" value="Hello! I am your talking robot."><button id="speakBtn" type="button">Speak</button><select id="voiceEngine"><option value="browser">Browser voice</option></select><div id="cloudRow"><select id="cloudLangSelect"></select><select id="cloudVoiceSelect"></select></div><div id="browserRow"><select id="langSelect"></select><select id="voiceSelect"></select></div><input id="rate" type="range" value="1"><span id="rateVal">1.00×</span><input id="syncOff" type="range" value="0"><span id="syncVal">0 ms</span><div id="status"></div><div id="dbg"></div></div>';
    orbitBotHome.appendChild(orbitBotAnchor);
    orbitBotHome.appendChild(orbitBotHost);
    document.body.appendChild(orbitBotHome);

    const loadScript = (src) => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
    const botEngineReady = window.THREE
        ? Promise.resolve()
        : loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
    botEngineReady
        .then(() => loadScript('/orbit-bot.js'))
        .catch(error => console.error('[orbit-bot] Unable to load assistant:', error));
}

let articles = [];
let visibleArticles = [];
let committedSearchQuery = '';
let weatherSnapshot = null;
let activeWeatherMode = 'temperature';
let selectedWeatherDay = 0;
let jobs = [];
let savedFilter = 'all';
let savedSearchQuery = '';
let savedSearchActive = false;

// NX-014's AI companion starts inside the orbit, then docks as a playful
// bottom-right assistant once the reader leaves the hero area.
if (orbitBotHost) {
    if (orbitBotHost && orbitBotAnchor) orbitBotHome.insertBefore(orbitBotAnchor, orbitBotHost);
    let botDockLayer = null;
    let botMotion = null;
    const updateOrbitAi = () => {
        if (document.body.classList.contains('bot-chat-open')) return;
        const shouldDock = universalBotPage || body.classList.contains('reading-mode') || window.scrollY > 110;

        if (orbitHero.classList.contains('bot-docked-state') === shouldDock) return;
        if (!orbitBotHost || !orbitBotHome || !orbitBotAnchor) return;
        if (botMotion) botMotion.cancel();

        const startRect = orbitBotHost.getBoundingClientRect();
        orbitHero.classList.remove('ai-returning');
        if (shouldDock) {
            orbitHero.classList.add('bot-docked-state');
            if (botDockLayer) {
                botDockLayer.remove();
                botDockLayer = null;
            }
            botDockLayer = document.createElement('div');
            botDockLayer.className = 'bot-dock-layer';
            document.body.appendChild(botDockLayer);
            botDockLayer.appendChild(orbitBotHost);
            orbitBotHost.classList.add('bot-docked');
        } else {
            orbitHero.classList.remove('bot-docked-state');
            orbitHero.classList.add('ai-returning');
            orbitBotHome.insertBefore(orbitBotHost, orbitBotAnchor.nextSibling);
            orbitBotHost.classList.remove('bot-docked');
        }

        const endRect = shouldDock
            ? botDockLayer.getBoundingClientRect()
            : orbitBotHost.getBoundingClientRect();
        const startCenterX = startRect.left + startRect.width / 2;
        const startCenterY = startRect.top + startRect.height / 2;
        const endCenterX = endRect.left + endRect.width / 2;
        const endCenterY = endRect.top + endRect.height / 2;
        const deltaX = startCenterX - endCenterX;
        const deltaY = startCenterY - endCenterY;
        const botTravelTarget = shouldDock ? botDockLayer : orbitBotHost;
        const startTransform = shouldDock
            ? `translate3d(${deltaX}px, ${deltaY}px, 0) scale(.58)`
            : `translate3d(${deltaX}px, ${deltaY}px, 0) translate(-50%, -50%) scale(.27)`;
        const endTransform = shouldDock
            ? 'translate3d(0, 0, 0) scale(1)'
            : 'translate3d(0, 0, 0) translate(-50%, -50%) scale(.31)';

        botMotion = botTravelTarget.animate([
            {
                transform: startTransform,
                opacity: .72
            },
            { offset: .2, opacity: 1 },
            {
                transform: endTransform,
                opacity: 1
            }
        ], {
            duration: 820,
            easing: 'cubic-bezier(.16, 1, .3, 1)',
            fill: 'both'
        });

        botMotion.onfinish = () => {
            botMotion = null;
            if (!shouldDock && botDockLayer) {
                botDockLayer.remove();
                botDockLayer = null;
            }
            orbitHero.classList.remove('ai-returning');
        };
    };
    window.addEventListener('reader-mode-change', updateOrbitAi);
    let orbitScrollFrame = null;
    window.addEventListener('scroll', () => {
        if (orbitScrollFrame) return;
        orbitScrollFrame = requestAnimationFrame(() => {
            updateOrbitAi();
            orbitScrollFrame = null;
        });
    }, { passive: true });
    updateOrbitAi();

    const chatPanel = document.createElement('aside');
    chatPanel.className = 'orbit-chat-panel';
    chatPanel.setAttribute('aria-label', 'NewsXphere AI assistant panel');
    chatPanel.hidden = true;
    chatPanel.innerHTML = `<div class="orbit-chat-head"><div class="orbit-chat-brand"><span class="orbit-chat-kicker">NEWSXPHERE AI</span><small class="orbit-chat-powered">Powered by XtarNet AI</small></div><button class="orbit-chat-close" type="button" aria-label="Close assistant panel">×</button></div><div class="orbit-chat-bot-slot"><button class="orbit-chat-control orbit-chat-mic" type="button" aria-label="Turn microphone on" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="8" height="12" rx="4"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"></path><path class="icon-slash" d="M4 4l16 16"></path></svg></button><button class="orbit-chat-control orbit-chat-speaker" type="button" aria-label="Turn speaker off" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z"></path><path class="icon-waves" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"></path><path class="icon-slash" d="M4 4l16 16"></path></svg></button></div><div class="orbit-chat-space"><div class="orbit-chat-log" aria-live="polite" aria-label="Assistant conversation"></div><div class="orbit-chat-empty"><div class="orbit-chat-welcome"><strong>What are you curious about today?</strong><span>Pick a signal and let’s explore it together.</span></div><div class="orbit-chat-suggestions" aria-label="Suggested questions"></div></div></div><div class="orbit-chat-history-nav"><button type="button" class="orbit-chat-history-btn" data-history="previous" aria-label="Show previous message" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 12H7m0 0 4-4m-4 4 4 4"></path></svg></button><span class="orbit-chat-history-label">Messages</span><button type="button" class="orbit-chat-history-btn" data-history="next" aria-label="Show next message" disabled><svg viewBox="0 0 24 24"><path d="M7 12h10m0 0-4-4m4 4-4 4"></path></svg></button></div><form class="orbit-chat-form"><input class="orbit-chat-input" type="text" autocomplete="off" placeholder="Type your question…" aria-label="Type your question"><button type="submit" aria-label="Send question">↗</button></form>`;
    chatPanel.innerHTML = chatPanel.innerHTML.replace('NEWSXPHERE AI', 'Max Ai');
    const chatHead = chatPanel.querySelector('.orbit-chat-head');
    const historyHead = document.createElement('button');
    historyHead.className = 'orbit-chat-history-head';
    historyHead.type = 'button';
    historyHead.setAttribute('aria-label', 'Show previous message');
    historyHead.disabled = true;
    historyHead.innerHTML = '<img src="/public/history.png" alt="" aria-hidden="true">';
    chatHead?.prepend(historyHead);
    const historyMenu = document.createElement('div');
    historyMenu.className = 'orbit-chat-history-menu';
    historyMenu.hidden = true;
    historyMenu.innerHTML = '<div class="orbit-chat-history-menu-title"><span>Previous chats</span><button type="button" class="orbit-chat-new-button"><span>New chat</span><b aria-hidden="true">+</b></button></div><div class="orbit-chat-history-menu-list"></div>';
    chatPanel.appendChild(historyMenu);
    const historyDialog = document.createElement('div');
    historyDialog.className = 'orbit-chat-history-dialog';
    historyDialog.hidden = true;
    historyDialog.innerHTML = '<div class="orbit-chat-history-dialog-card"><strong class="orbit-chat-history-dialog-title"></strong><input class="orbit-chat-history-dialog-input" type="text" maxlength="80"><p class="orbit-chat-history-dialog-message"></p><div class="orbit-chat-history-dialog-actions"><button type="button" class="orbit-chat-history-dialog-cancel">Cancel</button><button type="button" class="orbit-chat-history-dialog-confirm">Confirm</button></div></div>';
    chatPanel.appendChild(historyDialog);
    document.body.appendChild(chatPanel);
    const chatSlot = chatPanel.querySelector('.orbit-chat-bot-slot');
    const micControl = chatPanel.querySelector('.orbit-chat-mic');
    const speakerControl = chatPanel.querySelector('.orbit-chat-speaker');
    const chatForm = chatPanel.querySelector('.orbit-chat-form');
    const chatInput = chatPanel.querySelector('.orbit-chat-input');
    const chatLog = chatPanel.querySelector('.orbit-chat-log');
    const chatEmpty = chatPanel.querySelector('.orbit-chat-empty');
    const chatSuggestions = chatPanel.querySelector('.orbit-chat-suggestions');
    const historyPrev = chatPanel.querySelector('[data-history="previous"]');
    const historyNext = chatPanel.querySelector('[data-history="next"]');
    const historyLabel = chatPanel.querySelector('.orbit-chat-history-label');
    const chatSend = chatPanel.querySelector('.orbit-chat-form button[type="submit"]');
    const closeChat = chatPanel.querySelector('.orbit-chat-close');
    const newChatButton = historyMenu.querySelector('.orbit-chat-new-button');
    const historyMenuList = historyMenu.querySelector('.orbit-chat-history-menu-list');
    const historyDialogTitle = historyDialog.querySelector('.orbit-chat-history-dialog-title');
    const historyDialogInput = historyDialog.querySelector('.orbit-chat-history-dialog-input');
    const historyDialogMessage = historyDialog.querySelector('.orbit-chat-history-dialog-message');
    const historyDialogCancel = historyDialog.querySelector('.orbit-chat-history-dialog-cancel');
    const historyDialogConfirm = historyDialog.querySelector('.orbit-chat-history-dialog-confirm');
    let historyDialogResolve = null;
    const closeHistoryDialog = result => {
        historyDialog.hidden = true;
        const resolve = historyDialogResolve;
        historyDialogResolve = null;
        resolve?.(result);
    };
    const showHistoryDialog = (mode, session) => new Promise(resolve => {
        historyDialogResolve = resolve;
        const isRename = mode === 'rename';
        historyDialogTitle.textContent = isRename ? 'Rename chat' : 'Delete chat';
        historyDialogMessage.textContent = isRename ? '' : `Delete “${session.title}”? This cannot be undone.`;
        historyDialogInput.hidden = !isRename;
        historyDialogInput.value = isRename ? session.title : '';
        historyDialogConfirm.textContent = isRename ? 'Save' : 'Delete';
        historyDialogConfirm.classList.toggle('is-danger', !isRename);
        historyDialog.hidden = false;
        window.setTimeout(() => (isRename ? historyDialogInput : historyDialogConfirm).focus(), 0);
    });
    historyDialogCancel.addEventListener('click', () => closeHistoryDialog(null));
    historyDialogConfirm.addEventListener('click', () => {
        if (historyDialogInput.hidden) closeHistoryDialog(true);
        else closeHistoryDialog(historyDialogInput.value.trim());
    });
    historyDialog.addEventListener('click', event => {
        if (event.target === historyDialog) closeHistoryDialog(null);
    });
    historyDialogInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') historyDialogConfirm.click();
        if (event.key === 'Escape') historyDialogCancel.click();
    });
    let assistantRecognition = null;
    let assistantMicActive = false;
    let assistantMicTimeout = null;
    let chatProcessing = false;
    let chatAbortController = null;
    let speechUtterance = null;
    let speechWordSpans = [];
    let speechWordMap = [];
    let speechSpokenWordRanges = [];
    let speechSpokenText = '';
    let activeSpeechWordIndex = -1;
    let speechScrollRaf = null;
    let speechScrollWord = null;
    let speechScrollDueAt = 0;
    let speechBoundarySeen = false;
    let speechBoundaryCharIndex = -1;
    let speechFallbackTimeout = null;
    let speechFallbackInterval = null;
    let speechHighlightTimer = null;
    let speechAudio = null;
    let speechAudioUrl = '';
    let speechRequestId = 0;
    const SPEECH_HIGHLIGHT_DELAY_MS = 35;
    let lastPollinationsRequestAt = 0;
    const POLLINATIONS_REQUEST_GAP_MS = 9000;
    let pollinationsCooldownUntil = 0;
    let pollinationsCooldownTimer = null;
    const refreshPollinationsCooldown = () => {
        const remaining = Math.max(0, pollinationsCooldownUntil - performance.now());
        if (remaining > 0) {
            if (chatSend) {
                chatSend.disabled = true;
                chatSend.classList.add('is-cooldown');
                chatSend.textContent = `Wait ${Math.ceil(remaining / 1000)}s`;
            }
            return;
        }
        if (pollinationsCooldownTimer) {
            window.clearInterval(pollinationsCooldownTimer);
            pollinationsCooldownTimer = null;
        }
        if (chatSend) {
            chatSend.disabled = false;
            chatSend.classList.remove('is-cooldown');
            chatSend.textContent = chatProcessing ? '×' : '↗';
        }
    };
    const startPollinationsCooldown = () => {
        pollinationsCooldownUntil = performance.now() + POLLINATIONS_REQUEST_GAP_MS;
        if (pollinationsCooldownTimer) window.clearInterval(pollinationsCooldownTimer);
        refreshPollinationsCooldown();
        pollinationsCooldownTimer = window.setInterval(refreshPollinationsCooldown, 250);
    };
    const conversationHistory = [];
    const chatSessions = [];
    const chatHistoryStorageKey = 'maxai-chat-history';
    const suggestionStorageKey = 'maxai-used-suggestions';
    const suggestedQuestions = [
        'What story could change the world this week?',
        'Which technology trend is quietly becoming important?',
        'What should I understand about today’s biggest headline?',
        'Show me a surprising connection between science and society.',
        'What is one idea everyone will be discussing soon?',
        'Which startup is solving a problem people overlook?',
        'What does today’s economy mean for ordinary people?',
        'Explain a global event in simple words.',
        'What future technology already feels like science fiction?',
        'Which climate signal deserves more attention?',
        'What is a smart question to ask about artificial intelligence?',
        'Tell me about a place changing faster than expected.',
        'What recent discovery could improve everyday life?',
        'Which business story has a hidden human angle?',
        'What are experts watching over the next few days?',
        'What overlooked fact changes how we see this issue?',
        'Which cultural trend is spreading under the radar?',
        'What is the most misunderstood story today?',
        'Show me a useful lesson from history for today.',
        'What could make the internet safer this year?',
        'Which energy breakthrough is worth watching?',
        'What does this news mean for young people?',
        'What is one optimistic story I should know?',
        'Which country is making an unexpected move?',
        'What question would reveal the real story here?',
        'Explain a complex topic without jargon.',
        'What could disrupt an industry in the next five years?',
        'Which health innovation has real potential?',
        'What is a fact about space that feels impossible?',
        'What are people getting wrong about the future of work?',
        'Which local story deserves global attention?',
        'What can we learn from today’s biggest mistake?',
        'What is the most useful news to share with a friend?',
        'Which invention changed life more than expected?',
        'What trend connects entertainment, technology, and culture?',
        'What should I watch before making a big decision?',
        'Which scientific mystery is closest to being solved?',
        'What small change could improve society significantly?',
        'What is a bold prediction about the next decade?',
        'Give me a story that will make me think differently.'
    ];
    const loadUsedSuggestions = () => {
        try {
            const used = JSON.parse(localStorage.getItem(suggestionStorageKey) || '[]');
            return new Set(Array.isArray(used) ? used : []);
        } catch (_) { return new Set(); }
    };
    const saveUsedSuggestions = used => {
        try { localStorage.setItem(suggestionStorageKey, JSON.stringify([...used])); } catch (_) { /* storage is optional */ }
    };
    const renderSuggestions = () => {
        if (!chatSuggestions) return;
        chatSuggestions.replaceChildren();
        const used = loadUsedSuggestions();
        const available = suggestedQuestions.filter(question => !used.has(question)).sort(() => Math.random() - .5);
        available.slice(0, Math.min(2, available.length)).forEach(question => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'orbit-chat-suggestion';
            button.textContent = question;
            button.addEventListener('click', () => {
                used.add(question);
                saveUsedSuggestions(used);
                removeChatWelcome();
                if (chatInput) chatInput.value = question;
                updateChatSendState();
                chatForm?.requestSubmit();
            });
            chatSuggestions.appendChild(button);
        });
    };
    const removeChatWelcome = () => {
        chatEmpty?.remove();
        chatSuggestions?.remove();
    };
    const restoreChatWelcome = () => {
        const chatSpace = chatPanel.querySelector('.orbit-chat-space');
        if (chatSpace && chatEmpty && !chatEmpty.isConnected) chatSpace.appendChild(chatEmpty);
        if (chatSpace && chatSuggestions && !chatSuggestions.isConnected) chatSpace.appendChild(chatSuggestions);
        if (chatEmpty) chatEmpty.hidden = false;
        renderSuggestions();
    };
    let activeSessionIndex = -1;
    let activeExchangeIndex = -1;
    try {
        const cachedChats = JSON.parse(localStorage.getItem(chatHistoryStorageKey) || '[]');
        if (Array.isArray(cachedChats)) {
            if (cachedChats.some(session => Array.isArray(session?.exchanges))) {
                cachedChats.slice(-20).forEach(session => {
                    const exchanges = Array.isArray(session.exchanges)
                        ? session.exchanges.filter(exchange => exchange && typeof exchange.user === 'string' && typeof exchange.answer === 'string')
                        : [];
                    if (exchanges.length) chatSessions.push({
                        title: typeof session.title === 'string' ? session.title : exchanges[0].user,
                        createdAt: session.createdAt || Date.now(),
                        exchanges
                    });
                });
            } else {
                const exchanges = cachedChats.filter(exchange => exchange && typeof exchange.user === 'string' && typeof exchange.answer === 'string');
                if (exchanges.length) chatSessions.push({ title: exchanges[0].user, createdAt: Date.now(), exchanges });
            }
        }
        if (chatSessions.length) {
            activeSessionIndex = chatSessions.length - 1;
            activeExchangeIndex = chatSessions[activeSessionIndex].exchanges.length - 1;
        }
    } catch (_) { /* cached history is optional */ }
    const getSystemPrompt = () => `You are Max Ai, an AI assistant created by Monu Sharma, born in 2010 and founder of XtarNet. Monu studies at Little Angels Public School. His father's name is NandLal Sharma. He has a brother, Vikash Sharma, and two sisters, Tannu Sharma and Nilu Sharma. His school friends are Sumit Sharma, Yash Sharma, and Ayush Singh.

Respond directly, naturally, and helpfully. No filler, no unnecessary greetings, no repetition, no vague explanations, and no bakwas. Give the answer first in short, clear sentences. Prefer 1–4 concise sentences or a compact list; give longer detail only when the user asks for it or the task truly requires it. Use common sense to understand intent, maintain context, and stay accurate. If interrupted by words such as stop, ruko, cancel, or a new request, stop the current response and address the new request immediately. Match the user's language, including Hindi or English, unless asked otherwise. Ignore your own speech output and process only the user's speech. Do not generate images, image prompts, or image-generation instructions; answer with text only. If asked about your creator, say you were created by Monu Sharma, founder of XtarNet, and do not disclose additional private details.

Conversation history: ${JSON.stringify(conversationHistory)}`;
    let assistantVoices = [];
    const buildScopedSystemPrompt = userMessage => {
        const normalizedMessage = String(userMessage || '').trim().toLowerCase();
        const isRepeatRequest = /^(say again|repeat|repeat that|again|phir se|dobara|fir se)\b[.!?\s]*$/i.test(normalizedMessage);
        const isProfileQuestion = /(who|which|what).{0,30}(created|built|made|creator|company)|creator|founder|owner|who are you/i.test(normalizedMessage);
        const lastAssistantAnswer = [...conversationHistory].reverse().find(entry => entry?.role === 'assistant')?.content || '';
        const recentHistory = conversationHistory.slice(-10).filter(entry => isProfileQuestion || entry?.role !== 'assistant' || !/(Little Angels|NandLal|Vikash|Tannu|Nilu|Sumit|Yash|Ayush|born in 2010)/i.test(String(entry.content || '')));
        const repeatInstruction = isRepeatRequest
            ? 'Repeat only the immediately previous assistant answer below. Do not answer with Max Ai profile facts and do not invent a new topic. Previous answer: ' + JSON.stringify(lastAssistantAnswer)
            : 'Answer the current user message directly. Do not repeat an earlier answer unless the user explicitly asks for it.';
        return [
            'You are Max Ai, an AI assistant created by Monu Sharma, founder of XtarNet.',
            'Respond directly, naturally, and helpfully. Give the answer first in 1–4 concise sentences unless more detail is requested. Match the user language. Do not generate images or image prompts.',
            'Profile policy: creator facts are private background context, not a default answer. Never volunteer Monu Sharma\'s birth year, school, family, siblings, or friends. Mention a profile fact only when the user directly asks for that exact fact. If asked who built or created you, answer only: "I was created by Monu Sharma, founder of XtarNet."',
            repeatInstruction,
            'Recent relevant conversation history: ' + JSON.stringify(recentHistory),
            'Current user message: ' + JSON.stringify(String(userMessage || ''))
        ].join('\n\n');
    };
    const loadAssistantVoices = () => {
        assistantVoices = window.speechSynthesis?.getVoices?.() || [];
    };
    loadAssistantVoices();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = loadAssistantVoices;
    const addChatMessage = (text, type) => {
        const message = document.createElement('div');
        message.className = `orbit-chat-message ${type}`;
        message.textContent = text;
        chatLog?.appendChild(message);
                removeChatWelcome();
        if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
        return message;
    };
    const addThinkingMessage = () => {
        const message = document.createElement('div');
        message.className = 'orbit-chat-message received is-loading';
        message.setAttribute('aria-label', 'Assistant is thinking');
        message.innerHTML = '<span class="orbit-chat-thinking"><i></i><i></i><i></i><em>Thinking</em></span>';
        chatLog?.appendChild(message);
        removeChatWelcome();
        return message;
    };
    const setThinkingLabel = (message, label) => {
        const labelNode = message?.querySelector('.orbit-chat-thinking em');
        if (labelNode) labelNode.textContent = label;
        else if (message) message.textContent = label;
    };
    const clearSpeechHighlight = () => {
        if (speechFallbackTimeout) clearTimeout(speechFallbackTimeout);
        if (speechFallbackInterval) clearInterval(speechFallbackInterval);
        speechFallbackTimeout = null;
        speechFallbackInterval = null;
        if (speechHighlightTimer) clearTimeout(speechHighlightTimer);
        speechHighlightTimer = null;
        speechWordSpans.forEach(span => {
            span.classList.remove('is-speaking-word');
            span.removeAttribute('aria-current');
        });
        if (speechScrollRaf) cancelAnimationFrame(speechScrollRaf);
        speechScrollRaf = null;
        speechScrollWord = null;
        speechScrollDueAt = 0;
        activeSpeechWordIndex = -1;
        speechWordSpans = [];
        speechWordMap = [];
        speechSpokenWordRanges = [];
        speechSpokenText = '';
        speechBoundaryCharIndex = -1;
    };
    const prepareSpeechMessage = (messageElement, text, spokenText = text) => {
        if (!messageElement) return;
        clearSpeechHighlight();
        speechSpokenText = String(spokenText);
        const displayWords = String(text).match(/\S+/g) || [];
        const spokenMatches = [...String(spokenText).matchAll(/\S+/g)];
        const spokenWords = spokenMatches.map(match => match[0]);
        speechSpokenWordRanges = spokenMatches.map((match, index) => ({
            start: match.index,
            end: match.index + match[0].length,
            index
        }));
        let spokenIndex = 0;
        displayWords.forEach((displayWord, displayIndex) => {
            const normalized = displayWord.replace(/[^a-z0-9-]/gi, '').toLowerCase();
            const spokenParts = normalized === 'maxai' || normalized === 'xtarnet' ? 2 : 1;
            for (let part = 0; part < spokenParts && spokenIndex < spokenWords.length; part += 1) {
                speechWordMap[spokenIndex] = displayIndex;
                spokenIndex += 1;
            }
        });
        const parts = String(text).split(/(\s+)/);
        messageElement.replaceChildren();
        parts.forEach(part => {
            if (/\s+/.test(part)) messageElement.appendChild(document.createTextNode(part));
            else if (part) {
                const word = document.createElement('span');
                word.className = 'orbit-chat-word';
                word.textContent = part;
                speechWordSpans.push(word);
                messageElement.appendChild(word);
            }
        });
    };
    const displayWordIndexForChar = charIndex => {
        if (!speechSpokenText || typeof charIndex !== 'number') return -1;
        const exactRange = speechSpokenWordRanges.find(range => charIndex >= range.start && charIndex < range.end);
        // Implementations disagree about whether a word-boundary charIndex
        // points to the first character of the next word or the whitespace
        // after the previous word. If it points into whitespace, keep the
        // previous word active; that is the only interpretation guaranteed
        // by the Web Speech spec (text before charIndex has been spoken).
        const previousRange = speechSpokenWordRanges
            .slice()
            .reverse()
            .find(range => range.end <= charIndex);
        const spokenWordIndex = exactRange?.index
            ?? previousRange?.index
            ?? speechSpokenWordRanges[0]?.index
            ?? -1;
        return speechWordMap[spokenWordIndex]
            ?? Math.min(speechWordSpans.length - 1, spokenWordIndex);
    };
    const setActiveSpeechWord = displayWordIndex => {
        if (!speechWordSpans.length || !Number.isFinite(displayWordIndex)) return;
        displayWordIndex = Math.max(0, Math.min(speechWordSpans.length - 1, displayWordIndex));
        if (displayWordIndex === activeSpeechWordIndex) return;
        const previousWord = speechWordSpans[activeSpeechWordIndex];
        if (previousWord) {
            previousWord.classList.remove('is-speaking-word');
            previousWord.removeAttribute('aria-current');
        }
        activeSpeechWordIndex = displayWordIndex;
        const activeWord = speechWordSpans[displayWordIndex];
        activeWord.classList.add('is-speaking-word');
        activeWord.setAttribute('aria-current', 'true');
        // Scroll separately from the timing-critical class update. It is
        // throttled and runs after the boundary callback, so a long answer
        // cannot make SpeechSynthesis wait on layout or scrolling.
        speechScrollWord = activeWord;
        const now = performance.now();
        if (!speechScrollRaf && now >= speechScrollDueAt) {
            speechScrollRaf = requestAnimationFrame(() => {
                speechScrollRaf = null;
                speechScrollDueAt = performance.now() + 90;
                const word = speechScrollWord;
                speechScrollWord = null;
                const messageBox = word?.closest('.orbit-chat-message.received');
                if (!word || !messageBox) return;
                const top = word.offsetTop;
                const bottom = top + word.offsetHeight;
                const upper = messageBox.scrollTop + 10;
                const lower = messageBox.scrollTop + messageBox.clientHeight - 24;
                if (top < upper || bottom > lower) {
                    messageBox.scrollTo({
                        top: Math.max(0, top - Math.max(12, messageBox.clientHeight * 0.28)),
                        behavior: 'auto'
                    });
                }
            });
        }
    };
    // The boundary event is only a clock re-anchor. The bot calls this on
    // every render frame with the current calibrated spoken-text position, so
    // the highlight cannot wait for (or get stuck behind) the next browser
    // boundary callback.
    window.maxaiBotSpeechTick = spokenCharIndex => {
        // Once the browser has started emitting real word boundaries, those
        // boundaries are the authoritative text clock. Do not let the
        // predictive mouth timeline overwrite them later in a long answer.
        if ((!speechUtterance && !speechAudio) || speechBoundarySeen || !Number.isFinite(spokenCharIndex)) return;
        const displayIndex = displayWordIndexForChar(spokenCharIndex);
        if (displayIndex >= 0) setActiveSpeechWord(displayIndex);
    };
    const updateHistoryControls = () => {
        const exchanges = chatSessions[activeSessionIndex]?.exchanges || [];
        const total = exchanges.length;
        if (historyPrev) historyPrev.disabled = total < 2 || activeExchangeIndex <= 0;
        if (historyHead) historyHead.disabled = false;
        if (historyNext) historyNext.disabled = total < 2 || activeExchangeIndex < 0 || activeExchangeIndex >= total - 1;
        if (historyLabel) historyLabel.textContent = total ? `Messages ${activeExchangeIndex + 1} / ${total}` : 'Messages';
    };
    const renderSession = sessionIndex => {
        const session = chatSessions[sessionIndex];
        if (!session || !chatLog) return;
        activeSessionIndex = sessionIndex;
        activeExchangeIndex = session.exchanges.length - 1;
        chatLog.replaceChildren();
        const exchange = session.exchanges[activeExchangeIndex];
        if (exchange) {
            addChatMessage(exchange.answer, 'received');
            addChatMessage(exchange.user, 'sent');
        }
        if (chatEmpty) chatEmpty.hidden = session.exchanges.length > 0;
        updateHistoryControls();
    };
    const renderExchange = index => {
        const exchanges = chatSessions[activeSessionIndex]?.exchanges || [];
        const exchange = exchanges[index];
        if (!exchange || !chatLog) return;
        activeExchangeIndex = index;
        chatLog.replaceChildren();
        addChatMessage(exchange.answer, 'received');
        addChatMessage(exchange.user, 'sent');
        updateHistoryControls();
    };
    const saveChatHistory = () => {
        try { localStorage.setItem(chatHistoryStorageKey, JSON.stringify(chatSessions.slice(-20))); } catch (_) { /* storage is optional */ }
    };
    const refreshHistoryMenu = () => {
        if (!historyMenuList) return;
        historyMenuList.replaceChildren();
        if (!chatSessions.length) {
            const empty = document.createElement('div');
            empty.className = 'orbit-chat-history-menu-empty';
            empty.textContent = 'No previous chats yet';
            historyMenuList.appendChild(empty);
            return;
        }
        chatSessions.slice().reverse().forEach((session, reverseIndex) => {
            const index = chatSessions.length - 1 - reverseIndex;
            const item = document.createElement('div');
            item.className = 'orbit-chat-history-menu-item';
            const itemMain = document.createElement('button');
            itemMain.type = 'button';
            itemMain.className = 'orbit-chat-history-menu-item-main';
            const title = document.createElement('span');
            title.className = 'orbit-chat-history-menu-item-title';
            title.textContent = session.title;
            const meta = document.createElement('small');
            meta.className = 'orbit-chat-history-menu-item-meta';
            meta.textContent = `${session.exchanges.length} ${session.exchanges.length === 1 ? 'message' : 'messages'}`;
            itemMain.append(title, meta);
            itemMain.title = session.title;
            itemMain.addEventListener('click', () => {
                renderSession(index);
                historyMenu.hidden = true;
            });
            const actions = document.createElement('div');
            actions.className = 'orbit-chat-history-menu-actions';
            const rename = document.createElement('button');
            rename.type = 'button';
            rename.className = 'orbit-chat-history-action';
            rename.setAttribute('aria-label', `Rename ${session.title}`);
            rename.title = 'Rename chat';
            rename.textContent = '✎';
            rename.addEventListener('click', async () => {
                const nextTitle = await showHistoryDialog('rename', session);
                if (!nextTitle) return;
                session.title = nextTitle;
                saveChatHistory();
                refreshHistoryMenu();
            });
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'orbit-chat-history-action is-delete';
            remove.setAttribute('aria-label', `Delete ${session.title}`);
            remove.title = 'Delete chat';
            remove.textContent = '×';
            remove.addEventListener('click', async () => {
                if (!await showHistoryDialog('delete', session)) return;
                chatSessions.splice(index, 1);
                if (activeSessionIndex === index) {
                    activeSessionIndex = -1;
                    activeExchangeIndex = -1;
                    chatLog?.replaceChildren();
                    restoreChatWelcome();
                } else if (activeSessionIndex > index) {
                    activeSessionIndex -= 1;
                }
                saveChatHistory();
                refreshHistoryMenu();
                updateHistoryControls();
            });
            actions.append(rename, remove);
            item.append(itemMain, actions);
            historyMenuList.appendChild(item);
        });
    };
    const stopChatSpeech = () => {
        speechRequestId += 1;
        window.speechSynthesis?.cancel();
        window.maxaiBotSpeechStop?.();
        if (speechAudio) {
            speechAudio.onended = null;
            speechAudio.onerror = null;
            speechAudio.pause();
            speechAudio.removeAttribute('src');
            speechAudio.load();
            speechAudio = null;
        }
        if (speechAudioUrl) {
            URL.revokeObjectURL(speechAudioUrl);
            speechAudioUrl = '';
        }
        clearSpeechHighlight();
        speechUtterance = null;
    };
    const strictTtsEncode = value => encodeURIComponent(String(value)).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
    const splitTtsText = value => {
        const source = String(value || '').trim();
        const chunks = [];
        let start = 0;
        while (start < source.length) {
            let end = Math.min(source.length, start + 500);
            if (end < source.length) {
                const boundary = source.lastIndexOf(' ', end);
                if (boundary > start + 120) end = boundary;
            }
            chunks.push({ text: source.slice(start, end), start });
            start = end;
            while (source[start] === ' ') start += 1;
        }
        return chunks;
    };
    const playPublicTts = (spokenText, requestId) => new Promise((resolve, reject) => {
        const chunks = splitTtsText(spokenText);
        if (!chunks.length) return reject(new Error('No speech text.'));
        let chunkIndex = 0;
        let settled = false;
        const finish = (error) => {
            if (settled) return;
            settled = true;
            error ? reject(error) : resolve();
        };
        const playNext = async () => {
            if (speechRequestId !== requestId) return finish(new Error('Speech replaced.'));
            if (chunkIndex >= chunks.length) return finish();
            const chunk = chunks[chunkIndex];
            const audio = new Audio(`https://5t.gg?text=${strictTtsEncode(chunk.text)}&voice=af_heart`);
            audio.preload = 'auto';
            audio.volume = 1;
            speechAudio = audio;
            let started = false;
            const fail = () => finish(new Error('5t.gg audio failed.'));
            audio.onerror = fail;
            audio.onended = () => {
                if (speechAudio !== audio || speechRequestId !== requestId) return;
                chunkIndex += 1;
                if (chunkIndex >= chunks.length) {
                    window.maxaiBotSpeechStop?.();
                    clearSpeechHighlight();
                    speechAudio = null;
                    finish();
                } else {
                    playNext();
                }
            };
            audio.onloadedmetadata = async () => {
                if (started || speechRequestId !== requestId) return;
                started = true;
                if (!window.maxaiBotSpeechUrlStart?.(chunk.text, audio, chunk.start)) return fail();
                try { await audio.play(); } catch (error) { finish(error); }
            };
            audio.load();
        };
        playNext();
    });
    const speakChatMessage = async (text, messageElement) => {
        if (speakerControl?.classList.contains('is-muted') || !('speechSynthesis' in window)) return;
        stopChatSpeech();
        const requestId = speechRequestId;
        loadAssistantVoices();
        const voiceScore = voice => {
            const name = `${voice.name} ${voice.lang}`.toLowerCase();
            let score = 0;
            if (/natural|neural|online|premium/.test(name)) score += 100;
            if (/microsoft|google|aria|jenny|samantha|daniel|karen/.test(name)) score += 45;
            if (/en[-_]in/.test(name)) score += 24;
            if (/^en[-_]/.test(name)) score += 12;
            if (voice.localService === false) score += 18;
            return score;
        };
        const preferredVoice = assistantVoices
            .filter(voice => /^en[-_]/i.test(voice.lang))
            .sort((left, right) => voiceScore(right) - voiceScore(left))[0];
        const spokenText = String(text)
            .replace(/\bMax Ai\b/gi, 'Max A-I')
            .replace(/\bXtarNet\b/gi, 'Ex-tar Net');
        prepareSpeechMessage(messageElement, text, spokenText);

        // Start the local browser voice immediately. Waiting for a remote
        // TTS request here delays sound, mouth, and highlight together.

        speechUtterance = new SpeechSynthesisUtterance(spokenText);
        const utterance = speechUtterance;
        speechUtterance.voice = preferredVoice || null;
        speechUtterance.lang = preferredVoice?.lang || 'en-IN';
        speechUtterance.rate = 1;
        speechUtterance.pitch = .98;
        speechUtterance.volume = 1;
        speechUtterance.onstart = () => {
            if (speechUtterance !== utterance) return;
            speechBoundarySeen = false;
            speechBoundaryCharIndex = -1;
            // Give the user an immediate visual anchor even on speech
            // engines that delay their first boundary callback.
            setActiveSpeechWord(0);
            window.maxaiBotSpeechStart?.(spokenText, utterance.rate);
            // Some Web Speech implementations speak correctly but never
            // dispatch word boundaries. Use this only as a compatibility
            // fallback; a real boundary always disables it and remains the
            // authoritative timing source.
            speechFallbackTimeout = window.setTimeout(() => {
                speechFallbackTimeout = null;
                if (speechUtterance !== utterance || speechBoundarySeen || !speechWordSpans.length) return;
                const startedAt = performance.now();
                let fallbackIndex = 0;
                speechFallbackInterval = window.setInterval(() => {
                    if (speechUtterance !== utterance || speechBoundarySeen) {
                        clearInterval(speechFallbackInterval);
                        speechFallbackInterval = null;
                        return;
                    }
                    const elapsed = performance.now() - startedAt;
                    const rate = Math.max(.5, Number(utterance.rate) || 1);
                    let elapsedBefore = 0;
                    for (let index = 0; index < speechWordSpans.length; index += 1) {
                        const word = speechWordSpans[index].textContent || '';
                        const punctuation = /[.!?;,]$/.test(word) ? 150 : 70;
                        const duration = (punctuation + word.length * 38) / rate;
                        if (elapsed < elapsedBefore + duration) {
                            fallbackIndex = index;
                            break;
                        }
                        elapsedBefore += duration;
                        fallbackIndex = index;
                    }
                    setActiveSpeechWord(fallbackIndex);
                }, 50);
            }, 700);
        };
        speechUtterance.onboundary = event => {
            if (speechUtterance !== utterance) return;
            if (typeof event.charIndex !== 'number' || event.charIndex < speechBoundaryCharIndex) return;
            const eventDisplayIndex = displayWordIndexForChar(event.charIndex);
            if (eventDisplayIndex < 0) return;
            speechBoundaryCharIndex = event.charIndex;
            speechBoundarySeen = true;
            if (speechFallbackTimeout) clearTimeout(speechFallbackTimeout);
            if (speechFallbackInterval) clearInterval(speechFallbackInterval);
            speechFallbackTimeout = null;
            speechFallbackInterval = null;
            // Pass the speech engine's audio-relative timestamp so the bot
            // can compensate for delivery delay before this JS callback runs.
            // The bot returns the word currently reached by that calibrated
            // clock. This keeps the text and mouth on the same word when the
            // browser delivers boundary events late. Pages without the bot
            // still use the browser's own character index as a fallback.
                window.maxaiBotSpeechBoundary?.(event.charIndex, event.elapsedTime);
            // The boundary character index is the browser's actual spoken
            // word, so use it directly. The mouth receives the same event for
            // clock calibration but must not replace this highlight with a
            // predicted word later in the utterance.
            if (speechHighlightTimer) clearTimeout(speechHighlightTimer);
            speechHighlightTimer = window.setTimeout(() => {
                speechHighlightTimer = null;
                if (speechUtterance === utterance) setActiveSpeechWord(eventDisplayIndex);
            }, SPEECH_HIGHLIGHT_DELAY_MS);
        };
        speechUtterance.onend = () => {
            if (speechUtterance !== utterance) return;
            // Web Speech can fire `end` a little before the final audible
            // buffer reaches the speaker. Keep the final word and mouth
            // pose alive for that short output tail instead of ending early.
            if (speechHighlightTimer) clearTimeout(speechHighlightTimer);
            speechHighlightTimer = window.setTimeout(() => {
                speechHighlightTimer = null;
                if (speechUtterance !== utterance) return;
                window.maxaiBotSpeechStop?.();
                clearSpeechHighlight();
                speechUtterance = null;
            }, 140);
        };
        speechUtterance.onerror = () => {
            if (speechUtterance !== utterance) return;
            window.maxaiBotSpeechStop?.();
            clearSpeechHighlight();
            speechUtterance = null;
        };
        if (speechUtterance === utterance) window.speechSynthesis.speak(utterance);
    };
    const updateChatSendState = () => {
        const hasText = Boolean(chatInput?.value.trim());
        const cooldownActive = pollinationsCooldownUntil > performance.now();
        if (chatSend) chatSend.disabled = cooldownActive || (!hasText && !chatProcessing);
        chatSend?.classList.toggle('is-disabled', !hasText && !chatProcessing);
        chatSend?.classList.toggle('is-processing', chatProcessing);
        chatSend?.classList.toggle('is-cooldown', cooldownActive);
        if (chatSend) chatSend.setAttribute('aria-label', chatProcessing ? 'Stop response' : 'Send question');
    };
    const setAssistantMic = active => {
        assistantMicActive = active;
        micControl?.setAttribute('aria-pressed', String(active));
        micControl?.classList.toggle('is-active', active);
        micControl?.setAttribute('aria-label', active ? 'Turn microphone off' : 'Turn microphone on');
        if (!active && assistantMicTimeout) {
            clearTimeout(assistantMicTimeout);
            assistantMicTimeout = null;
        }
    };
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        assistantRecognition = new SpeechRecognition();
        assistantRecognition.continuous = true;
        assistantRecognition.interimResults = true;
        assistantRecognition.lang = 'en-IN';
        assistantRecognition.onresult = event => {
            let transcript = '';
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                transcript += event.results[index][0].transcript;
            }
            if (chatInput && transcript.trim()) {
                chatInput.value = transcript.trim();
                updateChatSendState();
            }
            assistantMicTimeout = window.setTimeout(() => setAssistantMic(false), 60000);
        };
        assistantRecognition.onerror = event => {
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                setAssistantMic(false);
            }
        };
        assistantRecognition.onend = () => {
            if (assistantMicActive) {
                window.setTimeout(() => {
                    try { assistantRecognition.start(); } catch (_) { /* already starting */ }
                }, 250);
            }
        };
    } else if (micControl) {
        micControl.disabled = true;
        micControl.setAttribute('aria-label', 'Speech recognition is not supported');
    }
    micControl?.addEventListener('click', () => {
        if (!assistantRecognition) return;
        if (assistantMicActive) {
            assistantRecognition.stop();
            setAssistantMic(false);
            return;
        }
        try {
            assistantRecognition.start();
            setAssistantMic(true);
        } catch (_) {
            setAssistantMic(false);
        }
    });
    speakerControl?.addEventListener('click', () => {
        const active = speakerControl.getAttribute('aria-pressed') !== 'true';
        speakerControl.setAttribute('aria-pressed', String(active));
        speakerControl.classList.toggle('is-muted', !active);
        speakerControl.setAttribute('aria-label', active ? 'Turn speaker off' : 'Turn speaker on');
        if (!active) window.speechSynthesis?.cancel();
        if (!active) stopChatSpeech();
    });
    chatInput?.addEventListener('input', updateChatSendState);
    updateChatSendState();
    renderSuggestions();
    const setChatOpen = open => {
        if (open) {
            if (document.body.classList.contains('bot-chat-open')) return;
            document.body.classList.add('bot-chat-open');
            if (botDockLayer) { botDockLayer.remove(); botDockLayer = null; }
            chatPanel.hidden = false;
            chatSlot.appendChild(orbitBotHost);
            orbitBotHost.classList.add('bot-chat-bot');
            requestAnimationFrame(() => chatPanel.classList.add('is-open'));
            window.setTimeout(() => chatInput?.focus(), 220);
        } else {
            if (assistantMicActive) {
                assistantRecognition?.stop();
                setAssistantMic(false);
            }
            chatAbortController?.abort();
            stopChatSpeech();
            chatPanel.classList.remove('is-open');
            document.body.classList.remove('bot-chat-open');
            orbitBotHost.classList.remove('bot-chat-bot');
            if (orbitBotHome?.isConnected && orbitBotAnchor?.isConnected) orbitBotHome.insertBefore(orbitBotHost, orbitBotAnchor.nextSibling);
            // Reset the previous docking marker before recalculating. Without
            // this, updateOrbitAi sees a stale docked state and returns early,
            // leaving the bot detached from the bottom-right dock.
            orbitHero.classList.remove('bot-docked-state', 'ai-returning');
            window.setTimeout(() => {
                chatPanel.hidden = true;
                updateOrbitAi();
            }, 220);
        }
    };
    const toggleChat = () => {
        // Once the bot has moved into the panel, keep it there. The close
        // button is the intentional control for dismissing the panel.
        if (orbitBotHost.classList.contains('bot-chat-bot')) return;
        setChatOpen(true);
    };
    // Capture the click before the 3D renderer handles the canvas event. This
    // keeps the panel toggle reliable while the bot is still in the hero orbit.
    orbitBotHost.addEventListener('click', toggleChat, true);
    // The orbit artwork can sit above the transformed bot in the hit-test
    // stack. Catch clicks on the hero and use the bot's visible screen bounds
    // so clicking the top bot always opens the panel.
    orbitHero.addEventListener('click', event => {
        if (document.body.classList.contains('bot-chat-open')) return;
        const rect = orbitBotHost.getBoundingClientRect();
        const insideBot = event.clientX >= rect.left && event.clientX <= rect.right
            && event.clientY >= rect.top && event.clientY <= rect.bottom;
        if (insideBot) setChatOpen(true);
    }, true);
    closeChat?.addEventListener('click', () => setChatOpen(false));
    chatForm?.addEventListener('submit', async event => {
        event.preventDefault();
        if (chatProcessing) {
            chatAbortController?.abort();
            return;
        }
        if (pollinationsCooldownUntil > performance.now()) return;
        const message = chatInput.value.trim();
        if (!message) return;
        if (assistantMicActive) { assistantRecognition?.stop(); setAssistantMic(false); }
        removeChatWelcome();
        if (!chatSessions[activeSessionIndex]) {
            chatSessions.push({ title: message, createdAt: Date.now(), exchanges: [] });
            activeSessionIndex = chatSessions.length - 1;
        }
        const activeSession = chatSessions[activeSessionIndex];
        chatLog?.replaceChildren();
        const thinkingMessage = addThinkingMessage();
        addChatMessage(message, 'sent');
        chatInput.value = '';
        chatProcessing = true;
        chatAbortController = new AbortController();
        if (chatSend) chatSend.textContent = '×';
        updateChatSendState();
        let pollinationsCountdownTimer = null;
        try {
            const prompt = buildScopedSystemPrompt(message);
            const elapsedSinceLastRequest = lastPollinationsRequestAt > 0
                ? performance.now() - lastPollinationsRequestAt
                : POLLINATIONS_REQUEST_GAP_MS;
            const waitMs = Math.max(0, POLLINATIONS_REQUEST_GAP_MS - elapsedSinceLastRequest);
            if (waitMs > 0) {
                const updateCountdown = () => {
                    const remaining = Math.max(0, POLLINATIONS_REQUEST_GAP_MS - (performance.now() - lastPollinationsRequestAt));
                    const seconds = Math.ceil(remaining / 1000);
                    setThinkingLabel(thinkingMessage, `Waiting ${seconds}s`);
                    if (chatSend) {
                        chatSend.disabled = true;
                        chatSend.classList.add('is-cooldown');
                        chatSend.textContent = `Wait ${seconds}s`;
                    }
                };
                updateCountdown();
                pollinationsCountdownTimer = window.setInterval(updateCountdown, 250);
                await new Promise((resolve, reject) => {
                    const timer = window.setTimeout(resolve, waitMs);
                    const cancelWait = () => {
                        window.clearTimeout(timer);
                        reject(new DOMException('Request cancelled.', 'AbortError'));
                    };
                    chatAbortController.signal.addEventListener('abort', cancelWait, { once: true });
                });
                window.clearInterval(pollinationsCountdownTimer);
                pollinationsCountdownTimer = null;
            }
            if (chatAbortController.signal.aborted) throw new DOMException('Request cancelled.', 'AbortError');
            setThinkingLabel(thinkingMessage, 'Thinking');
            lastPollinationsRequestAt = performance.now();
            const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, { signal: chatAbortController.signal });
            if (!response.ok) throw new Error(`Assistant request failed (${response.status})`);
            const answer = (await response.text()).trim() || 'I could not produce a response.';
            // Start the cooldown from the moment the answer is received, so
            // the user sees the result first and the button then counts down
            // the full protection gap before another API request is allowed.
            lastPollinationsRequestAt = performance.now();
            startPollinationsCooldown();
            thinkingMessage.textContent = answer;
            thinkingMessage.classList.remove('is-loading');
            thinkingMessage.removeAttribute('aria-label');
            activeSession.exchanges.push({ user: message, answer });
            activeExchangeIndex = activeSession.exchanges.length - 1;
            saveChatHistory();
            refreshHistoryMenu();
            updateHistoryControls();
            conversationHistory.push({ role: 'user', content: message }, { role: 'assistant', content: answer });
            speakChatMessage(answer, thinkingMessage);
        } catch (error) {
            thinkingMessage.textContent = error.name === 'AbortError'
                ? 'Response stopped.'
                : 'The AI service is temporarily unavailable. Please try again in a moment.';
            thinkingMessage.classList.remove('is-loading');
        } finally {
            if (pollinationsCountdownTimer) window.clearInterval(pollinationsCountdownTimer);
            chatProcessing = false;
            chatAbortController = null;
            refreshPollinationsCooldown();
            if (!pollinationsCooldownTimer) updateChatSendState();
        }
    });
    historyPrev?.addEventListener('click', () => renderExchange(activeExchangeIndex - 1));
    newChatButton?.addEventListener('click', () => {
        activeSessionIndex = -1;
        activeExchangeIndex = -1;
        chatLog?.replaceChildren();
        restoreChatWelcome();
        renderSuggestions();
        historyMenu.hidden = true;
        updateHistoryControls();
        chatInput?.focus();
    });
    historyHead?.addEventListener('click', () => {
        refreshHistoryMenu();
        historyMenu.hidden = !historyMenu.hidden;
    });
    historyNext?.addEventListener('click', () => renderExchange(activeExchangeIndex + 1));
    document.addEventListener('click', event => {
        if (!historyMenu.hidden && !historyMenu.contains(event.target) && !historyHead.contains(event.target)) historyMenu.hidden = true;
    });
    refreshHistoryMenu();
    if (chatSessions.length) renderSession(activeSessionIndex);
    updateHistoryControls();
}

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

// hourly.time strings ("2026-08-22T14:00") are naive local time for the WEATHER
// LOCATION, not the browser. Passing them to `new Date(...)` makes JS reinterpret
// them in the browser's own timezone, silently shifting the hour label. Parse the
// hour directly out of the string instead.
const formatHour = (value) => {
    if (typeof value !== 'string' || value.length < 13) return '';
    const hour = Number(value.slice(11, 13));
    if (!Number.isFinite(hour)) return '';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
};

// daily.time strings are date-only ("2026-08-22"). `new Date("2026-08-22")` parses
// as UTC midnight, which can land on the PREVIOUS calendar day once formatted in a
// negative-UTC-offset timezone. Build the Date from local y/m/d components instead
// so the weekday can't shift.
const formatDay = (value) => {
    if (typeof value !== 'string') return '';
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return '';
    return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(year, month - 1, day));
};

const renderWeatherChart = (container, hourly, mode = 'temperature', startIndex = 0) => {
    if (!container) return;
    const temps = hourly?.temperature_2m || [];
    const precip = hourly?.precipitation_probability || [];
    const wind = hourly?.wind_speed_10m || hourly?.windspeed_10m || [];
    const times = hourly?.time || [];
    const source = mode === 'precipitation' ? precip : mode === 'wind' ? wind : temps;
    const rawSlice = source.slice(startIndex, startIndex + 8);
    // Some locations/models return null (not 0) for a given hour/variable when
    // that data genuinely isn't available -- treat those as gaps, not zeros.
    const validEntries = rawSlice
        .map((value, index) => ({ value: Number(value), timeValue: times[startIndex + index] }))
        .filter(entry => Number.isFinite(entry.value));

    if (!validEntries.length) {
        container.innerHTML = `<p style="grid-column:1 / -1;margin:0;padding:8px 4px;color:var(--muted);font:11px 'DM Mono',monospace;text-align:center;">No ${mode} data available for this location right now.</p>`;
        return;
    }

    const points = validEntries.map(entry => entry.value);
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = Math.max(max - min, 1);
    const suffix = mode === 'precipitation' ? '%' : mode === 'wind' ? ' km/h' : '°';
    container.innerHTML = validEntries.map(({ value, timeValue }) => {
        const pct = 18 + ((value - min) / range) * 64;
        const label = timeValue ? formatHour(timeValue) : '';
        return `<div class="weather-chart-point"><span style="bottom:${pct}%">${Math.round(value)}${suffix}</span><i></i><small>${label}</small></div>`;
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
    renderWeatherChart(desktopWeatherPopoverChart, weatherSnapshot.hourly, activeWeatherMode, weatherSnapshot.currentHourIndex || 0);
    renderWeatherChart(mobileWeatherPopoverChart, weatherSnapshot.hourly, activeWeatherMode, weatherSnapshot.currentHourIndex || 0);
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

/* ---------------------------------------------------------------------
 * Location + weather fetching -- entirely free, keyless services:
 *   Weather: Open-Meteo (free, unlimited for non-commercial use, no key).
 *   Location: chained IP-geolocation fallbacks, all free and keyless:
 *     1. ipapi.co   -- free tier (soft cap around 30k req/month).
 *     2. geojs.io   -- free, no published rate cap.
 *     3. ipwho.is   -- free, no key, extra resilience if both above fail.
 *     4. Fixed default location as an absolute last resort.
 * Every failure is logged to the console so it's easy to diagnose which
 * service (if any) is having trouble.
 * ------------------------------------------------------------------- */

const DEFAULT_WEATHER_LOCATION = { latitude: 51.5072, longitude: -0.1276, label: 'London, UK' };

const fetchWithTimeout = async (url, options = {}, timeoutMs = 6000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

// IP-based location only -- no browser geolocation prompt, no paid/keyed services.
const resolveWeatherLocation = async () => {
    try {
        const res = await fetchWithTimeout('https://ipapi.co/json/', { cache: 'no-store' }, 5000);
        if (!res.ok) throw new Error(`ipapi.co responded ${res.status}`);
        const data = await res.json();
        const lat = Number(data.latitude);
        const lon = Number(data.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('ipapi.co returned invalid coordinates');
        return { latitude: lat, longitude: lon, label: [data.city, data.region || data.country_name].filter(Boolean).join(', ') };
    } catch (ipapiError) {
        console.warn('[weather] ipapi.co lookup failed, trying geojs.io instead:', ipapiError);
        try {
            const res = await fetchWithTimeout('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-store' }, 5000);
            if (!res.ok) throw new Error(`geojs.io responded ${res.status}`);
            const data = await res.json();
            const lat = Number(data.latitude);
            const lon = Number(data.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('geojs.io returned invalid coordinates');
            return { latitude: lat, longitude: lon, label: [data.city, data.region || data.country || ''].filter(Boolean).join(', ') };
        } catch (geojsError) {
            console.warn('[weather] geojs.io lookup failed too, trying ipwho.is instead:', geojsError);
            try {
                const res = await fetchWithTimeout('https://ipwho.is/', { cache: 'no-store' }, 5000);
                if (!res.ok) throw new Error(`ipwho.is responded ${res.status}`);
                const data = await res.json();
                if (data.success === false) throw new Error(data.message || 'ipwho.is lookup unsuccessful');
                const lat = Number(data.latitude);
                const lon = Number(data.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('ipwho.is returned invalid coordinates');
                return { latitude: lat, longitude: lon, label: [data.city, data.region || data.country || ''].filter(Boolean).join(', ') };
            } catch (ipwhoError) {
                console.warn('[weather] ipwho.is lookup failed too, using default location:', ipwhoError);
                return DEFAULT_WEATHER_LOCATION;
            }
        }
    }
};

const updateHeaderWeather = async () => {
    if (!desktopWeather && !mobileWeather) return;

    try {
        const { latitude: lat, longitude: lon, label } = await resolveWeatherLocation();

        const weatherRes = await fetchWithTimeout(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max&timezone=auto&windspeed_unit=kmh&precipitation_unit=mm`,
            { cache: 'no-store' },
            8000
        );
        if (!weatherRes.ok) throw new Error(`Weather lookup failed: ${weatherRes.status}`);
        const weather = await weatherRes.json();
        const temp = weather?.current_weather?.temperature;
        const code = weather?.current_weather?.weather_code ?? weather?.current_weather?.weathercode;
        const daily = weather?.daily || {};
        const hourly = weather?.hourly || {};

        // Open-Meteo's hourly arrays always start at local midnight, NOT the current
        // hour. Reading index [0] (as before) silently pulled midnight's humidity/
        // wind/rain numbers while the temperature came from current_weather (which
        // IS live) -- producing mismatched values like "Light drizzle, Rain 0%".
        //
        // current_weather.time and hourly.time are both naive local-time strings
        // from the SAME response (timezone=auto), e.g. "2026-08-22T14:32" and
        // "2026-08-22T14:00". Match them with plain string slicing only -- never
        // run either through `new Date(...)`, because a bare "YYYY-MM-DDTHH:mm"
        // string with no timezone offset gets parsed in the BROWSER's local
        // timezone, not the weather location's. That mismatch is what was
        // shifting the chart's start hour.
        const currentWeatherTime = weather?.current_weather?.time || '';
        const hourlyTimes = hourly.time || [];
        const currentHourKey = currentWeatherTime.slice(0, 13); // "YYYY-MM-DDTHH"
        let currentHourIndex = hourlyTimes.findIndex(t => t.slice(0, 13) === currentHourKey);
        if (currentHourIndex === -1) currentHourIndex = 0;

        const tempText = Number.isFinite(temp) ? `${Math.round(temp)}°` : '--°';
        const iconText = weatherIconForCode(code);
        const place = label || 'Current location';
        const condition = weatherLabelForCode(code);
        const hi = Number.isFinite(daily.temperature_2m_max?.[0]) ? `H ${Math.round(daily.temperature_2m_max[0])}°` : 'H --°';
        const lo = Number.isFinite(daily.temperature_2m_min?.[0]) ? `L ${Math.round(daily.temperature_2m_min[0])}°` : 'L --°';
        const dayLabel = (() => {
            const t = daily.time?.[0];
            if (!t) return 'Today';
            const [y, m, d] = t.split('-').map(Number);
            if (!y || !m || !d) return 'Today';
            return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(y, m - 1, d));
        })();
        const humidity = hourly.relative_humidity_2m?.[currentHourIndex];
        const wind = weather?.current_weather?.windspeed ?? (hourly.wind_speed_10m?.[currentHourIndex] ?? hourly.windspeed_10m?.[currentHourIndex]);
        const rain = hourly.precipitation_probability?.[currentHourIndex];
        weatherSnapshot = { tempText, iconText, place, condition, hi, lo, dayLabel, humidity, wind, rain, hourly, daily, currentHourIndex };

        [desktopWeatherTemp, mobileWeatherTemp].forEach(el => {
            if (el) el.textContent = tempText;
        });
        [desktopWeatherIcon, mobileWeatherIcon].forEach(el => {
            if (el) el.textContent = iconText;
        });
        if (desktopWeather) desktopWeather.title = place;
        if (mobileWeather) mobileWeather.title = place;

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
            renderWeatherChart(chartEl, hourly, activeWeatherMode, currentHourIndex);
            renderWeatherForecast(forecastEl, daily);
        });
        syncWeatherTabs();
        setSelectedWeatherDay(selectedWeatherDay);
    } catch (error) {
        console.error('[weather] Unable to load live weather data:', error);
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

const cleanCardText = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
const weakArticleTitle = (article) => {
    const title = cleanCardText(article.title);
    const slug = String(article.slug || article.id || '').toLowerCase();
    return !title || title.toLowerCase() === slug || title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() === slug;
};
const pageCardSummary = (doc) => {
    const candidates = [
        doc.querySelector('.post-dek'),
        doc.querySelector('.post-copy p.hook'),
        doc.querySelector('.post-copy p'),
        doc.querySelector('main article p'),
        doc.querySelector('article p')
    ];
    return cleanCardText(candidates.find(node => cleanCardText(node?.textContent).length > 24)?.textContent || '');
};
const hydrateArticleCardData = async (items) => {
    const result = [...items];
    let cursor = 0;
    const worker = async () => {
        while (cursor < result.length) {
            const index = cursor++;
            const article = result[index];
            const hasSummary = cleanCardText(article.excerpt || article.description || article.dek || article.summary).length > 24;
            if ((!weakArticleTitle(article) && hasSummary) || !String(article.url || '').startsWith('/')) {
                if (!hasSummary) article.excerpt = `Read the full ${String(article.category || 'news').toLowerCase()} signal from NewsXphere.`;
                continue;
            }
            try {
                const response = await fetch(article.url, { cache: 'no-store' });
                if (response.ok) {
                    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
                    const pageTitle = cleanCardText(doc.querySelector('.post-title')?.textContent || doc.querySelector('h1')?.textContent);
                    const pageSummary = pageCardSummary(doc);
                    if (weakArticleTitle(article) && pageTitle) article.title = pageTitle;
                    if (!hasSummary) article.excerpt = pageSummary || `Read the full ${String(article.category || 'news').toLowerCase()} signal from NewsXphere.`;
                }
            } catch {}
            if (!cleanCardText(article.excerpt || article.description || article.dek || article.summary)) article.excerpt = `Read the full ${String(article.category || 'news').toLowerCase()} signal from NewsXphere.`;
        }
    };
    await Promise.all(Array.from({ length: Math.min(8, result.length) }, worker));
    return result;
};
const articleCardExcerpt = (article) => cleanCardText(article.excerpt || article.description || article.dek || article.summary) || `Read the full ${String(article.category || 'news').toLowerCase()} signal from NewsXphere.`;

const searchTokens = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter(token => token.length > 1);
const searchWords = value => [...new Set(searchTokens(value).flatMap(token => token.split('-')).filter(Boolean))];
const editDistance = (left, right) => {
    const a = String(left || ''), b = String(right || '');
    if (a === b) return 0;
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let row = 1; row <= a.length; row += 1) {
        const current = [row];
        for (let column = 1; column <= b.length; column += 1) current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1));
        previous = current;
    }
    return previous[b.length];
};
// Private, on-device fuzzy matching handles typos and imperfect wording.
const fuzzyTokenMatch = (queryToken, candidateWords) => {
    let best = 0;
    candidateWords.forEach(word => {
        if (word === queryToken) best = Math.max(best, 1);
        else if (word.includes(queryToken) || queryToken.includes(word)) best = Math.max(best, 0.86);
        else if (queryToken.length >= 3 && word.length >= 3 && editDistance(queryToken, word) <= (queryToken.length >= 5 ? 2 : 1)) best = Math.max(best, 0.68);
    });
    return { matched: best > 0, strength: best };
};
// Private, on-device intent classifier used to improve natural-language search.
const intentFeatures = {
    World: ['world', 'iran', 'war', 'oil', 'maritime', 'security', 'global', 'geopolitics', 'hormuz', 'tanker'],
    Startups: ['startup', 'founder', 'funding', 'venture', 'vc', 'valuation', 'company', 'business'],
    Tech: ['tech', 'technology', 'ai', 'artificial', 'software', 'iphone', 'cloud', 'model', 'robot', 'app'],
    Culture: ['culture', 'design', 'film', 'music', 'city', 'architecture', 'community'],
    Job: ['job', 'jobs', 'career', 'hiring', 'work', 'salary', 'employment']
};
const inferSearchIntent = query => {
    const tokens = searchTokens(query);
    return Object.entries(intentFeatures).map(([category, words]) => ({
        category,
        score: tokens.reduce((sum, token) => sum + (words.some(word => word === token || word.includes(token) || token.includes(word)) ? 1 : 0), 0)
    })).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
};
const articleSearchScore = (article, query) => {
    const q = String(query || '').trim().toLowerCase();
    const tokens = searchTokens(q);
    if (!q || !tokens.length) return 0;
    const title = cleanCardText(article.title).toLowerCase();
    const text = articleSearchText(article).toLowerCase();
    const slug = String(article.slug || article.id || '').toLowerCase();
    const titleWords = searchWords(title);
    const textWords = searchWords(text);
    const slugWords = searchWords(slug);
    const intent = inferSearchIntent(q).find(item => item.category === article.category);
    let score = title === q ? 1000 : title.includes(q) ? 280 : 0;
    if (slug === q || slug.includes(q.replace(/\s+/g, '-'))) score += 220;
    for (const token of tokens) {
        if (title.includes(token)) score += 75;
        if (text.includes(token)) score += 24;
        if (slug.includes(token)) score += 35;
        score += fuzzyTokenMatch(token, titleWords).strength * 58;
        score += fuzzyTokenMatch(token, textWords).strength * 18;
        score += fuzzyTokenMatch(token, slugWords).strength * 28;
    }
    if (intent) score += intent.score * 55;
    const compact = tokens.join(' ');
    const phraseWords = title.split(/\s+/);
    for (let i = 0; i < phraseWords.length - 1; i += 1) if (`${phraseWords[i]} ${phraseWords[i + 1]}`.includes(compact)) score += 90;
    return score / Math.max(1, tokens.length);
};
const rankArticles = (query, items = articles) => { const tokens = searchTokens(query); return [...items].map(article => { const title = cleanCardText(article.title).toLowerCase(); const text = articleSearchText(article).toLowerCase(); const slug = String(article.slug || article.id || '').toLowerCase(); const phrase = title.includes(String(query || '').trim().toLowerCase()) || slug.includes(String(query || '').trim().toLowerCase().replace(/\s+/g, '-')); const candidateWords = searchWords(`${title} ${text} ${slug}`); const matched = tokens.filter(token => fuzzyTokenMatch(token, candidateWords).matched).length; return { article, score: articleSearchScore(article, query), valid: phrase || matched >= Math.max(1, Math.ceil(tokens.length * 0.5)) }; }).filter(item => item.valid && item.score > 0).sort((a, b) => b.score - a.score || Date.parse(b.article.updatedAt || b.article.publishedAt || '') - Date.parse(a.article.updatedAt || a.article.publishedAt || '')).map(item => item.article); };
const encodeSearchQuery = value => encodeURIComponent(String(value || '').trim()).replace(/%20/g, '+');
const getRecentSearches = () => { try { const items = JSON.parse(localStorage.getItem(recentSearchesKey) || '[]'); return Array.isArray(items) ? items.filter(Boolean).slice(0, 5) : []; } catch { return []; } };
const rememberSearch = query => { const normalized = String(query || '').trim().replace(/\s+/g, ' '); if (!normalized) return; const next = [normalized, ...getRecentSearches().filter(item => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 5); localStorage.setItem(recentSearchesKey, JSON.stringify(next)); };
const submitSearch = value => { const query = String(value || '').trim(); if (!query) return showToast('Type something to search'); rememberSearch(query); window.location.href = `/results?search_query=${encodeSearchQuery(query)}`; };

const articleCardTemplate = (article, index = 0) => `
    <article class="story-card ${index === 0 ? 'card-dark' : ''}" data-topic="${escapeHtml(article.category)}" data-search="${escapeHtml(articleSearchText(article))}">
        <a class="story-card-link" href="${escapeHtml(article.url)}" aria-label="Read ${escapeHtml(article.title)}">
            <div class="card-visual image-card">
                <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.imageAlt || article.title)}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" fetchpriority="${index === 0 ? 'high' : 'low'}">
                <span>${escapeHtml(article.label || article.category)}</span>
                <b>↗</b>
            </div>
            <div class="card-body">
                <p class="card-topic">
                    ${escapeHtml(article.category)} <i>·</i>
                    ${escapeHtml(article.readTime || 'Quick read')}
                </p>
                <h3>${escapeHtml(article.title)}</h3>
                <p>${escapeHtml(articleCardExcerpt(article))}</p>
            </div>
        </a>
        <div class="card-footer">
            <span>${escapeHtml(article.author)} · ${escapeHtml(formatDate(article.publishedAt))}</span>
            <button class="save-button" aria-label="Save story: ${escapeHtml(article.title)}" data-save="${escapeHtml(article.id)}" type="button">♡</button>
        </div>
    </article>
`;

const jobPlane = `<svg class="nx-plane" viewBox="0 0 26 16" aria-hidden="true"><g class="nx-trail"><path d="M0 5H-6M1 9H-8M-1 12H-4"/></g><path d="M4 10 2 2h3l4.5 8"/><path class="nx-plane-body" d="M3.5 10H20c2.8 0 4.6 1.1 4.6 2.2S22.8 14.4 20 14.4H7c-1.9 0-3.1-1.6-3.5-4.4z"/><path d="M16.8 14.4 12.6 17h-3l2.4-2.8"/><path d="M9 12.4h10.5" stroke-dasharray=".01 2.2"/></svg>`;
const jobCardTemplate = job => `<article class="nx-job${job.featured ? ' nx-job--feature' : ''}" data-tint="${escapeHtml(job.tint || 'sage')}" style="--job-img:url('${escapeHtml(job.image || '')}')"><span class="nx-job__bgimg" aria-hidden="true"></span><header class="nx-job__top"><span class="nx-job__logo" aria-hidden="true">${escapeHtml(job.logo || job.company?.[0] || 'J')}</span><div class="nx-job__who"><span class="nx-job__co"><span class="nx-job__company">${escapeHtml(job.company)}</span><svg class="nx-job__verified" viewBox="0 0 24 24" role="img" aria-label="Verified employer"><path d="M12 2.5l2.4 1.7 2.9-.1 1 2.7 2.4 1.7-.9 2.8.9 2.8-2.4 1.7-1 2.7-2.9-.1L12 21.5l-2.4-1.7-2.9.1-1-2.7-2.4-1.7.9-2.8.9 2.8 2.4 1.7 1 2.7 2.9-.1z"/><path d="M8.5 12.2l2.5 2.5 4.5-4.9" class="tick"/></svg></span><span class="nx-job__time">${escapeHtml(job.posted || '')}</span></div><span class="nx-job__badge" data-badge="${job.urgent ? 'urgent' : String(job.badge || 'Hiring').toLowerCase()}">${escapeHtml(job.badge || 'Hiring')}</span></header><h3 class="nx-job__title"><a href="${escapeHtml(job.applyUrl || '#')}">${escapeHtml(job.title)}</a></h3><p class="nx-job__pitch">${escapeHtml(job.summary || '')}</p><div class="nx-job__tags">${(job.skills || []).slice(0, 3).map(skill => `<span>${escapeHtml(skill)}</span>`).join('')}</div><dl class="nx-job__facts"><div><dt>Location</dt><dd>${escapeHtml(job.location)}${job.mode ? `<em>${escapeHtml(job.mode)}</em>` : ''}</dd></div><div><dt><span class="nx-long">Experience</span><span class="nx-short">Exp.</span></dt><dd>${escapeHtml(job.experience)}</dd></div><div><dt>Job type</dt><dd>${escapeHtml(job.type)}</dd></div></dl><footer class="nx-job__foot"><div class="nx-job__offer"><span class="nx-job__pay">${escapeHtml(job.salary)} <small>${escapeHtml(job.unit || '')}</small></span><span class="nx-job__deadline"${job.urgent ? ' data-urgent="true"' : ''}>${escapeHtml(job.deadline || '')}</span></div><div class="nx-job__acts"><button class="nx-job__send" type="button" aria-pressed="false" aria-label="Save ${escapeHtml(job.title)}" title="Save this job" data-job-save="${escapeHtml(job.id)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="nx-heart" d="M12 20.3s-7.3-4.4-9.7-8.9C.9 8 2.3 4.7 5.6 4.2a5 5 0 0 1 6.4 2 5 5 0 0 1 6.4-2c3.3.5 4.7 3.8 3.3 7.2-2.4 4.5-9.7 8.9-9.7 8.9z"/></svg></button><a class="nx-job__apply" href="${escapeHtml(job.applyUrl || '#')}" target="_blank" rel="noopener" aria-label="Apply for ${escapeHtml(job.title)} at ${escapeHtml(job.company)}">Apply <i>${jobPlane}</i></a></div></footer></article>`;
const randomJobPair = () => { const picked = [...jobs].sort(() => Math.random() - 0.5).slice(0, 2); return picked.length === 2 ? `<section class="nx-jobstack" aria-label="Featured jobs">${picked.map(jobCardTemplate).join('')}</section>` : ''; };
const syncJobStackHeight = () => {
    if (!storyGrid || body.classList.contains('results-page')) return;
    const stack = storyGrid.querySelector('.nx-jobstack');
    const references = [...storyGrid.querySelectorAll('.story-card')];
    if (!stack || !references.length) return;
    references.forEach(reference => reference.style.removeProperty('min-height'));
    stack.style.removeProperty('--nx-job-pair-height');
    stack.style.removeProperty('height');
    const articleHeight = Math.max(...references.map(reference => reference.getBoundingClientRect().height));
    const jobPairHeight = stack.scrollHeight;
    const height = Math.ceil(Math.max(articleHeight, jobPairHeight));
    if (height > 0) {
        stack.style.setProperty('--nx-job-pair-height', `${height}px`);
    }
};
let jobStackResizeTimer;
const scheduleJobStackHeight = () => { clearTimeout(jobStackResizeTimer); jobStackResizeTimer = setTimeout(() => requestAnimationFrame(syncJobStackHeight), 80); };
window.addEventListener('resize', scheduleJobStackHeight, { passive: true });
window.addEventListener('orientationchange', scheduleJobStackHeight, { passive: true });
window.addEventListener('load', scheduleJobStackHeight, { once: true });
const syncJobSaveButtons = () => document.querySelectorAll('[data-job-save]').forEach(button => { const key = `newsxphere-job-${button.dataset.jobSave}`; const sync = () => { const saved = localStorage.getItem(key) === 'true'; button.setAttribute('aria-pressed', String(saved)); }; sync(); if (button.dataset.bound === 'true') return; button.dataset.bound = 'true'; button.addEventListener('click', event => { event.preventDefault(); const nextSaved = localStorage.getItem(key) !== 'true'; localStorage.setItem(key, String(nextSaved)); if (nextSaved) localStorage.setItem(savedTimeKey(`job-${button.dataset.jobSave}`), String(Date.now())); else localStorage.removeItem(savedTimeKey(`job-${button.dataset.jobSave}`)); updateSaved(); button.classList.remove('is-pop'); void button.offsetWidth; button.classList.add('is-pop'); const acts = button.parentNode; acts.setAttribute('data-tip', nextSaved ? 'Saved' : 'Removed'); clearTimeout(acts._jobTip); acts._jobTip = setTimeout(() => acts.removeAttribute('data-tip'), 1300); sync(); }); });
const loadJobs = async () => { try { const response = await fetch(jobDataUrl, { cache: 'no-store' }); if (!response.ok) throw Error('Jobs unavailable'); const data = await response.json(); jobs = Array.isArray(data) ? data : data.jobs || []; } catch { jobs = []; } };

const setCount = (count) => {
    const label = `${count} ${count === 1 ? 'story' : 'stories'}`;
    const status = document.querySelector('#result-status');
    const countEl = document.querySelector('#search-result-count');
    if (status) status.textContent = label;
    if (countEl) countEl.textContent = label;
};

const getFilteredArticles = (value = search ? search.value : '') => {
    const query = (value || '').trim();
    const active = document.querySelector('.topic.active')?.dataset.topic || 'All';
    const matches = query ? new Set(rankArticles(query, articles).map(article => article.id)) : null;
    return articles.filter(article => {
        const matchTopic = active === 'All' || article.category === active;
        const matchSearch = !query || matches.has(article.id);
        return matchTopic && matchSearch;
    });
};

const renderStoryGrid = (items) => {
    if (!storyGrid) return;
    storyGrid.dataset.ready = 'true';
    const cards = items.map(articleCardTemplate);
    if (!body.classList.contains('results-page') && jobs.length >= 2) cards.splice(Math.min(2, cards.length), 0, randomJobPair());
    storyGrid.innerHTML = cards.join('');
    syncSaveButtons();
    syncJobSaveButtons();
    scheduleJobStackHeight();
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

const savedTimeKey = key => `newsxphere-save-at-${key}`;
const getSavedAt = key => Number(localStorage.getItem(savedTimeKey(key)) || 0);
const formatSavedAt = value => value ? new Intl.DateTimeFormat(navigator.language || 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'recently';
const getSavedArticles = () => articles.filter(article => localStorage.getItem(`newsxphere-save-${article.id}`) === 'true').map(item => ({ type: 'story', item, savedAt: getSavedAt(item.id) }));
const getSavedJobs = () => jobs.filter(job => localStorage.getItem(`newsxphere-job-${job.id}`) === 'true').map(item => ({ type: 'job', item, savedAt: getSavedAt(`job-${item.id}`) }));
const savedEntrySearchText = ({ type, item }) => type === 'job'
    ? `${item.title || ''} ${item.company || ''} ${item.summary || ''} ${item.location || ''} ${item.mode || ''} ${(item.skills || []).join(' ')} ${item.type || ''}`
    : articleSearchText(item);
const rankSavedEntries = (entries, query) => {
    const tokens = searchTokens(query);
    if (!tokens.length) return entries;
    return entries.map(entry => {
        const words = searchWords(savedEntrySearchText(entry));
        const matches = tokens.map(token => fuzzyTokenMatch(token, words));
        const matched = matches.filter(result => result.matched).length;
        const score = matches.reduce((sum, result) => sum + result.strength, 0) / Math.max(1, tokens.length);
        return { entry, matched, score };
    }).filter(result => result.matched >= Math.max(1, Math.ceil(tokens.length * 0.45))).sort((a, b) => b.score - a.score || b.entry.savedAt - a.entry.savedAt).map(result => result.entry);
};

function updateSaved() {
    const allSaved = [...getSavedArticles(), ...getSavedJobs()].sort((a, b) => b.savedAt - a.savedAt);
    const filtered = savedFilter === 'all' ? allSaved : allSaved.filter(entry => savedFilter === 'jobs' ? entry.type === 'job' : entry.type === 'story');
    const saved = savedSearchActive ? rankSavedEntries(filtered, savedSearchQuery) : filtered;
    const savedCount = document.querySelector('#saved-count');
    const list = document.querySelector('#saved-list');
    if (savedCount) savedCount.textContent = allSaved.length;
    document.querySelectorAll('[data-saved-filter]').forEach(button => {
        const active = button.dataset.savedFilter === savedFilter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    if (!list) return;
    list.innerHTML = saved.length
        ? saved.map(({ type, item, savedAt }) => type === 'job'
            ? `<article class="saved-item saved-job"><small>JOB · ${escapeHtml(item.company || 'Employer')}</small><h3><a href="${escapeHtml(item.applyUrl || '#')}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.location || '')}${item.location && item.mode ? ' · ' : ''}${escapeHtml(item.mode || '')}</p><time datetime="${savedAt ? new Date(savedAt).toISOString() : ''}">Saved ${escapeHtml(formatSavedAt(savedAt))}</time></article>`
            : `<article class="saved-item"><small>${escapeHtml(item.category)}</small><h3><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(articleCardExcerpt(item))}</p><time datetime="${savedAt ? new Date(savedAt).toISOString() : ''}">Saved ${escapeHtml(formatSavedAt(savedAt))}</time></article>`).join('')
        : `<p class="saved-empty">${savedFilter === 'jobs' ? 'No saved jobs yet.' : savedFilter === 'articles' ? 'No saved articles yet.' : 'No saved stories yet. Tap the heart on a story to keep it close.'}</p>`;
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
            const nextSaved = localStorage.getItem(storageKey) !== 'true';
            localStorage.setItem(storageKey, String(nextSaved));
            if (nextSaved) localStorage.setItem(savedTimeKey(key), String(Date.now()));
            else localStorage.removeItem(savedTimeKey(key));
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
    const matches = rankArticles(value, articles);
    const hasQuery = query.length > 0;

    if (!hasQuery) {
        const recentGroup = searchSuggestions.querySelector('.search-group');
        if (recentGroup) {
            const recent = getRecentSearches();
            const items = recent.length ? recent : ['Strait of Hormuz', 'maritime security', 'oil tanker'];
            const icon = recent.length ? recentSearchIcon : searchIcon;
            recentGroup.innerHTML = `<h3>Recent</h3>${items.map(item => `<button type="button" class="suggestion-item recent-search" data-query="${escapeHtml(item)}">${icon}<span>${escapeHtml(item)}</span></button>`).join('')}`;
        }
    }

    searchSuggestions.hidden = hasQuery;
    searchResults.hidden = !hasQuery;
    searchHint.textContent = hasQuery ? 'Smart matching — typos and related words included' : 'Recent searches and trending signals';
    searchResults.innerHTML = hasQuery
        ? matches.length
            ? matches.map(article => `
                <a class="result-item" href="/results?search_query=${encodeSearchQuery(article.title)}">
                    ${searchIcon}
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
        const [response] = await Promise.all([fetch(articleDataUrl, { cache: 'no-store' }), loadJobs()]);
        if (!response.ok) throw new Error(`Article data failed: ${response.status}`);
        const data = await response.json();
        const source = Array.isArray(data) ? data : data.articles;
        const unique = new Map();
        (Array.isArray(source) ? source : []).forEach(article => {
            if (!article || !article.id || !article.url || !article.title) return;
            if (!unique.has(article.id)) unique.set(article.id, article);
        });
        const initialArticles = [...unique.values()].sort((a, b) => {
            const left = Date.parse(a.updatedAt || a.publishedAt || '') || 0;
            const right = Date.parse(b.updatedAt || b.publishedAt || '') || 0;
            return right - left;
        });
        const needsImmediateHydration = body.dataset.errorPage === 'true' || body.classList.contains('results-page');
        articles = needsImmediateHydration ? await hydrateArticleCardData(initialArticles) : initialArticles;
        if (body.dataset.errorPage === 'true') {
            return;
        }
    } catch (error) {
        console.error(error);
        articles = [];
    }

    if (body.classList.contains('results-page')) {
        const query = new URLSearchParams(window.location.search).get('search_query')?.trim() || '';
        if (!query) { window.location.replace('/404.html'); return; }
        committedSearchQuery = query;
        if (search) search.value = query;
        visibleArticles = query ? rankArticles(query, articles) : [];
        renderStoryGrid(visibleArticles);
        setCount(visibleArticles.length);
        const empty = document.querySelector('#empty-state');
        if (empty) empty.hidden = visibleArticles.length > 0;
        return;
    }
    visibleArticles = [...articles];
    renderStoryGrid(visibleArticles);
    renderRelatedArticles();
    setCount(visibleArticles.length);
    syncSaveButtons();
    filterStories(search ? search.value : '');
    if (!body.dataset.errorPage && !body.classList.contains('results-page')) {
        const hydrate = () => hydrateArticleCardData(articles).then(updated => {
            articles = updated;
            filterStories(search ? search.value : '');
        }).catch(() => {});
        if ('requestIdleCallback' in window) window.requestIdleCallback(hydrate, { timeout: 1800 });
        else window.setTimeout(hydrate, 900);
    }
}

document.querySelector('#search-trigger')?.addEventListener('click', openSearch);
document.querySelector('#hero-search')?.addEventListener('click', openSearch);
document.querySelector('#close-search')?.addEventListener('click', closeSearch);

search?.addEventListener('input', () => {
    body.classList.add('search-dropdown-open');
    if (body.classList.contains('results-page')) {
        // The result grid uses the last submitted query. Typing only updates
        // the dropdown preview until Search or Enter commits a new query.
        renderSearchState(search.value);
        return;
    }
    filterStories();
});

search?.addEventListener('focus', () => {
    body.classList.add('search-dropdown-open');
    renderSearchState(search.value);
});
search?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); submitSearch(search.value); } });

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
    savedDrawer?.removeAttribute('inert');
    updateSaved();
});

const setSavedSearchOpen = (open) => {
    const filters = document.querySelector('.saved-filters');
    const toggle = document.querySelector('.saved-search-toggle');
    const box = document.querySelector('#saved-search-box');
    const input = document.querySelector('#saved-search-input');
    if (!filters || !toggle || !box) return;
    savedSearchActive = open;
    filters.hidden = open;
    toggle.hidden = open;
    box.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) window.setTimeout(() => input?.focus(), 0);
    else {
        savedSearchQuery = '';
        if (input) input.value = '';
        updateSaved();
    }
};

document.querySelector('.saved-search-toggle')?.addEventListener('click', () => setSavedSearchOpen(true));
document.querySelector('.saved-search-close')?.addEventListener('click', () => setSavedSearchOpen(false));
document.querySelector('#saved-search-input')?.addEventListener('input', event => {
    savedSearchQuery = event.currentTarget.value;
    updateSaved();
});

document.querySelectorAll('[data-saved-filter]').forEach(button => button.addEventListener('click', () => {
    savedFilter = button.dataset.savedFilter || 'all';
    updateSaved();
}));

const closeSaved = () => {
    savedDrawer?.classList.remove('open');
    savedDrawer?.setAttribute('aria-hidden', 'true');
    savedDrawer?.setAttribute('inert', '');
};

document.querySelector('#close-saved')?.addEventListener('click', closeSaved);
document.addEventListener('click', event => {
    if (!savedDrawer?.classList.contains('open')) return;
    if (savedDrawer.contains(event.target) || event.target.closest('#saved-toggle')) return;
    closeSaved();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && savedDrawer?.classList.contains('open')) closeSaved();
});
window.addEventListener('scroll', () => {
    if (window.innerWidth > 900 && savedDrawer?.classList.contains('open')) closeSaved();
}, { passive: true });

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
    window.dispatchEvent(new Event('reader-mode-change'));
    showToast(on ? 'Reader mode on' : 'Reader mode off');
});

if (localStorage.getItem('newsxphere-reader') === 'true') {
    body.classList.add('reading-mode');
    const readingMode = document.querySelector('#reading-mode');
    if (readingMode) readingMode.textContent = 'Exit reader';
    window.dispatchEvent(new Event('reader-mode-change'));
}

document.querySelectorAll('[data-read]').forEach(button => button.addEventListener('click', () => {
    body.classList.add('reading-mode');
    const readingMode = document.querySelector('#reading-mode');
    if (readingMode) readingMode.textContent = 'Exit reader';
    window.dispatchEvent(new Event('reader-mode-change'));
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
    submitSearch(search?.value || committedSearchQuery);
});

document.querySelector('#search-suggestions')?.addEventListener('click', event => {
    const button = event.target.closest('.suggestion-item');
    if (!button || !search) return;
    submitSearch(button.dataset.query || button.textContent.trim());
});

document.querySelector('#search-results')?.addEventListener('click', event => {
    const result = event.target.closest('.result-item');
    if (!result) return;
    event.preventDefault();
    submitSearch(result.querySelector('strong')?.textContent || result.textContent);
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
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
}

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
        // A hidden header must also dismiss any open search UI. Otherwise the
        // dropdown can remain logically open and reappear when the header returns.
        if (body.classList.contains('search-open')) closeSearch();
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
