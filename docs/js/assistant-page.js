document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    // ===== THEME INIT =====
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');

    // ===== ELEMENTS =====
    const ELEMENTS = {
        chatMessages: document.getElementById("chat-messages"),
        messageInput: document.getElementById("message-input"),
        sendButton: document.getElementById("send-button"),
        newChatButton: document.getElementById("new-chat"),
        newChatSidebarButton: document.getElementById("new-chat-sidebar"),
        chatHistory: document.getElementById("chat-history"),
        welcomeCard: document.getElementById("welcome-card"),
        themeToggle: document.getElementById("theme-toggle"),
        profileButton: document.getElementById("profile-button"),
        profileMenu: document.getElementById("profile-menu"),
        sidebar: document.getElementById("sidebar"),
        sidebarClose: document.getElementById("sidebar-close"),
        sidebarOverlay: document.getElementById("sidebar-overlay"),
    };

    // ===== CONFIGURATION =====
    const CONFIG = {
        apiBaseUrl: "http://127.0.0.1:8000/api/v1",
        localStorageKey: "tebnegar_session_id_v2",
    };

    // ===== STATE =====
    const createStore = (initialState) => {
        const subscribers = [];
        const state = new Proxy(initialState, {
            set(target, property, value) {
                target[property] = value;
                subscribers.forEach((cb) => cb());
                return true;
            }
        });
        return { state, subscribe: (cb) => subscribers.push(cb) };
    };

    const store = createStore({
        sessionId: localStorage.getItem(CONFIG.localStorageKey),
        conversationId: null,
        lastAiMessageId: null,
        isLoading: false,
    });

    // ===== API SERVICE =====
    const Api = {
        async request(url, options = {}) {
            const res = await fetch(CONFIG.apiBaseUrl + url, {
                headers: { 'Content-Type': 'application/json' },
                ...options,
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        },
        get(url) { return this.request(url); },
        post(url, data) { return this.request(url, { method: 'POST', body: JSON.stringify(data) }); },
        delete(url) { return this.request(url, { method: 'DELETE' }); },
        patch(url, data) { return this.request(url, { method: 'PATCH', body: JSON.stringify(data) }); },
    };

    // ===== NOTIFICATIONS =====
    const Notification = {
        show(kind, message) {
            const bg = kind === 'error' ? 'bg-red-500' : 'bg-green-500';
            const div = document.createElement('div');
            div.className = `fixed top-4 right-4 ${bg} text-white px-6 py-3 rounded-lg shadow-lg z-50 notification-enter`;
            div.innerHTML = `<div class="flex items-center gap-2"><i class="fas ${kind === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i><span>${message}</span></div>`;
            document.body.appendChild(div);
            setTimeout(() => {
                div.classList.remove('notification-enter');
                div.classList.add('notification-exit');
                setTimeout(() => { if (document.body.contains(div)) document.body.removeChild(div); }, 300);
            }, 2200);
        },
        success(m) { this.show('success', m); },
        error(m) { this.show('error', m); },
    };

    // ===== RENDERING =====
    function renderUserMessage(content) {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-enter flex justify-start';
        const bubbleWrap = document.createElement('div');
        bubbleWrap.className = 'chat-bubble items-start';
        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar user';
        avatar.innerHTML = '<i class="fas fa-user"></i>';
        const bubble = document.createElement('div');
        bubble.className = 'max-w-3xl px-4 py-3 rounded-2xl bg-gradient-to-r from-medical-blue-500 to-medical-blue-600 text-white';
        bubble.textContent = content;
        bubbleWrap.appendChild(avatar); bubbleWrap.appendChild(bubble); wrapper.appendChild(bubbleWrap);
        ELEMENTS.chatMessages.appendChild(wrapper);
        ELEMENTS.chatMessages.scrollTop = ELEMENTS.chatMessages.scrollHeight;
    }

    function renderAIMessage(content) {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-enter flex justify-start';
        const bubbleWrap = document.createElement('div');
        bubbleWrap.className = 'chat-bubble items-start';
        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar ai';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-4 max-w-3xl';
        card.innerHTML = `
            <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 bg-gradient-to-r from-medical-blue-500 to-medical-green-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-robot text-white text-sm"></i>
                </div>
                <span class="font-semibold text-sm">دستیار TebNegar</span>
            </div>
            <div class="mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="api-response-text">${content}</div>
            </div>`;
        bubbleWrap.appendChild(avatar); bubbleWrap.appendChild(card); wrapper.appendChild(bubbleWrap);
        ELEMENTS.chatMessages.appendChild(wrapper);
        ELEMENTS.chatMessages.scrollTop = ELEMENTS.chatMessages.scrollHeight;
    }

    function showTyping() {
        if (document.getElementById('typing-indicator')) return;
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex justify-start';
        typingDiv.innerHTML = '<div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-2xl"><div class="flex space-x-1"><div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div><div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div><div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div></div></div>';
        ELEMENTS.chatMessages.appendChild(typingDiv);
        ELEMENTS.chatMessages.scrollTop = ELEMENTS.chatMessages.scrollHeight;
    }
    function hideTyping() { const el = document.getElementById('typing-indicator'); if (el) el.remove(); }

    // ===== CHAT LOGIC =====
    async function ensureSession() {
        if (store.state.sessionId) return;
        const resp = await Api.post('/sessions/', {});
        store.state.sessionId = resp.session_id;
        store.state.conversationId = resp.conversation_id;
        localStorage.setItem(CONFIG.localStorageKey, store.state.sessionId);
    }

    async function startNewConversation(render = true) {
        await ensureSession();
        const conv = await Api.post('/conversations/', { session_id: store.state.sessionId });
        store.state.conversationId = conv.id;
        if (render) {
            ELEMENTS.chatMessages.innerHTML = '';
            if (ELEMENTS.welcomeCard) ELEMENTS.welcomeCard.style.display = 'block';
            await refreshHistory();
        }
    }

    async function refreshHistory() {
        if (!ELEMENTS.chatHistory) return;
        try {
            const list = await Api.get('/conversations/' + store.state.sessionId);
            ELEMENTS.chatHistory.innerHTML = '';
            if (!list.length) return;
            list.forEach((conv) => {
                const container = document.createElement('div');
                container.className = 'history-item-container';
                const item = document.createElement('div');
                item.className = 'chat-history-item p-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors';
                item.dataset.chatId = conv.id;
                item.innerHTML = `<h4 class=\"font-medium text-sm truncate\">${conv.title || 'بدون عنوان'}</h4><p class=\"text-xs text-gray-500 dark:text-gray-400 mt-1\">${new Date(conv.created_at || Date.now()).toLocaleString('fa-IR')}</p>`;
                item.addEventListener('click', () => loadConversation(conv.id));

                const delBtn = document.createElement('button');
                delBtn.className = 'history-delete-btn';
                delBtn.title = 'حذف گفتگو';
                delBtn.innerHTML = '<i class="fas fa-trash"></i>';
                delBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (!confirm('این گفتگو حذف شود؟')) return;
                    try {
                        await Api.delete('/conversations/' + conv.id);
                        Notification.success('گفتگو حذف شد');
                        if (store.state.conversationId === conv.id) {
                            store.state.conversationId = null;
                            ELEMENTS.chatMessages.innerHTML = '';
                            if (ELEMENTS.welcomeCard) ELEMENTS.welcomeCard.style.display = 'block';
                        }
                        await refreshHistory();
                    } catch (err) {
                        Notification.error('حذف گفتگو ناموفق بود');
                    }
                });

                container.appendChild(item);
                container.appendChild(delBtn);
                ELEMENTS.chatHistory.appendChild(container);
            });
        } catch (e) { console.warn(e); }
    }

    async function loadConversation(conversationId) {
        store.state.conversationId = conversationId;
        ELEMENTS.chatMessages.innerHTML = '';
        if (ELEMENTS.welcomeCard) ELEMENTS.welcomeCard.style.display = 'none';
        try {
            const resp = await Api.get(`/conversations/${conversationId}/messages`);
            const { messages } = resp;
            if (!messages.length) { if (ELEMENTS.welcomeCard) ELEMENTS.welcomeCard.style.display = 'block'; return; }
            messages.forEach((m) => {
                if ((m.sender_type || '').toLowerCase() === 'user') renderUserMessage(m.content);
                else renderAIMessage(m.content);
            });
            ELEMENTS.messageInput && ELEMENTS.messageInput.focus();
            await refreshHistory();
        } catch (e) { console.error(e); }
    }

    async function sendMessage() {
        const text = (ELEMENTS.messageInput?.value || '').trim();
        if (!text || store.state.isLoading) return;
        if (ELEMENTS.welcomeCard) ELEMENTS.welcomeCard.style.display = 'none';
        renderUserMessage(text);
        ELEMENTS.messageInput.value = '';
        store.state.isLoading = true;
        showTyping();
        try {
            await ensureSession();
            if (!store.state.conversationId) {
                const conv = await Api.post('/conversations/', { session_id: store.state.sessionId });
                store.state.conversationId = conv.id;
            }
            const resp = await Api.post('/messages/' + store.state.conversationId, { content: text });
            hideTyping();
            renderAIMessage(resp.content || '');
            await refreshHistory();
        } catch (e) {
            hideTyping();
            Notification.error('ارسال پیام ناموفق بود');
            console.error(e);
        } finally {
            store.state.isLoading = false;
            updateControlsState();
        }
    }

    function updateControlsState() {
        const hasText = (ELEMENTS.messageInput?.value || '').trim() !== '';
        if (ELEMENTS.sendButton) ELEMENTS.sendButton.disabled = store.state.isLoading || !hasText;
        if (ELEMENTS.newChatButton) ELEMENTS.newChatButton.disabled = store.state.isLoading;
        if (ELEMENTS.newChatSidebarButton) ELEMENTS.newChatSidebarButton.disabled = store.state.isLoading;
        if (ELEMENTS.messageInput) ELEMENTS.messageInput.disabled = store.state.isLoading;
    }

    // ===== EVENT BINDINGS =====
    if (ELEMENTS.sendButton) ELEMENTS.sendButton.addEventListener('click', sendMessage);
    if (ELEMENTS.messageInput) {
        ELEMENTS.messageInput.addEventListener('input', updateControlsState);
        ELEMENTS.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
        });
    }
    if (ELEMENTS.newChatButton) ELEMENTS.newChatButton.addEventListener('click', () => startNewConversation(true));
    if (ELEMENTS.newChatSidebarButton) ELEMENTS.newChatSidebarButton.addEventListener('click', () => startNewConversation(true));
    if (ELEMENTS.themeToggle) ELEMENTS.themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        if (isDark) { html.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
        else { html.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    });
    if (ELEMENTS.profileButton && ELEMENTS.profileMenu) {
        ELEMENTS.profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            ELEMENTS.profileMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', () => ELEMENTS.profileMenu.classList.add('hidden'));
    }
    if (ELEMENTS.sidebar && ELEMENTS.sidebarClose && ELEMENTS.sidebarOverlay) {
        ELEMENTS.sidebarClose.addEventListener('click', () => {
            ELEMENTS.sidebar.classList.add('translate-x-full');
            ELEMENTS.sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
        });
        ELEMENTS.sidebarOverlay.addEventListener('click', () => {
            ELEMENTS.sidebar.classList.add('translate-x-full');
            ELEMENTS.sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
        });
    }

    // Quick questions
    document.querySelectorAll('.quick-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.querySelector('p')?.textContent || '';
            if (ELEMENTS.messageInput) ELEMENTS.messageInput.value = text;
            updateControlsState();
            sendMessage();
        });
    });

    // ===== INIT =====
    (async function init() {
        try {
            if (store.state.sessionId) {
                // load latest conversation if any
                const list = await Api.get('/conversations/' + store.state.sessionId);
                if (list && list.length) await loadConversation(list[0].id);
                else await startNewConversation(false);
            } else {
                await startNewConversation(false);
            }
        } catch (e) { console.warn(e); }
        updateControlsState();
    })();
});

document.addEventListener('DOMContentLoaded', () => {
    // Theme init
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');

    // Minimal App bootstrap from script.js focusing on chat only
    const ELEMENTS = {
        chatMessages: document.getElementById("chat-messages"),
        messageInput: document.getElementById("message-input"),
        sendButton: document.getElementById("send-button"),
        newChatButton: document.getElementById("new-chat"),
        newChatSidebarButton: document.getElementById("new-chat-sidebar"),
        chatHistory: document.getElementById("chat-history"),
        welcomeCard: document.getElementById("welcome-card"),
    };

    const CONFIG = {
        apiBaseUrl: "http://127.0.0.1:8000/api/v1",
        localStorageKey: "tebnegar_session_id_v2",
    };

    const store = { state: { sessionId: localStorage.getItem(CONFIG.localStorageKey), conversationId: null, isLoading: false } };

    const Api = {
        async request(url, options = {}) {
            const res = await fetch(CONFIG.apiBaseUrl + url, { headers: { 'Content-Type': 'application/json' }, ...options });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        },
        get(url) { return this.request(url); },
        post(url, data) { return this.request(url, { method: 'POST', body: JSON.stringify(data) }); },
    };

    async function ensureSession() {
        if (store.state.sessionId) return;
        const { session_id, conversation_id } = await Api.post('/sessions/', {});
        store.state.sessionId = session_id;
        store.state.conversationId = conversation_id;
        localStorage.setItem(CONFIG.localStorageKey, session_id);
    }

    function renderMessage(role, content) {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-enter flex justify-start';
        const container = document.createElement('div');
        container.className = 'chat-bubble items-start';
        const avatar = document.createElement('div');
        avatar.className = `chat-avatar ${role === 'user' ? 'user' : 'ai'}`;
        avatar.innerHTML = `<i class="fas ${role === 'user' ? 'fa-user' : 'fa-robot'}"></i>`;
        const bubble = document.createElement('div');
        bubble.className = `max-w-3xl px-4 py-3 rounded-2xl ${role === 'user' ? 'bg-gradient-to-r from-medical-blue-500 to-medical-blue-600 text-white' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'}`;
        bubble.textContent = content;
        container.appendChild(avatar); container.appendChild(bubble); wrapper.appendChild(container);
        ELEMENTS.chatMessages.appendChild(wrapper);
        ELEMENTS.chatMessages.scrollTop = ELEMENTS.chatMessages.scrollHeight;
    }

    function showTyping() {
        if (document.getElementById('typing-indicator')) return;
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex justify-start';
        typingDiv.innerHTML = '<div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-2xl"><div class="flex space-x-1"><div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div><div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div><div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div></div></div>';
        ELEMENTS.chatMessages.appendChild(typingDiv);
    }
    function hideTyping() { const el = document.getElementById('typing-indicator'); if (el) el.remove(); }

    async function sendMessage() {
        const text = ELEMENTS.messageInput.value.trim();
        if (!text) return;
        if (ELEMENTS.welcomeCard) ELEMENTS.welcomeCard.style.display = 'none';
        renderMessage('user', text);
        ELEMENTS.messageInput.value = '';
        showTyping();
        try {
            if (!store.state.conversationId) {
                await ensureSession();
                const conv = await Api.post('/conversations/', { session_id: store.state.sessionId });
                store.state.conversationId = conv.id;
            }
            const resp = await Api.post('/messages/' + store.state.conversationId, { content: text });
            hideTyping();
            renderMessage('ai', resp.content || '');
        } catch (e) {
            hideTyping();
            console.error(e);
        }
    }

    if (ELEMENTS.sendButton) ELEMENTS.sendButton.addEventListener('click', sendMessage);
    if (ELEMENTS.messageInput) {
        ELEMENTS.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
        });
        ELEMENTS.messageInput.addEventListener('input', () => {
            ELEMENTS.sendButton.disabled = ELEMENTS.messageInput.value.trim() === '';
        });
    }
});


