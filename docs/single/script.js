/**
 * TebNegar - Medical AI Assistant
 * Clean and organized JavaScript for the medical chat interface
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ===== SPLASH SCREEN & AUTHENTICATION =====
    let isAuthenticated = localStorage.getItem('tebnegar_authenticated') === 'true';
    let userData = JSON.parse(localStorage.getItem('tebnegar_user_data') || '{}');

    // Show splash screen if not authenticated
    if (!isAuthenticated) {
        document.getElementById('splash-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }

    // ===== I18N =====
    const I18N = {
        fa: {
            "app.title": "TebNegar - دستیار هوشمند پزشکی",
            "header.brand": "TebNegar",
            "header.tagline": "دستیار هوشمند پزشکی",
            "sidebar.title": "تاریخچه چت‌ها",
            "welcome.title": "به TebNegar خوش آمدید",
            "welcome.subtitle": "من یک دستیار هوشمند پزشکی هستم. علائم خود را شرح دهید تا بتوانم شما را راهنمایی کنم.",
            "quick.q1": "تب و سردرد دارم",
            "quick.q2": "درد قفسه سینه",
            "quick.q3": "سوال دارویی",
            "actions.new_chat": "گفتگوی جدید",
            "actions.send": "ارسال",
            "input.placeholder": "علائم خود را شرح دهید...",
            "profile.settings": "تنظیمات",
            "profile.logout": "خروج",
            "footer.disclaimer": " طب نگار میتواند اشتباه کند و جایگزین مشاوره پزشک نمیباشد"
        },
        en: {
            "app.title": "TebNegar - Medical AI Assistant",
            "header.brand": "TebNegar",
            "header.tagline": "Intelligent Medical Assistant",
            "sidebar.title": "Chat History",
            "welcome.title": "Welcome to TebNegar",
            "welcome.subtitle": "I am an intelligent medical assistant. Describe your symptoms so I can guide you.",
            "quick.q1": "I have fever and headache",
            "quick.q2": "Chest pain",
            "quick.q3": "Medication question",
            "actions.new_chat": "New chat",
            "actions.send": "Send",
            "input.placeholder": "Describe your symptoms...",
            "profile.settings": "Settings",
            "profile.logout": "Logout",
            "footer.disclaimer": "TebNegar may make mistakes and is not a substitute for medical consultation."
        }
    };

    const getSavedLang = () => localStorage.getItem('lang') || 'fa';
    const setSavedLang = (lang) => localStorage.setItem('lang', lang);

    const applyLanguage = (lang) => {
        const dict = I18N[lang] || I18N.fa;
        // Text content keys
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });
        // Placeholder keys
        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) el.setAttribute('placeholder', dict[key]);
        });
        // Title
        const titleEl = document.querySelector('title[data-i18n="app.title"]');
        if (titleEl) titleEl.textContent = dict['app.title'];

        // Direction and alignment
        const html = document.documentElement;
        if (lang === 'fa') {
            html.setAttribute('lang', 'fa');
            html.setAttribute('dir', 'rtl');
        } else {
            html.setAttribute('lang', 'en');
            html.setAttribute('dir', 'ltr');
        }
        const langLabel = document.getElementById('lang-label');
        if (langLabel) langLabel.textContent = lang.toUpperCase();
    };

    // Helpers
    const setActiveLangSegment = (lang) => {
        const faBtn = document.getElementById('lang-fa');
        const enBtn = document.getElementById('lang-en');
        if (!faBtn || !enBtn) return;
        faBtn.classList.toggle('active', lang === 'fa');
        enBtn.classList.toggle('active', lang === 'en');
        // Simple animated indicator via scale
        faBtn.style.transform = lang === 'fa' ? 'scale(1.02)' : 'scale(1)';
        enBtn.style.transform = lang === 'en' ? 'scale(1.02)' : 'scale(1)';
    };

    // Monkey-patch applyLanguage to also set directions and segmented state reliably
    const originalApplyLanguage = typeof applyLanguage === 'function' ? applyLanguage : null;
    const stableApplyLanguage = (lang) => {
        if (originalApplyLanguage) originalApplyLanguage(lang); else {
            // fallback minimal
            const html = document.documentElement;
            html.setAttribute('lang', lang === 'fa' ? 'fa' : 'en');
            html.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
        }
        // Ensure textarea direction updates immediately
        const textarea = document.getElementById('message-input');
        if (textarea) {
            textarea.dir = (lang === 'fa' ? 'rtl' : 'ltr');
            textarea.style.textAlign = (lang === 'fa' ? 'right' : 'left');
        }
        // Update segmented visuals
        setActiveLangSegment(lang);
    };

    // ===== STATE MANAGEMENT =====
    const createStore = (initialState) => {
        const subscribers = [];
        const state = new Proxy(initialState, {
            set(target, property, value) {
                target[property] = value;
                subscribers.forEach((callback) => callback());
                return true;
            },
        });

        const subscribe = (callback) => {
            subscribers.push(callback);
        };

        return { state, subscribe };
    };

    const store = createStore({
        sessionId: null,
        conversationId: null,
        lastAiMessageId: null,
        isLoading: false,
    });

    // ===== CONFIGURATION =====
    const CONFIG = {
        apiBaseUrl: "http://127.0.0.1:8000/api/v1",
        localStorageKey: "tebnegar_session_id_v2",
    };

    // ===== DOM ELEMENT CACHING =====
    const ELEMENTS = {
        chatMessages: document.getElementById("chat-messages"),
        messageInput: document.getElementById("message-input"),
        sendButton: document.getElementById("send-button"),
        newChatButton: document.getElementById("new-chat"),
        newChatSidebarButton: document.getElementById("new-chat-sidebar"),
        chatHistory: document.getElementById("chat-history"),
        welcomeCard: document.getElementById("welcome-card"),
        themeToggle: document.getElementById("theme-toggle"),
        sidebar: document.getElementById("sidebar"),
        sidebarToggle: document.getElementById("sidebar-toggle"),
        sidebarClose: document.getElementById("sidebar-close"),
        sidebarOverlay: document.getElementById("sidebar-overlay"),
        profileButton: document.getElementById("profile-button"),
        profileMenu: document.getElementById("profile-menu"),
        langFa: document.getElementById('lang-fa'),
        langEn: document.getElementById('lang-en'),
    };

    // ===== NOTIFICATION SERVICE =====
    const NotificationService = {
        showError(message) {
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 notification-enter';
            notification.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.classList.remove('notification-enter');
                notification.classList.add('notification-exit');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        },
        showSuccess(message) {
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 notification-enter';
            notification.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fas fa-check-circle"></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.classList.remove('notification-enter');
                notification.classList.add('notification-exit');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        },
    };

    // ===== API SERVICE =====
    const ApiService = {
        async request(url, options = {}) {
            store.state.isLoading = true;
            try {
                const response = await fetch(CONFIG.apiBaseUrl + url, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                store.state.isLoading = false;
                return data;
            } catch (error) {
                store.state.isLoading = false;
                NotificationService.showError(error.message);
                throw error;
            }
        },
        async get(url) { return this.request(url); },
        async post(url, data) { return this.request(url, { method: 'POST', body: JSON.stringify(data) }); },
        async delete(url) { return this.request(url, { method: 'DELETE' }); },
        async patch(url, data) { return this.request(url, { method: 'PATCH', body: JSON.stringify(data) }); }
    };

    // ===== CORE APPLICATION LOGIC =====
    const App = {
        init() {
            // Apply language at startup
            const savedLang = getSavedLang();
            stableApplyLanguage(savedLang);
            this.bindMenusAndLang();

            store.subscribe(() => {
                const { isLoading } = store.state;
                const hasText = ELEMENTS.messageInput.value.trim() !== "";
                ELEMENTS.sendButton.disabled = isLoading || !hasText;
                if (ELEMENTS.newChatButton) ELEMENTS.newChatButton.disabled = isLoading;
                if (ELEMENTS.newChatSidebarButton) ELEMENTS.newChatSidebarButton.disabled = isLoading;
                ELEMENTS.messageInput.disabled = isLoading;
            });
            this.main();
        },

        bindMenusAndLang() {
            // Profile dropdown toggle
            if (ELEMENTS.profileButton && ELEMENTS.profileMenu) {
                ELEMENTS.profileButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ELEMENTS.profileMenu.classList.toggle('hidden');
                });
            }
            document.addEventListener('click', () => {
                ELEMENTS.profileMenu && ELEMENTS.profileMenu.classList.add('hidden');
            });
            // Language segmented
            const setLang = (lang) => { setSavedLang(lang); stableApplyLanguage(lang); };
            if (ELEMENTS.langFa) {
                ELEMENTS.langFa.addEventListener('click', () => setLang('fa'));
            }
            if (ELEMENTS.langEn) {
                ELEMENTS.langEn.addEventListener('click', () => setLang('en'));
            }
            // Initialize active
            stableApplyLanguage(getSavedLang());
        },

        async main() {
            store.state.sessionId = localStorage.getItem(CONFIG.localStorageKey);
            try {
                if (store.state.sessionId) {
                    await this.fetchHistoryAndLoadLatest();
                } else {
                    await this.createNewSession();
                }
                this.setupEventListeners();
            } catch (error) {
                console.error("Critical initialization error:", error);
            }
        },

        setupEventListeners() {
            // Message input events
            ELEMENTS.messageInput.addEventListener("input", () => {
                this.autoResizeTextarea();
                store.state.isLoading = store.state.isLoading; // Trigger state update
            });

            ELEMENTS.messageInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey && !ELEMENTS.sendButton.disabled) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });

            // Send button
            ELEMENTS.sendButton.addEventListener("click", this.handleSendMessage.bind(this));

            // New chat button
            if (ELEMENTS.newChatButton) ELEMENTS.newChatButton.addEventListener("click", () => this.handleNewChatClick(true));
            if (ELEMENTS.newChatSidebarButton) ELEMENTS.newChatSidebarButton.addEventListener("click", () => this.handleNewChatClick(true));

            // Theme toggle
            ELEMENTS.themeToggle.addEventListener('click', this.toggleTheme);

            // Quick questions
            document.querySelectorAll('.quick-question').forEach(question => {
                question.addEventListener('click', () => {
                    const text = question.querySelector('p').textContent;
                    ELEMENTS.messageInput.value = text;
                    store.state.isLoading = store.state.isLoading; // Trigger state update
                    this.handleSendMessage();
                });
            });

            // Chat history with edit/delete functionality
            ELEMENTS.chatHistory.addEventListener('click', this.handleHistoryContainerClick.bind(this));

            // Sidebar toggle functionality
            ELEMENTS.sidebarToggle.addEventListener('click', this.toggleSidebar.bind(this));
            ELEMENTS.sidebarClose.addEventListener('click', this.closeSidebar.bind(this));
            ELEMENTS.sidebarOverlay.addEventListener('click', this.closeSidebar.bind(this));
        },

        async createNewSession() {
            const marketingData = this.getMarketingData();
            const response = await ApiService.post("/sessions/", marketingData);
            const { session_id, conversation_id } = response;
            store.state.sessionId = session_id;
            store.state.conversationId = conversation_id;
            localStorage.setItem(CONFIG.localStorageKey, session_id);
            await this.renderConversation(conversation_id);
        },

        async fetchHistoryAndLoadLatest() {
            try {
                const history = await ApiService.get("/conversations/" + store.state.sessionId);
                if (history.length > 0) {
                    await this.renderConversation(history[0].id);
                } else {
                    await this.handleNewChatClick(false);
                }
                await this.updateHistorySidebar();
            } catch (error) {
                console.warn("Session expired or invalid, creating a new one.");
                localStorage.removeItem(CONFIG.localStorageKey);
                await this.createNewSession();
            }
        },

        async handleSendMessage() {
            const userInput = ELEMENTS.messageInput.value.trim();
            if (!userInput || store.state.isLoading) return;

            if (ELEMENTS.welcomeCard) {
                ELEMENTS.welcomeCard.style.display = 'none';
            }

            this.renderMessage("user", userInput);
            const messageToSend = userInput;
            this.resetInput();
            this.showTypingIndicator();

            try {
                const response = await ApiService.post("/messages/" + store.state.conversationId, {
                    content: messageToSend
                });
                const { id, content } = response;
                store.state.lastAiMessageId = id;
                this.hideTypingIndicator();
                this.renderAIMessage(content);
                await this.updateHistorySidebar();
            } catch (error) {
                this.hideTypingIndicator();
                console.error("Message send failed:", error);
            }
        },

        async handleNewChatClick(render = true) {
            if (store.state.isLoading) return;
            try {
                const newConversation = await ApiService.post("/conversations/", {
                    session_id: store.state.sessionId,
                });
                if (render) {
                    await this.renderConversation(newConversation.id);
                } else {
                    store.state.conversationId = newConversation.id;
                    ELEMENTS.chatMessages.innerHTML = "";
                    ELEMENTS.welcomeCard.style.display = 'block';
                    await this.updateHistorySidebar();
                }
            } catch (error) {
                console.error("New chat creation failed:", error);
            }
        },

        handleHistoryContainerClick(e) {
            const conversationButton = e.target.closest('.chat-history-item');
            const deleteButton = e.target.closest('.delete-btn');
            const editButton = e.target.closest('.edit-btn');
            const { conversationId, isLoading } = store.state;

            if (deleteButton) {
                this.handleDeleteConversationClick(deleteButton.dataset.conversationId);
            } else if (editButton) {
                this.handleEditConversationClick(editButton);
            } else if (conversationButton && !isLoading && conversationButton.dataset.chatId !== conversationId) {
                this.renderConversation(conversationButton.dataset.chatId);
            }
        },

        async handleDeleteConversationClick(conversationId) {
            const dialog = document.createElement('div');
            dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            dialog.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">حذف چت</h3>
                    </div>
                    <p class="text-gray-600 dark:text-gray-300 mb-6">آیا مطمئن هستید که می‌خواهید این چت را حذف کنید؟ این عمل قابل بازگشت نیست.</p>
                    <div class="flex gap-3 justify-end">
                        <button class="cancel-btn px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            انصراف
                        </button>
                        <button class="confirm-btn px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                            حذف
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(dialog);
            const cancelBtn = dialog.querySelector('.cancel-btn');
            const confirmBtn = dialog.querySelector('.confirm-btn');
            const cleanup = () => { document.body.removeChild(dialog); };
            cancelBtn.addEventListener('click', cleanup);
            confirmBtn.addEventListener('click', async () => {
                try {
                    await ApiService.delete("/conversations/" + conversationId);
                    NotificationService.showSuccess("چت با موفقیت حذف شد.");
                    if (store.state.conversationId === conversationId) {
                        await this.fetchHistoryAndLoadLatest();
                    } else {
                        await this.updateHistorySidebar();
                    }
                    cleanup();
                } catch (error) {
                    console.error("حذف چت ناموفق بود:", error);
                    NotificationService.showError("خطا در حذف چت");
                    cleanup();
                }
            });
            dialog.addEventListener('click', (e) => { if (e.target === dialog) { cleanup(); } });
        },

        handleEditConversationClick(editButton) {
            const container = editButton.closest('.history-item-container');
            const titleElement = container.querySelector('h4');
            const conversationId = editButton.dataset.conversationId;
            const originalTitle = titleElement.textContent;

            const input = document.createElement("input");
            input.type = "text";
            input.className = "title-edit-input";
            input.value = originalTitle;

            titleElement.style.display = "none";
            container.querySelector('.chat-history-item').prepend(input);
            input.focus();
            input.select();

            const saveChanges = async () => {
                const newTitle = input.value.trim();
                if (newTitle && newTitle !== originalTitle) {
                    try {
                        await ApiService.patch(`/conversations/${conversationId}`, { title: newTitle });
                        titleElement.textContent = newTitle;
                        NotificationService.showSuccess("عنوان با موفقیت به‌روزرسانی شد.");
                    } catch (error) {
                        titleElement.textContent = originalTitle;
                        console.error("به‌روزرسانی عنوان ناموفق بود:", error);
                    }
                }
                cleanup();
            };

            const cleanup = () => {
                input.remove();
                titleElement.style.display = "";
            };

            input.addEventListener("blur", saveChanges);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    saveChanges();
                } else if (e.key === "Escape") {
                    cleanup();
                }
            });
        },

        async renderConversation(conversationId) {
            store.state.conversationId = conversationId;
            ELEMENTS.chatMessages.innerHTML = "";
            ELEMENTS.welcomeCard.style.display = 'none';
            try {
                const response = await ApiService.get("/conversations/" + conversationId + "/messages");
                const { messages } = response;
                if (messages.length > 0) {
                    messages.forEach((msg) => {
                        if (msg.sender_type.toLowerCase() === 'user') {
                            this.renderMessage('user', msg.content);
                        } else {
                            this.renderAIMessage(msg.content);
                        }
                    });
                } else {
                    ELEMENTS.welcomeCard.style.display = 'block';
                }
                await this.updateHistorySidebar();
                ELEMENTS.messageInput.focus();
            } catch (error) {
                console.error("Conversation loading failed:", error);
            }
        },

        async updateHistorySidebar() {
            try {
                const conversations = await ApiService.get("/conversations/" + store.state.sessionId);
                ELEMENTS.chatHistory.innerHTML = "";
                const { conversationId } = store.state;
                if (conversations.length === 0) {
                    const emptyState = document.createElement("div");
                    emptyState.className = "text-center py-8 text-gray-500 dark:text-gray-400";
                    emptyState.innerHTML = `
                        <i class="fas fa-comments text-2xl mb-2"></i>
                        <p class="text-sm">هیچ چتی وجود ندارد</p>
                    `;
                    ELEMENTS.chatHistory.appendChild(emptyState);
                    return;
                }
                conversations.forEach((conv) => {
                    const container = document.createElement("div");
                    container.className = "history-item-container relative";
                    const item = document.createElement("div");
                    item.className = `chat-history-item p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${conv.id === conversationId ? 'bg-medical-blue-100 dark:bg-medical-blue-800' : 'bg-gray-100 dark:bg-gray-700'
                        }`;
                    item.dataset.chatId = conv.id;
                    item.innerHTML = `
                        <h4 class="font-medium text-sm truncate">${conv.title}</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${this.formatDate(conv.created_at || new Date())}</p>
                    `;
                    const editBtn = document.createElement("button");
                    editBtn.type = "button";
                    editBtn.className = "edit-btn";
                    editBtn.innerHTML = '<i class="fas fa-pencil"></i>';
                    editBtn.dataset.conversationId = conv.id;
                    editBtn.setAttribute('aria-label', `ویرایش عنوان: ${conv.title}`);
                    const deleteBtn = document.createElement("button");
                    deleteBtn.type = "button";
                    deleteBtn.className = "delete-btn";
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteBtn.dataset.conversationId = conv.id;
                    deleteBtn.setAttribute('aria-label', `حذف چت: ${conv.title}`);
                    container.appendChild(item);
                    container.appendChild(editBtn);
                    container.appendChild(deleteBtn);
                    ELEMENTS.chatHistory.appendChild(container);
                });
            } catch (error) {
                console.error("Could not refresh history sidebar:", error);
                ELEMENTS.chatHistory.innerHTML = `
                    <div class="text-center py-8 text-red-500">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <p class="text-sm">خطا در بارگذاری چت‌ها</p>
                    </div>
                `;
            }
        },

        renderMessage(role, content) {
            const wrapper = document.createElement("div");
            wrapper.className = 'message-enter flex justify-start';
            const container = document.createElement('div');
            container.className = 'chat-bubble items-start';
            const avatar = document.createElement('div');
            avatar.className = `chat-avatar ${role === 'user' ? 'user' : 'ai'}`;
            avatar.innerHTML = `<i class="fas ${role === 'user' ? 'fa-user' : 'fa-robot'}"></i>`;
            const bubble = document.createElement("div");
            bubble.className = `max-w-3xl px-4 py-3 rounded-2xl ${role === 'user' ? 'bg-gradient-to-r from-medical-blue-500 to-medical-blue-600 text-white' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'}`;
            bubble.textContent = content;
            container.appendChild(avatar);
            container.appendChild(bubble);
            wrapper.appendChild(container);
            ELEMENTS.chatMessages.appendChild(wrapper);
            ELEMENTS.chatMessages.scrollTop = ELEMENTS.chatMessages.scrollHeight;
        },

        renderAIMessage(content) {
            const responseDiv = document.createElement('div');
            responseDiv.className = 'message-enter flex justify-start';
            const container = document.createElement('div');
            container.className = 'chat-bubble items-start';
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
                <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">پاسخ از API:</p>
                    <div class="api-response-text">${content}</div>
                </div>
                ${this.getDefaultSections()}
            `;
            container.appendChild(avatar);
            container.appendChild(card);
            responseDiv.appendChild(container);
            ELEMENTS.chatMessages.appendChild(responseDiv);
            ELEMENTS.chatMessages.scrollTop = ELEMENTS.chatMessages.scrollHeight;
        },

        getDefaultSections() {
            return `
                <div class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                        <h4 class="font-semibold text-yellow-800 dark:text-yellow-300">هشدارها</h4>
                    </div>
                    <div class="text-sm text-yellow-700 dark:text-yellow-200 space-y-1">
                        <div>• اگر علائم تشدید شود، فوراً به پزشک مراجعه کنید</div>
                        <div>• این تشخیص جایگزین مشاوره پزشک نیست</div>
                    </div>
                </div>
                <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-book-medical text-blue-600"></i>
                        <h4 class="font-semibold text-blue-800 dark:text-blue-300">منابع</h4>
                    </div>
                    <ul class="text-sm space-y-1 text-blue-700 dark:text-blue-200">
                        <li>• سازمان بهداشت جهانی (WHO)</li>
                        <li>• انجمن پزشکی آمریکا (AMA)</li>
                    </ul>
                </div>
                <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-question-circle text-purple-600"></i>
                        <h4 class="font-semibold text-purple-800 dark:text-purple-300">سوالات تکمیلی</h4>
                    </div>
                    <div class="space-y-2">
                        <button class="follow-up-question block w-full text-right p-2 text-sm bg-purple-100 dark:bg-purple-800/30 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-700/30 transition-colors text-purple-700 dark:text-purple-200">
                            آیا علائم خاصی غیر از آنچه ذکر کردید دارید؟
                        </button>
                        <button class="follow-up-question block w-full text-right p-2 text-sm bg-purple-100 dark:bg-purple-800/30 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-700/30 transition-colors text-purple-700 dark:text-purple-200">
                            چه مدت است این علائم را دارید؟
                        </button>
                    </div>
                </div>
            `;
        },

        showTypingIndicator() {
            if (document.getElementById("typing-indicator")) return;
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typing-indicator';
            typingDiv.className = 'flex justify-start';
            typingDiv.innerHTML = `
                <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-2xl">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    </div>
                </div>
            `;
            ELEMENTS.chatMessages.appendChild(typingDiv);
            ELEMENTS.chatMessages.scrollTop = ELEMENTS.chatMessages.scrollHeight;
        },

        hideTypingIndicator() {
            const typingIndicator = document.getElementById("typing-indicator");
            if (typingIndicator) { typingIndicator.remove(); }
        },

        resetInput() {
            ELEMENTS.messageInput.value = "";
            this.autoResizeTextarea();
            store.state.isLoading = store.state.isLoading;
        },

        autoResizeTextarea() {
            ELEMENTS.messageInput.style.height = 'auto';
            ELEMENTS.messageInput.style.height = ELEMENTS.messageInput.scrollHeight + 'px';
        },

        scrollToBottom() {
            ELEMENTS.chatMessages.scrollTop = ELEMENTS.chatMessages.scrollHeight;
        },

        getMarketingData() {
            return {
                landing_page_url: window.location.href,
                referrer_url: document.referrer || null,
                ...Object.fromEntries(new URLSearchParams(window.location.search)),
            };
        },

        formatDate(date) {
            if (typeof date === 'string') { date = new Date(date); }
            const lang = getSavedLang();
            try {
                return date.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US');
            } catch (_) {
                return date.toLocaleDateString();
            }
        },

        toggleTheme() {
            const html = document.documentElement;
            html.classList.toggle('dark');
            const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        },

        toggleSidebar() {
            ELEMENTS.sidebar.classList.remove('translate-x-full');
            ELEMENTS.sidebarOverlay.classList.remove('opacity-0', 'pointer-events-none');
            ELEMENTS.sidebarOverlay.classList.add('opacity-100', 'pointer-events-auto');
        },

        closeSidebar() {
            ELEMENTS.sidebar.classList.add('translate-x-full');
            ELEMENTS.sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
            ELEMENTS.sidebarOverlay.classList.remove('opacity-100', 'pointer-events-auto');
        }
    };

    // Override rendering to stack messages vertically (no left/right alignment)
    App.renderMessage = function (role, content) {
        const wrapper = document.createElement("div");
        wrapper.className = 'message-enter flex justify-start';
        const container = document.createElement('div');
        container.className = 'chat-bubble items-start';
        const avatar = document.createElement('div');
        avatar.className = `chat-avatar ${role === 'user' ? 'user' : 'ai'}`;
        avatar.innerHTML = `<i class="fas ${role === 'user' ? 'fa-user' : 'fa-robot'}"></i>`;
        const bubble = document.createElement("div");
        bubble.className = `max-w-3xl px-4 py-3 rounded-2xl ${role === 'user' ? 'bg-gradient-to-r from-medical-blue-500 to-medical-blue-600 text-white' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'}`;
        bubble.textContent = content;
        container.appendChild(avatar);
        container.appendChild(bubble);
        wrapper.appendChild(container);
        ELEMENTS.chatMessages.appendChild(wrapper);
        ELEMENTS.chatMessages.scrollTop = ELEMENTS.chatMessages.scrollHeight;
    };

    App.renderAIMessage = function (content) {
        const responseDiv = document.createElement('div');
        responseDiv.className = 'message-enter flex justify-start';
        const container = document.createElement('div');
        container.className = 'chat-bubble items-start';
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
            <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">پاسخ از API:</p>
                <div class="api-response-text">${content}</div>
            </div>
            ${typeof App.getDefaultSections === 'function' ? App.getDefaultSections() : ''}
        `;
        container.appendChild(avatar);
        container.appendChild(card);
        responseDiv.appendChild(container);
        ELEMENTS.chatMessages.appendChild(responseDiv);
        ELEMENTS.chatMessages.scrollTop = ELEMENTS.chatMessages.scrollHeight;
    };

    // After stableApplyLanguage, ensure layout swap occurs by toggling dir
    // We already set html dir in stableApplyLanguage. Here we just call it again on change.

    // Wire segmented language toggle
    const savedLangHeader = localStorage.getItem('lang') || 'fa';
    stableApplyLanguage(savedLangHeader);
    if (document.getElementById('lang-fa')) {
        document.getElementById('lang-fa').addEventListener('click', () => {
            localStorage.setItem('lang', 'fa');
            stableApplyLanguage('fa');
        });
    }
    if (document.getElementById('lang-en')) {
        document.getElementById('lang-en').addEventListener('click', () => {
            localStorage.setItem('lang', 'en');
            stableApplyLanguage('en');
        });
    }

    // Make App globally accessible if needed
    window.App = App;

    // ===== NAVIGATION SYSTEM =====
    const Navigation = {
        init() {
            this.bindNavigationEvents();
            this.showHomepage(); // Show homepage by default
        },

        bindNavigationEvents() {
            // Sidebar navigation links
            document.querySelectorAll('.sidebar-nav-item').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = link.getAttribute('href')?.substring(1);
                    if (target) {
                        this.navigateTo(target);
                        this.updateSidebarActiveState(link);
                    }
                });
            });

            // Bottom navigation links
            document.querySelectorAll('.bottom-nav-item').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = link.getAttribute('href')?.substring(1);
                    if (target) {
                        this.navigateTo(target);
                        this.updateBottomNavActiveState(link);
                    }
                });
            });

            // Handle direct links to profile from dropdown or elsewhere
            document.querySelectorAll('a[href="#profile"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateTo('profile');
                });
            });

            // Navigate on hash change to support deep links like #profile
            window.addEventListener('hashchange', () => {
                const section = location.hash.replace('#', '') || 'home';
                this.navigateTo(section);
            });

            // Mobile menu toggle (for sidebar on mobile) - Enhanced functionality
            const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
            const sidebarNav = document.getElementById('sidebar-nav');

            if (mobileMenuToggle && sidebarNav) {
                mobileMenuToggle.addEventListener('click', () => {
                    // Toggle sidebar visibility on mobile with enhanced animations
                    if (window.innerWidth < 1024) {
                        sidebarNav.classList.toggle('hidden');
                        sidebarNav.classList.toggle('flex');

                        // Add mobile-specific styling and animations
                        if (sidebarNav.classList.contains('flex')) {
                            sidebarNav.classList.add('lg:hidden'); // Show on mobile, hide on desktop
                            sidebarNav.classList.remove('hidden');
                            // Add entrance animation
                            sidebarNav.style.animation = 'slideInRight 0.3s ease-out';
                        } else {
                            sidebarNav.classList.add('hidden');
                            sidebarNav.classList.remove('lg:hidden');
                            // Add exit animation
                            sidebarNav.style.animation = 'slideOutRight 0.3s ease-in';
                        }
                    }
                });
            }

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth < 1024) {
                    if (!mobileMenuToggle?.contains(e.target) && !sidebarNav?.contains(e.target)) {
                        if (sidebarNav?.classList.contains('flex')) {
                            sidebarNav.classList.add('hidden');
                            sidebarNav.classList.remove('flex', 'lg:hidden');
                            sidebarNav.style.animation = 'slideOutRight 0.3s ease-in';
                        }
                    }
                }
            });

            // Close sidebar when window resizes to desktop
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1024) {
                    if (sidebarNav?.classList.contains('flex')) {
                        sidebarNav.classList.add('hidden');
                        sidebarNav.classList.remove('flex', 'lg:hidden');
                    }
                }
            });

            // Theme toggle is handled centrally in App.setupEventListeners to avoid double toggling
        },

        navigateTo(section) {
            // Ensure only the requested section is visible and page is reset to top
            this.hideAllContent();
            window.scrollTo(0, 0);
            switch (section) {
                case 'home':
                    this.showHomepage();
                    break;
                case 'ai-assistant':
                    this.showAIAssistant();
                    break;
                case 'files':
                    this.showFiles();
                    break;
                case 'statistics':
                    this.showStatistics();
                    break;
                case 'profile':
                    this.showProfile();
                    break;
                case 'goals':
                    this.showGoals();
                    break;
                case 'about':
                    // About exists on homepage; show it exclusively, then scroll within homepage
                    this.showHomepage();
                    this.scrollToSection('about');
                    break;
                case 'features':
                    // Features exists on homepage; show it exclusively, then scroll within homepage
                    this.showHomepage();
                    this.scrollToSection('features');
                    break;
                default:
                    this.showHomepage();
            }
        },

        hideAllContent() {
            const sections = [
                document.getElementById('homepage-content'),
                document.getElementById('ai-assistant-content'),
                document.getElementById('profile-content')
            ];
            sections.forEach((el) => {
                if (el && !el.classList.contains('hidden')) {
                    el.classList.add('hidden');
                }
            });
        },

        showHomepage() {
            this.hideAllContent();
            document.getElementById('homepage-content').classList.remove('hidden');
            document.getElementById('ai-assistant-content').classList.add('hidden');
            this.updateActiveNav('home');

            // Close sidebar on mobile
            const sidebarNav = document.getElementById('sidebar-nav');
            if (sidebarNav && window.innerWidth < 1024) {
                sidebarNav.classList.remove('show');
            }

            // Initialize dashboard functionality
            this.initDashboard();

            // Show bottom nav back
            const bottomNav = document.getElementById('bottom-nav');
            bottomNav?.classList.remove('chat-hidden');
        },

        showAIAssistant() {
            this.hideAllContent();
            document.getElementById('ai-assistant-content').classList.remove('hidden');
            this.updateActiveNav('ai-assistant');

            // Close sidebar on mobile
            const sidebarNav = document.getElementById('sidebar-nav');
            if (sidebarNav && window.innerWidth < 1024) {
                sidebarNav.classList.remove('show');
            }

            // Initialize chat interface if not already done
            if (typeof App !== 'undefined' && App.init) {
                App.init();
            }

            // Hide bottom nav on mobile for clean chat screen
            const bottomNav = document.getElementById('bottom-nav');
            bottomNav?.classList.add('chat-hidden');

            // Wire back button to go home
            const backBtn = document.getElementById('chat-back');
            if (backBtn) {
                backBtn.onclick = () => this.showHomepage();
            }
        },

        // Dashboard functionality
        initDashboard() {
            this.bindDashboardEvents();
            this.updateDashboardData();
        },

        bindDashboardEvents() {
            // Quick action buttons
            document.querySelectorAll('.quick-action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.querySelector('span').textContent;
                    this.handleQuickAction(action);
                });
            });

            // Chat history cards
            document.querySelectorAll('.chat-history-card').forEach(card => {
                card.addEventListener('click', () => {
                    this.showAIAssistant();
                });
            });

            // Medical record cards
            document.querySelectorAll('.medical-record-card').forEach(card => {
                card.addEventListener('click', () => {
                    this.showMedicalRecord(card);
                });
            });
        },

        handleQuickAction(action) {
            // Handle different quick actions
            switch (action) {
                case 'ثبت خواب':
                    this.showSleepTracker();
                    break;
                case 'ثبت حال':
                    this.showMoodTracker();
                    break;
                case 'تمرینات ذهنی':
                    this.showMindfulnessExercises();
                    break;
                default:
                    console.log('Action:', action);
            }
        },

        showSleepTracker() {
            // Placeholder for sleep tracker functionality
            alert('قابلیت ثبت خواب به زودی اضافه خواهد شد');
        },

        showMoodTracker() {
            // Placeholder for mood tracker functionality
            alert('قابلیت ثبت حال به زودی اضافه خواهد شد');
        },

        showMindfulnessExercises() {
            // Placeholder for mindfulness exercises
            alert('قابلیت تمرینات ذهنی به زودی اضافه خواهد شد');
        },

        showMedicalRecord(card) {
            const recordType = card.querySelector('h3').textContent;
            alert(`نمایش جزئیات ${recordType} - این قابلیت به زودی اضافه خواهد شد`);
        },

        updateDashboardData() {
            // Update dashboard with real-time data (placeholder for future backend integration)
            this.updateHealthMetrics();
            this.updateRecentConversations();
        },

        updateHealthMetrics() {
            // Placeholder for updating health metrics from backend
            console.log('Updating health metrics...');
        },

        updateRecentConversations() {
            // Placeholder for updating recent conversations from backend
            console.log('Updating recent conversations...');
        },

        // New navigation functions
        showFiles() {
            // Placeholder for files section
            alert('بخش پرونده‌ها به زودی اضافه خواهد شد');
        },

        showStatistics() {
            // Placeholder for statistics section
            alert('بخش آمار و گزارش به زودی اضافه خواهد شد');
        },

        showProfile() {
            this.hideAllContent();
            document.getElementById('profile-content').classList.remove('hidden');
            this.updateActiveNav('profile');
        },

        showGoals() {
            // Placeholder for goals section
            alert('بخش اهداف سلامت به زودی اضافه خواهد شد');
        },

        scrollToSection(sectionId) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        },

        updateActiveNav(activeSection) {
            // Update sidebar active state
            this.updateSidebarActiveState(document.querySelector(`.sidebar-nav-item[href="#${activeSection}"]`));

            // Update bottom navigation active state
            this.updateBottomNavActiveState(document.querySelector(`.bottom-nav-item[href="#${activeSection}"]`));
        },

        updateSidebarActiveState(activeLink) {
            // Remove active class from all sidebar items
            document.querySelectorAll('.sidebar-nav-item').forEach(item => {
                item.classList.remove('active');
            });

            // Add active class to current item
            if (activeLink) {
                activeLink.classList.add('active');
            }
        },

        updateBottomNavActiveState(activeLink) {
            // Remove active class from all bottom nav items
            document.querySelectorAll('.bottom-nav-item').forEach(item => {
                item.classList.remove('active');
            });

            // Add active class to current item
            if (activeLink) {
                activeLink.classList.add('active');
            }
        },

        toggleTheme() {
            const html = document.documentElement;
            const isDark = html.classList.contains('dark');

            if (isDark) {
                html.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                html.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
        }
    };

    // ===== INITIALIZATION =====
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }

    // Apply saved language immediately before app renders
    stableApplyLanguage(getSavedLang());

    // Initialize navigation
    Navigation.init();

    // Initialize application
    App.init();

    // ===== THEME TOGGLE EVENT LISTENER (robust) =====
    function attachThemeToggleListener() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        // Remove previous listener by cloning (prevents duplicate toggles)
        const clone = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(clone, toggle);
        clone.addEventListener('click', () => {
            const html = document.documentElement;
            const isDark = html.classList.contains('dark');
            if (isDark) {
                html.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                html.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // Attach now and also after any navigation that may re-render headers
    attachThemeToggleListener();
    document.addEventListener('DOMContentLoaded', attachThemeToggleListener);
    window.addEventListener('hashchange', attachThemeToggleListener);

    // ===== AUTHENTICATION EVENT HANDLERS =====
    const splashScreen = document.getElementById('splash-screen');
    const app = document.getElementById('app');
    const slide1 = document.getElementById('splash-slide-1');
    const slide2 = document.getElementById('splash-slide-2');
    const authForm = document.getElementById('auth-form');
    const skipAuthBtn = document.getElementById('skip-auth');
    const startAuthBtn = document.getElementById('start-auth');
    const backToSlide1Btn = document.getElementById('back-to-slide-1');
    const googleSigninBtn = document.getElementById('google-signin');

    // Skip authentication
    if (skipAuthBtn) {
        skipAuthBtn.addEventListener('click', () => {
            userData = { name: 'مهمان', email: 'guest@tebnegar.com', phone: '000-000-0000' };
            localStorage.setItem('tebnegar_user_data', JSON.stringify(userData));
            localStorage.setItem('tebnegar_authenticated', 'true');
            hideSplashScreen();
        });
    }

    // Start authentication
    if (startAuthBtn) {
        startAuthBtn.addEventListener('click', () => {
            slide1.classList.add('hidden');
            slide2.classList.remove('hidden');
        });
    }

    // Back to slide 1
    if (backToSlide1Btn) {
        backToSlide1Btn.addEventListener('click', () => {
            slide2.classList.add('hidden');
            slide1.classList.remove('hidden');
        });
    }

    // Google sign-in
    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', () => {
            // Simulate Google sign-in
            userData = {
                name: 'کاربر گوگل',
                email: 'google@tebnegar.com',
                phone: '111-111-1111'
            };
            localStorage.setItem('tebnegar_user_data', JSON.stringify(userData));
            localStorage.setItem('tebnegar_authenticated', 'true');
            hideSplashScreen();
        });
    }

    // Handle authentication form submission
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(authForm);
            userData = {
                name: document.getElementById('auth-name').value,
                email: document.getElementById('auth-email').value,
                phone: document.getElementById('auth-phone').value
            };
            localStorage.setItem('tebnegar_user_data', JSON.stringify(userData));
            localStorage.setItem('tebnegar_authenticated', 'true');
            hideSplashScreen();
        });
    }

    function hideSplashScreen() {
        splashScreen.style.opacity = '0';
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            app.classList.remove('hidden');
            updateUserInterface();
        }, 500);
    }

    function updateUserInterface() {
        // Update profile information
        if (userData.name) {
            const profileName = document.getElementById('profile-name');
            const profileFirstname = document.getElementById('profile-firstname');
            const profileLastname = document.getElementById('profile-lastname');
            const profileEmail = document.getElementById('profile-email');
            const profilePhone = document.getElementById('profile-phone');

            if (profileName) profileName.textContent = userData.name;
            if (profileFirstname) profileFirstname.value = userData.name.split(' ')[0] || userData.name;
            if (profileLastname) profileLastname.value = userData.name.split(' ').slice(1).join(' ') || '';
            if (profileEmail) profileEmail.value = userData.email;
            if (profilePhone) profilePhone.value = userData.phone;
        }

        // Update hero section name
        const heroName = document.querySelector('#dashboard-header h2');
        if (heroName && userData.name) {
            heroName.innerHTML = `سلام ${userData.name} 👋`;
        }
    }

    // ===== BUG REPORT MODAL =====
    const reportBugBtn = document.getElementById('report-bug-btn');
    const bugReportModal = document.getElementById('bug-report-modal');
    const closeBugModal = document.getElementById('close-bug-modal');
    const cancelBugReport = document.getElementById('cancel-bug-report');
    const bugReportForm = document.getElementById('bug-report-form');

    if (reportBugBtn) {
        reportBugBtn.addEventListener('click', () => {
            bugReportModal.classList.remove('hidden');
        });
    }

    if (closeBugModal) {
        closeBugModal.addEventListener('click', () => {
            bugReportModal.classList.add('hidden');
        });
    }

    if (cancelBugReport) {
        cancelBugReport.addEventListener('click', () => {
            bugReportModal.classList.add('hidden');
        });
    }

    if (bugReportForm) {
        bugReportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(bugReportForm);
            const bugData = {
                title: formData.get('bug-title') || document.getElementById('bug-title').value,
                description: formData.get('bug-description') || document.getElementById('bug-description').value,
                priority: formData.get('bug-priority') || document.getElementById('bug-priority').value
            };

            // Here you would send the bug report to your backend
            console.log('Bug report submitted:', bugData);
            alert('گزارش خطا با موفقیت ارسال شد. متشکریم!');
            bugReportModal.classList.add('hidden');
            bugReportForm.reset();
        });
    }

    // ===== PROFILE TAB FUNCTIONALITY =====
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // ===== MOBILE NAVIGATION IMPROVEMENTS =====
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const bottomNav = document.getElementById('bottom-nav');

    if (mobileMenuToggle && bottomNav) {
        mobileMenuToggle.addEventListener('click', () => {
            // Hide bottom navigation when mobile menu is open
            bottomNav.style.transform = 'translateY(100%)';
            bottomNav.style.transition = 'transform 0.3s ease-in-out';
        });

        // Show bottom navigation when mobile menu is closed
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#mobile-menu-toggle') && !e.target.closest('#sidebar')) {
                bottomNav.style.transform = 'translateY(0)';
            }
        });
    }

    // Sidebar toggle functionality
    if (sidebarToggle && sidebar && sidebarOverlay) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('translate-x-full');
            sidebarOverlay.classList.toggle('opacity-0');
            sidebarOverlay.classList.toggle('pointer-events-none');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('translate-x-full');
            sidebarOverlay.classList.add('opacity-0');
            sidebarOverlay.classList.add('pointer-events-none');
        });
    }
});
