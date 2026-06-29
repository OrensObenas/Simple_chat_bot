// Providers and Models Database
const PROVIDERS = {
    gemini: {
        name: "Google Gemini",
        models: [
            { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Rapide)" },
            { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash (Nouveau)" },
            { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Puissant)" },
            { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" }
        ],
        defaultModel: "gemini-2.5-flash",
        url: (model, key) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
    },
    groq: {
        name: "Groq",
        models: [
            { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Versatile)" },
            { id: "llama-3.2-3b-preview", name: "Llama 3.2 3B" },
            { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
            { id: "gemma2-9b-it", name: "Gemma 2 9B" }
        ],
        defaultModel: "llama-3.3-70b-versatile",
        url: () => `https://api.groq.com/openai/v1/chat/completions`
    },
    openrouter: {
        name: "OpenRouter",
        models: [
            { id: "google/gemini-2.5-flash:free", name: "Gemini 2.5 Flash (Free)" },
            { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B (Free)" },
            { id: "microsoft/phi-3-medium-128k-instruct:free", name: "Phi 3 Medium (Free)" },
            { id: "deepseek/deepseek-chat", name: "DeepSeek Chat (V3)" }
        ],
        defaultModel: "google/gemini-2.5-flash:free",
        url: () => `https://openrouter.ai/api/v1/chat/completions`
    },
    mistral: {
        name: "Mistral AI",
        models: [
            { id: "mistral-large-latest", name: "Mistral Large" },
            { id: "codestral-latest", name: "Codestral (Code)" },
            { id: "mistral-nemo", name: "Mistral Nemo" }
        ],
        defaultModel: "mistral-large-latest",
        url: () => `https://api.mistral.ai/v1/chat/completions`
    },
    cohere: {
        name: "Cohere",
        models: [
            { id: "command-r-plus", name: "Command R+" },
            { id: "command-r", name: "Command R" }
        ],
        defaultModel: "command-r-plus",
        url: () => `https://api.cohere.com/v2/chat`
    }
};

// DOM Elements
const providerSelect = document.getElementById('provider-select');
const modelSelect = document.getElementById('model-select');
const newChatBtn = document.getElementById('new-chat-btn');
const historyList = document.getElementById('history-list');
const activeChatTitle = document.getElementById('active-chat-title');
const activeModelBadge = document.getElementById('active-model-badge');
const badgeModelName = document.getElementById('badge-model-name');
const clearChatBtn = document.getElementById('clear-chat-btn');
const messagesContainer = document.getElementById('messages-container');
const welcomeScreen = document.getElementById('welcome-screen');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// Accordion Settings Elements
const accordionTrigger = document.getElementById('accordion-trigger');
const accordionContent = document.getElementById('accordion-content');
const saveKeysBtn = document.getElementById('save-keys-btn');

// New Accordions
const configAccordionTrigger = document.getElementById('config-accordion-trigger');
const configAccordionContent = document.getElementById('config-accordion-content');
const vocalAccordionTrigger = document.getElementById('vocal-accordion-trigger');
const vocalAccordionContent = document.getElementById('vocal-accordion-content');

// Vocal Settings DOM Elements
const ttsEngineSelect = document.getElementById('tts-engine-select');
const voiceSelectContainer = document.getElementById('voice-select-container');
const ttsVoiceSelect = document.getElementById('tts-voice-select');
const autoplayContainer = document.getElementById('autoplay-container');
const autoplayCheckbox = document.getElementById('autoplay-checkbox');
const sttEngineSelect = document.getElementById('stt-engine-select');
const micBtn = document.getElementById('mic-btn');
const systemPromptInput = document.getElementById('system-prompt-input');

// Voice Call DOM Elements
const voiceCallBtn = document.getElementById('voice-call-btn');
const voiceOverlay = document.getElementById('voice-overlay');
const voiceAvatar = document.getElementById('voice-avatar');
const hangupBtn = document.getElementById('hangup-btn');
const voiceStatusTitle = document.getElementById('voice-status-title');
const voiceStatusDesc = document.getElementById('voice-status-desc');

// Voice Call State
let isVoiceModeActive = false;

// App State
let activeProvider = localStorage.getItem('active_provider') || 'gemini';
let activeModel = localStorage.getItem('active_model') || 'gemini-2.5-flash';
let systemPrompt = localStorage.getItem('system_prompt') || '';
let keys = {
    gemini: '',
    groq: '',
    openrouter: '',
    mistral: '',
    cohere: '',
    elevenlabs: ''
};
let conversations = JSON.parse(localStorage.getItem('gemini_conversations')) || [];
let activeConversationId = localStorage.getItem('gemini_active_conv_id') || null;

// Vocal State
let activeTtsEngine = localStorage.getItem('active_tts_engine') || 'off';
let activeTtsVoice = localStorage.getItem('active_tts_voice') || '';
let autoplayEnabled = localStorage.getItem('autoplay_enabled') === 'true';
let currentAudio = null;
let currentSpeechUtterance = null;
let browserVoices = [];

// STT State
let activeSttEngine = localStorage.getItem('active_stt_engine') || 'browser';
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let recognition = null;

// Initialization
async function init() {
    // Configure marked to handle line breaks (like in a chat)
    if (typeof marked !== 'undefined') {
        marked.use({
            breaks: true,
            gfm: true
        });
    }

    // Set active provider & vocal settings UI values
    providerSelect.value = activeProvider;
    ttsEngineSelect.value = activeTtsEngine;
    sttEngineSelect.value = activeSttEngine;
    autoplayCheckbox.checked = autoplayEnabled;
    systemPromptInput.value = systemPrompt;
    
    // Load config from Express API (.env) or localStorage
    await loadConfig();

    // Populate models select and badge
    populateModels(activeProvider, activeModel);

    // Setup Vocal interface layout
    handleTtsEngineChange();

    // Event listener: change provider
    providerSelect.addEventListener('change', (e) => {
        activeProvider = e.target.value;
        localStorage.setItem('active_provider', activeProvider);
        activeModel = PROVIDERS[activeProvider].defaultModel;
        localStorage.setItem('active_model', activeModel);
        populateModels(activeProvider);
    });

    // Event listener: change model
    modelSelect.addEventListener('change', (e) => {
        activeModel = e.target.value;
        localStorage.setItem('active_model', activeModel);
        updateBadge();
    });

    // Event listener: system prompt
    systemPromptInput.addEventListener('input', (e) => {
        systemPrompt = e.target.value;
        localStorage.setItem('system_prompt', systemPrompt);
    });

    // Vocal UI handlers
    ttsEngineSelect.addEventListener('change', handleTtsEngineChange);
    ttsVoiceSelect.addEventListener('change', (e) => {
        activeTtsVoice = e.target.value;
        localStorage.setItem('active_tts_voice', activeTtsVoice);
    });
    autoplayCheckbox.addEventListener('change', (e) => {
        autoplayEnabled = e.target.checked;
        localStorage.setItem('autoplay_enabled', autoplayEnabled);
    });

    // STT UI Handler
    sttEngineSelect.addEventListener('change', (e) => {
        activeSttEngine = e.target.value;
        localStorage.setItem('active_stt_engine', activeSttEngine);
    });

    // Dictation Button Handler
    micBtn.addEventListener('click', toggleSpeechInput);

    // Initialize Speech Recognition
    initSpeechRecognition();

    // Voice Call Session Handlers
    voiceCallBtn.addEventListener('click', startVoiceMode);
    voiceAvatar.addEventListener('click', handleVoiceAvatarClick);
    hangupBtn.addEventListener('click', stopVoiceMode);

    // Model Config Accordion Trigger
    configAccordionTrigger.addEventListener('click', () => {
        const isVisible = configAccordionContent.style.display !== 'none';
        configAccordionContent.style.display = isVisible ? 'none' : 'flex';
        configAccordionTrigger.classList.toggle('active', !isVisible);
    });

    // Vocal Config Accordion Trigger
    vocalAccordionTrigger.addEventListener('click', () => {
        const isVisible = vocalAccordionContent.style.display !== 'none';
        vocalAccordionContent.style.display = isVisible ? 'none' : 'flex';
        vocalAccordionTrigger.classList.toggle('active', !isVisible);
    });

    // Settings Accordion Trigger
    accordionTrigger.addEventListener('click', () => {
        const isVisible = accordionContent.style.display !== 'none';
        accordionContent.style.display = isVisible ? 'none' : 'flex';
        accordionTrigger.classList.toggle('active', !isVisible);
    });

    // Save Manual Keys Locally
    saveKeysBtn.addEventListener('click', () => {
        Object.keys(keys).forEach(provider => {
            const inputVal = document.getElementById(`key-${provider}`).value.trim();
            if (inputVal) {
                keys[provider] = inputVal;
                localStorage.setItem(`key_${provider}`, inputVal);
            }
        });
        alert("Clés de secours enregistrées avec succès dans le stockage local !");
    });

    // Auto-growing textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight - 4) + 'px';
        sendBtn.disabled = chatInput.value.trim() === '';
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (chatInput.value.trim() !== '') {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Form submission
    chatForm.addEventListener('submit', handleSendMessage);

    // Sidebar buttons
    newChatBtn.addEventListener('click', startNewChat);
    clearChatBtn.addEventListener('click', clearCurrentChat);

    // Suggestion Cards
    document.querySelectorAll('.suggestion-card').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            chatInput.value = prompt;
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight - 4) + 'px';
            sendBtn.disabled = false;
            chatInput.focus();
        });
    });

    // Load conversations list and activate current conversation
    renderConversationsList();
    if (activeConversationId) {
        loadConversation(activeConversationId);
    } else {
        startNewChat();
    }
}

// Load configurations keys from express server (/api/config) or fallback to localStorage
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const serverConfig = await response.json();
            Object.keys(keys).forEach(provider => {
                // Precedence: .env config (serverConfig) -> LocalStorage backup
                keys[provider] = serverConfig[provider] || localStorage.getItem(`key_${provider}`) || '';
                if (keys[provider]) {
                    document.getElementById(`key-${provider}`).value = keys[provider];
                }
            });
            console.log("Config keys loaded successfully from local Node server environment.");
        } else {
            throw new Error();
        }
    } catch (e) {
        console.log("Running in static filesystem mode (no local Express server). Loading keys from localStorage.");
        Object.keys(keys).forEach(provider => {
            keys[provider] = localStorage.getItem(`key_${provider}`) || '';
            if (keys[provider]) {
                document.getElementById(`key-${provider}`).value = keys[provider];
            }
        });
    }
}

// Populate Models Select Dropdown
function populateModels(provider, selectedModelId = null) {
    modelSelect.innerHTML = '';
    const providerData = PROVIDERS[provider];
    
    providerData.models.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model.id;
        opt.textContent = model.name;
        if (selectedModelId === model.id || (!selectedModelId && model.id === providerData.defaultModel)) {
            opt.selected = true;
            activeModel = model.id;
        }
        modelSelect.appendChild(opt);
    });
    
    updateBadge();
}

// Update the active model display badge and status
function updateBadge() {
    const activeProviderName = PROVIDERS[activeProvider].name;
    const modelText = modelSelect.options[modelSelect.selectedIndex]?.text || activeModel;
    badgeModelName.textContent = `${activeProviderName} : ${modelText.split(' (')[0]}`;
    
    // Status dot color update
    const statusDot = activeModelBadge.querySelector('.status-dot');
    statusDot.className = 'status-dot';
    statusDot.classList.add('green');
}

// Handle voice engine selection change
function handleTtsEngineChange() {
    activeTtsEngine = ttsEngineSelect.value;
    localStorage.setItem('active_tts_engine', activeTtsEngine);

    if (activeTtsEngine === 'off') {
        voiceSelectContainer.style.display = 'none';
        autoplayContainer.style.display = 'none';
        stopSpeaking();
    } else {
        voiceSelectContainer.style.display = 'block';
        autoplayContainer.style.display = 'flex';
        loadVoicesForEngine(activeTtsEngine);
    }
}

// Load voices based on selected vocal engine
function loadVoicesForEngine(engine) {
    ttsVoiceSelect.innerHTML = '';
    
    if (engine === 'browser') {
        if (!window.speechSynthesis) {
            ttsVoiceSelect.innerHTML = '<option value="">Non supporté</option>';
            return;
        }
        
        const fetchVoices = () => {
            browserVoices = window.speechSynthesis.getVoices();
            ttsVoiceSelect.innerHTML = '';
            
            // Populates voices in selector
            browserVoices.forEach(voice => {
                const opt = document.createElement('option');
                opt.value = voice.name;
                opt.textContent = `${voice.name} (${voice.lang})`;
                if (voice.name === activeTtsVoice) {
                    opt.selected = true;
                } else if (!activeTtsVoice && voice.lang.startsWith('fr')) {
                    opt.selected = true;
                    activeTtsVoice = voice.name;
                    localStorage.setItem('active_tts_voice', activeTtsVoice);
                }
                ttsVoiceSelect.appendChild(opt);
            });
        };

        fetchVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = fetchVoices;
        }

    } else if (engine === 'elevenlabs') {
        const defaultElevenVoices = [
            { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (Féminin - Clair)" },
            { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica (Féminin - Expressif)" },
            { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice (Féminin - Narratif)" },
            { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda (Féminin - Professionnel)" },
            { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger (Masculin - Posé)" },
            { id: "JBFqnCBsd6RMkjVDRZzb", name: "George (Masculin - Chaleureux)" },
            { id: "cjVigY5qzO86Huf0OWal", name: "Eric (Masculin - Doux)" },
            { id: "pqHfZKP75CvOlQylNhV4", name: "Bill (Masculin - Senior)" }
        ];

        defaultElevenVoices.forEach(voice => {
            const opt = document.createElement('option');
            opt.value = voice.id;
            opt.textContent = voice.name;
            if (voice.id === activeTtsVoice) {
                opt.selected = true;
            }
            ttsVoiceSelect.appendChild(opt);
        });

        if (!activeTtsVoice || !defaultElevenVoices.some(v => v.id === activeTtsVoice)) {
            activeTtsVoice = defaultElevenVoices[0].id;
            localStorage.setItem('active_tts_voice', activeTtsVoice);
        }
    }
}

// Stop any current reading voice audio
function stopSpeaking() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    document.querySelectorAll('.tts-play-btn').forEach(btn => {
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    });
}

// Read text out loud using selected vocal engine and active voice
async function speakText(text, playButton, onEndCallback = null) {
    if (playButton.classList.contains('playing')) {
        stopSpeaking();
        return;
    }

    stopSpeaking();

    // Set playing status inside button UI
    playButton.classList.add('playing');
    playButton.innerHTML = '<i class="fa-solid fa-stop"></i>';

    // Strip HTML and formatting for clean output speech text
    const cleanText = text.replace(/<\/?[^>]+(>|$)/g, "")
                          .replace(/[*_`#]/g, "")
                          .replace(/```[\s\S]*?```/g, "[Bloc de code]");

    if (activeTtsEngine === 'browser') {
        if (!window.speechSynthesis) {
            alert("La synthèse vocale du navigateur n'est pas prise en charge.");
            stopSpeaking();
            if (onEndCallback) onEndCallback();
            return;
        }

        currentSpeechUtterance = new SpeechSynthesisUtterance(cleanText);
        const voice = browserVoices.find(v => v.name === activeTtsVoice);
        if (voice) {
            currentSpeechUtterance.voice = voice;
        }

        currentSpeechUtterance.onend = () => {
            stopSpeaking();
            if (onEndCallback) onEndCallback();
        };
        currentSpeechUtterance.onerror = () => {
            stopSpeaking();
            if (onEndCallback) onEndCallback();
        };
        window.speechSynthesis.speak(currentSpeechUtterance);

    } else if (activeTtsEngine === 'elevenlabs') {
        const elKey = keys.elevenlabs;
        if (!elKey) {
            alert("Veuillez configurer votre clé API ElevenLabs dans la section paramètres.");
            stopSpeaking();
            if (onEndCallback) onEndCallback();
            return;
        }

        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${activeTtsVoice}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': elKey
                },
                body: JSON.stringify({
                    text: cleanText,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail?.message || `Erreur ElevenLabs (${response.status})`);
            }

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            currentAudio = new Audio(audioUrl);
            currentAudio.onended = () => {
                stopSpeaking();
                if (onEndCallback) onEndCallback();
            };
            currentAudio.onerror = () => {
                stopSpeaking();
                if (onEndCallback) onEndCallback();
            };
            currentAudio.play();

        } catch (e) {
            alert("Erreur de synthèse ElevenLabs : " + e.message);
            stopSpeaking();
            if (onEndCallback) onEndCallback();
        }
    }
}

// Conversation Management
function startNewChat() {
    activeConversationId = 'conv_' + Date.now();
    localStorage.setItem('gemini_active_conv_id', activeConversationId);
    
    activeChatTitle.textContent = "Nouvelle conversation";
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'flex';
    
    clearChatBtn.style.display = 'none';
    chatInput.focus();
}

function clearCurrentChat() {
    if (confirm("Voulez-vous effacer l'historique de cette discussion ?")) {
        const index = conversations.findIndex(c => c.id === activeConversationId);
        if (index !== -1) {
            conversations.splice(index, 1);
            saveConversations();
            renderConversationsList();
        }
        startNewChat();
    }
}

function saveConversations() {
    localStorage.setItem('gemini_conversations', JSON.stringify(conversations));
}

function renderConversationsList() {
    historyList.innerHTML = '';
    
    if (conversations.length === 0) {
        historyList.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 10px;">Aucun historique</div>';
        return;
    }

    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = `history-item ${conv.id === activeConversationId ? 'active' : ''}`;
        item.addEventListener('click', () => loadConversation(conv.id));

        const title = document.createElement('span');
        title.className = 'history-item-title';
        title.textContent = conv.title;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'history-item-delete';
        deleteBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(conv.id);
        });

        item.appendChild(title);
        item.appendChild(deleteBtn);
        historyList.appendChild(item);
    });
}

function deleteConversation(id) {
    if (confirm("Supprimer cette conversation ?")) {
        conversations = conversations.filter(c => c.id !== id);
        saveConversations();
        renderConversationsList();
        if (activeConversationId === id) {
            startNewChat();
        }
    }
}

function loadConversation(id) {
    const conv = conversations.find(c => c.id === id);
    if (!conv) {
        startNewChat();
        return;
    }

    activeConversationId = id;
    localStorage.setItem('gemini_active_conv_id', id);
    
    activeChatTitle.textContent = conv.title;
    messagesContainer.innerHTML = '';
    welcomeScreen.style.display = 'none';
    clearChatBtn.style.display = 'block';

    conv.messages.forEach(msg => {
        appendMessage(msg.role, msg.parts[0].text, msg.provider || 'gemini', false);
    });

    renderConversationsList();
    scrollToBottom();
}

// Message Rendering and Formatting
function appendMessage(role, text, providerTheme = 'gemini', shouldAutoplay = true) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role} ${role === 'model' ? providerTheme : ''}`;

    const avatarEl = document.createElement('div');
    avatarEl.className = 'message-avatar';
    
    if (role === 'user') {
        avatarEl.innerHTML = '<i class="fa-regular fa-user"></i>';
    } else {
        avatarEl.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
    }

    const bodyEl = document.createElement('div');
    bodyEl.className = 'message-body';

    const senderName = document.createElement('div');
    senderName.className = 'message-sender-name';
    
    if (role === 'user') {
        senderName.textContent = 'Vous';
    } else {
        const provName = PROVIDERS[providerTheme]?.name || 'IA';
        senderName.textContent = provName;
    }

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.innerHTML = formatMarkdown(text);

    // Apply code syntax highlighting
    if (typeof hljs !== 'undefined') {
        contentEl.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    bodyEl.appendChild(senderName);
    bodyEl.appendChild(contentEl);

    // Add Speak button for Assistant responses
    if (role === 'model') {
        const actionsEl = document.createElement('div');
        actionsEl.className = 'message-actions';
        
        const playBtn = document.createElement('button');
        playBtn.className = 'tts-play-btn';
        playBtn.title = "Écouter le message";
        playBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        
        playBtn.addEventListener('click', () => {
            speakText(text, playBtn);
        });
        
        actionsEl.appendChild(playBtn);
        bodyEl.appendChild(actionsEl);

        // Autoplay if enabled, engine is on, and shouldAutoplay is true
        if (shouldAutoplay && autoplayEnabled && activeTtsEngine !== 'off') {
            setTimeout(() => {
                speakText(text, playBtn);
            }, 100);
        }
    }

    messageEl.appendChild(avatarEl);
    messageEl.appendChild(bodyEl);
    
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
    return messageEl;
}

function appendLoadingIndicator() {
    const messageEl = document.createElement('div');
    messageEl.className = `message model loading ${activeProvider}`;

    const avatarEl = document.createElement('div');
    avatarEl.className = 'message-avatar';
    avatarEl.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';

    const bodyEl = document.createElement('div');
    bodyEl.className = 'message-body';

    const senderName = document.createElement('div');
    senderName.className = 'message-sender-name';
    senderName.textContent = PROVIDERS[activeProvider].name;

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.innerHTML = `
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    bodyEl.appendChild(senderName);
    bodyEl.appendChild(contentEl);
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(bodyEl);
    
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
    return messageEl;
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Robust Markdown Formatter using Marked.js
function formatMarkdown(text) {
    if (!text) return '';
    
    try {
        if (typeof marked !== 'undefined') {
            return marked.parse(text);
        }
    } catch (e) {
        console.error("Error parsing markdown with marked.js:", e);
    }
    
    // Fallback to basic text formatting if marked is not loaded
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .split('\n').join('<br>');
}

// API Integration Handler
async function handleSendMessage(e) {
    e.preventDefault();

    const text = chatInput.value.trim();
    if (!text) return;

    // Get Active API Key
    const providerKey = keys[activeProvider];
    if (!providerKey) {
        alert(`Veuillez configurer la clé API pour ${PROVIDERS[activeProvider].name} dans les paramètres.`);
        return;
    }

    // Hide welcome screen
    welcomeScreen.style.display = 'none';
    clearChatBtn.style.display = 'block';

    // Stop speaking current voice before generating new response
    stopSpeaking();

    // Append User Message to UI
    appendMessage('user', text);

    // Reset Input Box
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Get Active Conversation or Create One
    let conv = conversations.find(c => c.id === activeConversationId);
    if (!conv) {
        conv = {
            id: activeConversationId,
            title: text.length > 25 ? text.substring(0, 25) + '...' : text,
            messages: []
        };
        conversations.unshift(conv); // Add to beginning of history
    }

    // Push User message to local state
    conv.messages.push({
        role: 'user',
        parts: [{ text: text }],
        provider: activeProvider
    });
    saveConversations();
    renderConversationsList();

    // Show pulsing loading indicator
    const loadingMessage = appendLoadingIndicator();

    try {
        let response;
        const providerData = PROVIDERS[activeProvider];

        if (activeProvider === 'gemini') {
            const apiContents = conv.messages
                .filter(m => m.provider === 'gemini' || m.role === 'user')
                .map(msg => ({
                    role: msg.role,
                    parts: msg.parts
                }));

            const body = { contents: apiContents };
            if (systemPrompt && systemPrompt.trim() !== '') {
                body.systemInstruction = {
                    parts: [{ text: systemPrompt.trim() }]
                };
            }

            response = await fetch(providerData.url(activeModel, providerKey), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            loadingMessage.remove();

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Erreur serveur (${response.status})`);
            }

            const data = await response.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const replyText = data.candidates[0].content.parts[0].text;
                saveAndDisplayReply(conv, replyText);
            } else {
                throw new Error("Aucune réponse générée par Gemini.");
            }

        } else {
            const openaiMessages = [];
            if (systemPrompt && systemPrompt.trim() !== '') {
                openaiMessages.push({
                    role: 'system',
                    content: systemPrompt.trim()
                });
            }
            openaiMessages.push(...conv.messages.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.parts[0].text
            })));

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${providerKey}`
            };

            if (activeProvider === 'openrouter') {
                headers['HTTP-Referer'] = window.location.origin;
                headers['X-Title'] = 'Aurora Universal Chat';
            }

            response = await fetch(providerData.url(), {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: activeModel,
                    messages: openaiMessages
                })
            });

            loadingMessage.remove();

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || errData.message || `Erreur serveur (${response.status})`;
                throw new Error(errMsg);
            }

            const data = await response.json();
            if (data.choices?.[0]?.message?.content) {
                const replyText = data.choices[0].message.content;
                saveAndDisplayReply(conv, replyText);
            } else {
                throw new Error("Aucune réponse renvoyée par le modèle.");
            }
        }

    } catch (err) {
        loadingMessage.remove();
        appendMessage('model', `**Erreur (${PROVIDERS[activeProvider].name}) :** ${err.message}`, activeProvider);
    }
}

// Save message response to state and render it
function saveAndDisplayReply(conv, text) {
    conv.messages.push({
        role: 'model',
        parts: [{ text: text }],
        provider: activeProvider
    });
    saveConversations();
    appendMessage('model', text, activeProvider);
}

// Speech-to-Text (STT) Integration Functions

// Initialize Native Browser Speech Recognition
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.log("Speech recognition is not natively supported by this browser.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
        isRecording = true;
        if (isVoiceModeActive) {
            voiceOverlay.classList.add('active-audio', 'speaking-user');
            voiceOverlay.classList.remove('speaking-model');
            voiceStatusTitle.textContent = "Je vous écoute...";
            voiceStatusDesc.textContent = "Parlez maintenant...";
        } else {
            micBtn.classList.add('recording');
            micBtn.title = "En écoute... Cliquez pour arrêter";
            chatInput.placeholder = "Parlez maintenant...";
        }
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
            if (isVoiceModeActive) {
                sendVoiceModeMessage(transcript);
            } else {
                const currentVal = chatInput.value.trim();
                chatInput.value = currentVal ? `${currentVal} ${transcript}` : transcript;
                chatInput.dispatchEvent(new Event('input'));
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (isVoiceModeActive) {
            if (event.error === 'no-speech') {
                setTimeout(() => {
                    if (isVoiceModeActive) startVoiceModeListening();
                }, 300);
            } else if (event.error === 'network') {
                voiceStatusDesc.textContent = "Erreur réseau : la reconnaissance vocale requiert Internet.";
                setTimeout(() => {
                    if (isVoiceModeActive) startVoiceModeListening();
                }, 3000);
            } else if (event.error !== 'aborted') {
                voiceStatusDesc.textContent = `Erreur : ${event.error}. Réessai...`;
                setTimeout(() => {
                    if (isVoiceModeActive) startVoiceModeListening();
                }, 1500);
            }
        } else {
            if (event.error !== 'no-speech') {
                if (event.error === 'network') {
                    alert("Erreur de reconnaissance vocale : connexion au serveur de reconnaissance impossible (nécessite Internet).");
                } else {
                    alert("Erreur de reconnaissance vocale : " + event.error);
                }
            }
            stopSpeaking();
            resetMicButton();
        }
    };

    recognition.onend = () => {
        isRecording = false;
        if (isVoiceModeActive) {
            voiceOverlay.classList.remove('active-audio', 'speaking-user');
        } else {
            resetMicButton();
        }
    };
}

// Reset mic button UI to standard state
function resetMicButton() {
    micBtn.className = 'mic-btn';
    micBtn.title = "Activer la dictée vocale";
    chatInput.placeholder = "Posez une question à Gemini...";
}

// Toggle voice input recording/dictation based on selected engine
async function toggleSpeechInput() {
    stopSpeaking(); // Stop any TTS output playing

    if (isRecording) {
        if (activeSttEngine === 'browser') {
            if (recognition) recognition.stop();
        } else if (activeSttEngine === 'groq') {
            stopGroqRecording();
        }
    } else {
        if (activeSttEngine === 'browser') {
            if (!recognition) {
                alert("La dictée vocale du navigateur n'est pas supportée par ce navigateur. Essayez Google Chrome, ou passez au moteur Groq Whisper.");
                return;
            }
            try {
                recognition.start();
            } catch (e) {
                console.error("Speech recognition start failed:", e);
            }
        } else if (activeSttEngine === 'groq') {
            await startGroqRecording();
        }
    }
}

// Start MediaRecorder audio capture for Groq Whisper
async function startGroqRecording() {
    if (!keys.groq) {
        alert("Veuillez d'abord configurer votre clé API Groq dans la barre latérale pour utiliser Whisper.");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];

        let options = { mimeType: 'audio/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'audio/ogg' };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = {}; // browser default
        }

        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstart = () => {
            isRecording = true;
            micBtn.classList.add('recording');
            micBtn.title = "Enregistrement en cours... Cliquez pour transcrire";
            chatInput.placeholder = "Enregistrement audio en cours... parlez puis cliquez à nouveau sur le micro pour l'envoyer.";
        };

        mediaRecorder.onstop = async () => {
            isRecording = false;
            stream.getTracks().forEach(track => track.stop());

            const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });

            micBtn.className = 'mic-btn processing';
            micBtn.title = "Transcription par Whisper en cours...";
            chatInput.placeholder = "Transcription par Groq Whisper en cours...";

            await sendAudioToGroq(audioBlob);
        };

        mediaRecorder.start();

    } catch (err) {
        console.error("Microphone access denied or error:", err);
        alert("Impossible d'accéder au microphone. Veuillez vérifier vos autorisations.");
        resetMicButton();
    }
}

// Stop MediaRecorder audio capture
function stopGroqRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// Upload recorded audio Blob to Groq's Whisper API
async function sendAudioToGroq(audioBlob) {
    const groqKey = keys.groq;
    if (!groqKey) {
        alert("Clé Groq manquante.");
        resetMicButton();
        return;
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'speech.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'fr');

    try {
        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Erreur Whisper (${response.status})`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        if (data.text) {
            const currentVal = chatInput.value.trim();
            chatInput.value = currentVal ? `${currentVal} ${data.text}` : data.text;
            chatInput.dispatchEvent(new Event('input'));
        }
    } catch (e) {
        console.error("Groq Whisper API error:", e);
        alert("Erreur de transcription Groq Whisper : " + e.message);
    } finally {
        resetMicButton();
    }
}

// Voice Mode S2S Loop Functions
function startVoiceMode() {
    if (activeSttEngine === 'browser') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("La reconnaissance vocale (Speech-to-Text) n'est pas supportée par votre navigateur. Veuillez passer au moteur Groq Whisper dans les paramètres.");
            return;
        }
    } else if (activeSttEngine === 'groq' && !keys.groq) {
        alert("Veuillez d'abord configurer votre clé API Groq dans la barre latérale pour utiliser Whisper.");
        return;
    }

    isVoiceModeActive = true;
    voiceCallBtn.classList.add('active');
    
    // Stop any active recordings or TTS playback
    stopSpeaking();
    if (isRecording) {
        if (activeSttEngine === 'browser') {
            if (recognition) recognition.stop();
        } else if (activeSttEngine === 'groq') {
            stopGroqRecording();
        }
    }

    // Force TTS engine to browser if currently off
    if (activeTtsEngine === 'off') {
        activeTtsEngine = 'browser';
        ttsEngineSelect.value = 'browser';
        localStorage.setItem('active_tts_engine', 'browser');
        handleTtsEngineChange();
    }

    // Display fullscreen overlay
    voiceOverlay.style.display = 'flex';
    voiceOverlay.className = 'voice-overlay'; // clear state classes
    voiceStatusTitle.textContent = "Appel en cours...";
    voiceStatusDesc.textContent = "Initialisation du microphone...";

    // Start listening
    startVoiceModeListening();
}

function startVoiceModeListening() {
    if (!isVoiceModeActive) return;

    stopSpeaking();

    if (activeSttEngine === 'browser') {
        // Prepare overlay UI classes
        voiceOverlay.className = 'voice-overlay active-audio speaking-user';
        voiceStatusTitle.textContent = "Je vous écoute...";
        voiceStatusDesc.textContent = "Parlez maintenant...";

        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {}
            
            setTimeout(() => {
                if (!isVoiceModeActive) return;
                try {
                    recognition.start();
                } catch (e) {
                    console.log("Speech recognition start failed (likely already running):", e.message);
                }
            }, 150);
        }
    } else {
        // Groq Whisper click-to-speak mode
        voiceOverlay.className = 'voice-overlay clickable-avatar';
        voiceStatusTitle.textContent = "Prêt à vous écouter";
        voiceStatusDesc.textContent = "Cliquez sur l'avatar pour parler...";
    }
}

async function handleVoiceAvatarClick() {
    if (!isVoiceModeActive) return;
    
    if (activeSttEngine !== 'groq') {
        // In browser mode, clicking can manually trigger stop/send if recording
        if (isRecording && recognition) {
            recognition.stop();
        }
        return;
    }

    // Groq Whisper mode click handling
    if (!isRecording) {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];

            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'audio/ogg' };
            }
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = {};
            }

            mediaRecorder = new MediaRecorder(stream, options);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstart = () => {
                isRecording = true;
                voiceOverlay.className = 'voice-overlay active-audio speaking-user clickable-avatar';
                voiceStatusTitle.textContent = "Je vous écoute...";
                voiceStatusDesc.textContent = "Cliquez sur l'avatar pour terminer et envoyer";
            };

            mediaRecorder.onstop = async () => {
                isRecording = false;
                stream.getTracks().forEach(track => track.stop());

                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });

                voiceOverlay.className = 'voice-overlay active-audio';
                voiceStatusTitle.textContent = "Transcription...";
                voiceStatusDesc.textContent = "Envoi à Groq Whisper...";

                await sendVoiceModeAudioToGroq(audioBlob);
            };

            mediaRecorder.start();

        } catch (err) {
            console.error("Microphone access denied or error:", err);
            alert("Impossible d'accéder au microphone. Veuillez vérifier vos autorisations.");
            startVoiceModeListening();
        }
    } else {
        // Stop recording and trigger sending
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }
}

async function sendVoiceModeAudioToGroq(audioBlob) {
    if (!isVoiceModeActive) return;

    const groqKey = keys.groq;
    if (!groqKey) {
        alert("Clé Groq manquante.");
        startVoiceModeListening();
        return;
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'speech.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'fr');

    try {
        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Erreur Whisper (${response.status})`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        if (data.text && data.text.trim()) {
            sendVoiceModeMessage(data.text.trim());
        } else {
            throw new Error("Aucun texte détecté dans l'enregistrement.");
        }
    } catch (e) {
        console.error("Groq Whisper API error in voice mode:", e);
        voiceStatusTitle.textContent = "Erreur de transcription";
        voiceStatusDesc.textContent = e.message;
        setTimeout(() => {
            if (isVoiceModeActive) startVoiceModeListening();
        }, 3000);
    }
}

async function sendVoiceModeMessage(text) {
    if (!isVoiceModeActive) return;

    const providerKey = keys[activeProvider];
    if (!providerKey) {
        alert(`Veuillez configurer la clé API pour ${PROVIDERS[activeProvider].name} dans les paramètres.`);
        stopVoiceMode();
        return;
    }

    // UI Updates
    voiceOverlay.className = 'voice-overlay active-audio';
    voiceStatusTitle.textContent = "IA réfléchit...";
    voiceStatusDesc.textContent = `Envoi à ${PROVIDERS[activeProvider].name}...`;

    welcomeScreen.style.display = 'none';
    clearChatBtn.style.display = 'block';

    stopSpeaking();
    appendMessage('user', text);

    let conv = conversations.find(c => c.id === activeConversationId);
    if (!conv) {
        conv = {
            id: activeConversationId,
            title: text.length > 25 ? text.substring(0, 25) + '...' : text,
            messages: []
        };
        conversations.unshift(conv);
    }

    conv.messages.push({
        role: 'user',
        parts: [{ text: text }],
        provider: activeProvider
    });
    saveConversations();
    renderConversationsList();

    try {
        let response;
        const providerData = PROVIDERS[activeProvider];

        if (activeProvider === 'gemini') {
            const apiContents = conv.messages
                .filter(m => m.provider === 'gemini' || m.role === 'user')
                .map(msg => ({
                    role: msg.role,
                    parts: msg.parts
                }));

            const body = { contents: apiContents };
            if (systemPrompt && systemPrompt.trim() !== '') {
                body.systemInstruction = {
                    parts: [{ text: systemPrompt.trim() }]
                };
            }

            response = await fetch(providerData.url(activeModel, providerKey), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Erreur serveur (${response.status})`);
            }

            const data = await response.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const replyText = data.candidates[0].content.parts[0].text;
                handleVoiceModeReply(conv, replyText);
            } else {
                throw new Error("Aucune réponse générée par Gemini.");
            }

        } else {
            const openaiMessages = [];
            if (systemPrompt && systemPrompt.trim() !== '') {
                openaiMessages.push({
                    role: 'system',
                    content: systemPrompt.trim()
                });
            }
            openaiMessages.push(...conv.messages.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.parts[0].text
            })));

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${providerKey}`
            };

            if (activeProvider === 'openrouter') {
                headers['HTTP-Referer'] = window.location.origin;
                headers['X-Title'] = 'Aurora Universal Chat';
            }

            response = await fetch(providerData.url(), {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: activeModel,
                    messages: openaiMessages
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || errData.message || `Erreur serveur (${response.status})`;
                throw new Error(errMsg);
            }

            const data = await response.json();
            if (data.choices?.[0]?.message?.content) {
                const replyText = data.choices[0].message.content;
                handleVoiceModeReply(conv, replyText);
            } else {
                throw new Error("Aucune réponse renvoyée par le modèle.");
            }
        }

    } catch (err) {
        console.error("API error in Voice Mode:", err);
        appendMessage('model', `**Erreur (${PROVIDERS[activeProvider].name}) :** ${err.message}`, activeProvider);
        voiceOverlay.className = 'voice-overlay active-audio';
        voiceStatusTitle.textContent = "Erreur de connexion";
        voiceStatusDesc.textContent = err.message;
        setTimeout(() => {
            if (isVoiceModeActive) startVoiceModeListening();
        }, 3000);
    }
}

function handleVoiceModeReply(conv, replyText) {
    if (!isVoiceModeActive) return;

    conv.messages.push({
        role: 'model',
        parts: [{ text: replyText }],
        provider: activeProvider
    });
    saveConversations();

    const messageEl = appendMessage('model', replyText, activeProvider, false);
    const playBtn = messageEl.querySelector('.tts-play-btn');

    voiceOverlay.className = 'voice-overlay active-audio speaking-model';
    voiceStatusTitle.textContent = "L'IA vous répond...";
    voiceStatusDesc.textContent = "Lecture vocale...";

    speakText(replyText, playBtn, () => {
        if (isVoiceModeActive) {
            voiceOverlay.classList.remove('speaking-model', 'active-audio');
            setTimeout(startVoiceModeListening, 800);
        }
    });
}

function stopVoiceMode() {
    isVoiceModeActive = false;
    voiceCallBtn.classList.remove('active');
    voiceOverlay.style.display = 'none';
    
    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {}
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
            mediaRecorder.stop();
        } catch (e) {}
    }
    stopSpeaking();
}

// Start the app
window.onload = init;
