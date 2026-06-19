// DOM Elements
const apiKeyInput = document.getElementById('api-key-input');
const toggleKeyBtn = document.getElementById('toggle-key-visibility');
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

// App State
let apiKey = localStorage.getItem('gemini_api_key') || '';
let currentModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
let conversations = JSON.parse(localStorage.getItem('gemini_conversations')) || [];
let activeConversationId = localStorage.getItem('gemini_active_conv_id') || null;

// Initialization
function init() {
    // Configure marked to handle line breaks (like in a chat)
    if (typeof marked !== 'undefined') {
        marked.use({
            breaks: true,
            gfm: true
        });
    }

    // Populate API Key and Model from state
    apiKeyInput.value = apiKey;
    modelSelect.value = currentModel;
    updateBadge();

    // Setup input listeners
    apiKeyInput.addEventListener('input', (e) => {
        apiKey = e.target.value.trim();
        localStorage.setItem('gemini_api_key', apiKey);
    });

    toggleKeyBtn.addEventListener('click', () => {
        const type = apiKeyInput.type === 'password' ? 'text' : 'password';
        apiKeyInput.type = type;
        const icon = toggleKeyBtn.querySelector('i');
        if (type === 'password') {
            icon.className = 'fa-solid fa-eye-slash';
        } else {
            icon.className = 'fa-solid fa-eye';
        }
    });

    modelSelect.addEventListener('change', (e) => {
        currentModel = e.target.value;
        localStorage.setItem('gemini_model', currentModel);
        updateBadge();
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

// Update the active model display badge
function updateBadge() {
    badgeModelName.textContent = modelSelect.options[modelSelect.selectedIndex].text.split(' (')[0];
}

// Conversation Management
function startNewChat() {
    activeConversationId = 'conv_' + Date.now();
    localStorage.setItem('gemini_active_conv_id', activeConversationId);
    
    activeChatTitle.textContent = "Nouvelle conversation";
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'flex';
    
    // Enable/disable clear button
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
        appendMessage(msg.role, msg.parts[0].text);
    });

    renderConversationsList();
    scrollToBottom();
}

// Message Rendering and Formatting
function appendMessage(role, text) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

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
    senderName.textContent = role === 'user' ? 'Vous' : 'Gemini';

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.innerHTML = formatMarkdown(text);

    // Apply syntax highlighting
    if (typeof hljs !== 'undefined') {
        contentEl.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    bodyEl.appendChild(senderName);
    bodyEl.appendChild(contentEl);
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(bodyEl);
    
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
    return messageEl;
}

function appendLoadingIndicator() {
    const messageEl = document.createElement('div');
    messageEl.className = 'message model loading';

    const avatarEl = document.createElement('div');
    avatarEl.className = 'message-avatar';
    avatarEl.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';

    const bodyEl = document.createElement('div');
    bodyEl.className = 'message-body';

    const senderName = document.createElement('div');
    senderName.className = 'message-sender-name';
    senderName.textContent = 'Gemini';

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

// API Integration
async function handleSendMessage(e) {
    e.preventDefault();

    const text = chatInput.value.trim();
    if (!text) return;

    if (!apiKey) {
        alert("Veuillez saisir votre clé API Gemini dans la barre latérale.");
        return;
    }

    // Hide welcome screen
    welcomeScreen.style.display = 'none';
    clearChatBtn.style.display = 'block';

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

    // Push User message to state
    conv.messages.push({
        role: 'user',
        parts: [{ text: text }]
    });
    saveConversations();
    renderConversationsList();

    // Show loading indicator
    const loadingMessage = appendLoadingIndicator();

    // Prepare API call payload
    // Filter history to ensure structure matches exactly what Gemini expects
    const apiContents = conv.messages.map(msg => ({
        role: msg.role,
        parts: msg.parts
    }));

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: apiContents
            })
        });

        // Remove loading indicator
        loadingMessage.remove();

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Erreur serveur (${response.status})`;
            appendMessage('model', `**Erreur de l'API Gemini :**\n${errMsg}`);
            return;
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const replyText = data.candidates[0].content.parts[0].text;
            
            // Push Model reply to state
            conv.messages.push({
                role: 'model',
                parts: [{ text: replyText }]
            });
            saveConversations();
            
            // Render Model reply in UI
            appendMessage('model', replyText);
        } else {
            appendMessage('model', "**Erreur :** Aucune réponse générée par le modèle. Veuillez vérifier le statut de votre compte.");
        }

    } catch (err) {
        loadingMessage.remove();
        appendMessage('model', `**Erreur réseau :** Impossible de contacter l'API Gemini. Veuillez vérifier votre connexion Internet.\n\nDétails : ${err.message}`);
    }
}

// Start the app
window.onload = init;
