document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // --- 1. STATE MANAGEMENT (CUSTOM REACTIVE STORE) ---
    /**
     * Creates a simple reactive store.
     * @param {object} initialState - The initial state of the application.
     * @returns {object} An object with the state and methods to interact with it.
     */
    const createStore = (initialState) => {
        const subscribers = [];
        const state = new Proxy(initialState, {
            set(target, property, value) {
                target[property] = value;
                subscribers.forEach((callback) => callback()); // Notify all subscribers of a change
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

    // --- 2. CONFIGURATION ---
    const CONFIG = {
        apiBaseUrl: "http://127.0.0.1:8000/api/v1",
        localStorageKey: "tebnegar_session_id_v2",
    };

    // --- 3. DOM ELEMENT CACHING ---
    const ELEMENTS = {
        loadingOverlay: document.getElementById("loading-overlay"),
        appContainer: document.getElementById("app-container"),
        chatWindow: document.getElementById("chat-window"),
        chatForm: document.getElementById("chat-form"),
        messageInput: document.getElementById("message-input"),
        sendButton: document.getElementById("send-button"),
        newChatBtn: document.getElementById("new-chat-btn"),
        historyContainer: document.getElementById("history-container"),
        feedbackWidget: document.getElementById("feedback-widget"),
        feedbackForm: document.getElementById("feedback-form"),
    };

    // --- 4. NOTIFICATION SERVICE ---
    const NotificationService = {
        showError(message) {
            Toastify({
                text: message,
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                backgroundColor: "#EF4444",
            }).showToast();
        },
        showSuccess(message) {
            Toastify({
                text: message,
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#22C55E",
            }).showToast();
        },
        async showConfirm(title, text) {
            return Swal.fire({
                title,
                text,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                cancelButtonText: "No, cancel",
                background: "#21262D",
                color: "#e5e7eb",
                confirmButtonColor: "#2F81F7",
                cancelButtonColor: "#4b5563",
            });
        },
    };

    // --- 5. API SERVICE (AXIOS) ---
    const ApiService = axios.create({
        baseURL: CONFIG.apiBaseUrl,
        headers: { "Content-Type": "application/json" },
    });

    ApiService.interceptors.request.use(
        (config) => {
            store.state.isLoading = true;
            return config;
        },
        (error) => {
            store.state.isLoading = false;
            NotificationService.showError("A network error occurred.");
            return Promise.reject(error);
        }
    );

    ApiService.interceptors.response.use(
        (response) => {
            store.state.isLoading = false;
            return response;
        },
        (error) => {
            store.state.isLoading = false;
            var message = "An unexpected API error occurred.";
            if (
                error.response &&
                error.response.data &&
                error.response.data.detail
            ) {
                message = error.response.data.detail;
            }
            NotificationService.showError(message);
            return Promise.reject(error);
        }
    );

    // --- 6. CORE APPLICATION LOGIC ---
    const App = {
        init() {
            store.subscribe(() => {
                const { isLoading } = store.state;
                const hasText = ELEMENTS.messageInput.value.trim() !== "";
                ELEMENTS.sendButton.disabled = isLoading || !hasText;
                ELEMENTS.newChatBtn.disabled = isLoading;
                ELEMENTS.messageInput.disabled = isLoading;
            });
            this.main();
        },

        async main() {
            store.state.sessionId = localStorage.getItem(
                CONFIG.localStorageKey
            );
            try {
                if (store.state.sessionId) {
                    await this.fetchHistoryAndLoadLatest();
                } else {
                    await this.createNewSession();
                }
                this.setupEventListeners();
                autosize(ELEMENTS.messageInput);
            } catch (error) {
                console.error("Critical initialization error:", error);
            } finally {
                this.hideLoadingOverlay();
            }
        },

        setupEventListeners() {
            ELEMENTS.newChatBtn.type = "button";
            ELEMENTS.feedbackForm
                .querySelectorAll("button")
                .forEach((btn) => (btn.type = "button"));

            ELEMENTS.chatForm.addEventListener(
                "submit",
                this.handleFormSubmit.bind(this)
            );
            ELEMENTS.messageInput.addEventListener("input", () => {
                store.state.isLoading = store.state.isLoading;
            });
            ELEMENTS.messageInput.addEventListener(
                "keydown",
                this.handleEnterKey.bind(this)
            );
            ELEMENTS.newChatBtn.addEventListener("click", () =>
                this.handleNewChatClick(true)
            );
            ELEMENTS.feedbackForm.addEventListener(
                "click",
                this.handleFeedbackClick.bind(this)
            );
            ELEMENTS.historyContainer.addEventListener(
                "click",
                this.handleHistoryContainerClick.bind(this)
            );
            window.addEventListener(
                "beforeunload",
                this.handleBeforeUnload.bind(this)
            );
        },

        async createNewSession() {
            const marketingData = this.getMarketingData();
            const response = await ApiService.post("/sessions/", marketingData);
            const { session_id, conversation_id } = response.data;
            store.state.sessionId = session_id;
            store.state.conversationId = conversation_id;
            localStorage.setItem(CONFIG.localStorageKey, session_id);
            await this.renderConversation(conversation_id);
        },

        async fetchHistoryAndLoadLatest() {
            try {
                const response = await ApiService.get(
                    "/conversations/" + store.state.sessionId
                );
                const history = response.data;
                if (history.length > 0) {
                    await this.renderConversation(history[0].id);
                } else {
                    await this.handleNewChatClick(false);
                }
            } catch (error) {
                if (
                    error.response &&
                    (error.response.status === 404 ||
                        error.response.status === 422)
                ) {
                    console.warn(
                        "Session expired or invalid, creating a new one."
                    );
                    localStorage.removeItem(CONFIG.localStorageKey);
                    await this.createNewSession();
                } else {
                    throw error;
                }
            }
        },

        async handleFormSubmit(e) {
            e.preventDefault();
            const userInput = ELEMENTS.messageInput.value.trim();
            if (!userInput || store.state.isLoading) return;

            this.hideFeedbackWidget();
            this.renderMessage("user", userInput);
            const messageToSend = userInput;
            this.resetInput();
            this.showTypingIndicator();

            try {
                const response = await ApiService.post(
                    "/messages/" + store.state.conversationId,
                    { content: messageToSend }
                );
                const { id, content } = response.data;
                store.state.lastAiMessageId = id;
                this.renderMessage("ai", content);
                this.showFeedbackWidget();
                await this.updateHistorySidebar();
            } catch (error) {
                // Error is handled by interceptor
            } finally {
                this.hideTypingIndicator();
            }
        },

        async handleNewChatClick(render = true) {
            if (store.state.isLoading) return;
            try {
                const response = await ApiService.post("/conversations/", {
                    session_id: store.state.sessionId,
                });
                const newConversation = response.data;
                if (render) {
                    await this.renderConversation(newConversation.id);
                } else {
                    store.state.conversationId = newConversation.id;
                    ELEMENTS.chatWindow.innerHTML = "";
                    this.renderWelcomeMessage();
                    await this.updateHistorySidebar();
                }
            } catch (error) {
                // Error is handled by interceptor
            }
        },

        async handleFeedbackClick(e) {
            const button = e.target.closest("button");
            const { lastAiMessageId } = store.state;
            if (!button || !lastAiMessageId || !button.dataset.feedback) return;

            const feedbackType = button.dataset.feedback;
            this.hideFeedbackWidget(); // Hide widget immediately for a responsive feel

            if (feedbackType === "like") {
                await this.submitFeedback({ feedback_type: feedbackType });
            } else if (feedbackType === "dislike") {
                const { value: comment, isConfirmed } = await Swal.fire({
                    title: "Provide Additional Feedback",
                    input: "textarea",
                    inputPlaceholder:
                        "What was wrong with the response? (Optional)",
                    showCancelButton: true,
                    confirmButtonText: "Submit Feedback",
                    cancelButtonText: "Cancel",
                    background: "#21262D",
                    color: "#e5e7eb",
                    confirmButtonColor: "#2F81F7",
                    cancelButtonColor: "#4b5563",
                    customClass: {
                        popup: "swal2-popup",
                        title: "swal2-title",
                        confirmButton: "swal2-confirm",
                        cancelButton: "swal2-cancel",
                    },
                });

                if (isConfirmed) {
                    await this.submitFeedback({
                        feedback_type: feedbackType,
                        comment: comment || null,
                    });
                }
            }
        },

        async submitFeedback(payload) {
            try {
                await ApiService.post(
                    "/response-feedback/" + store.state.lastAiMessageId,
                    payload
                );
                NotificationService.showSuccess("Thank you for your feedback!");
            } catch (error) {
                // Error is handled by the global interceptor.
                // Could optionally re-show the feedback widget here if submission fails.
                console.error("Feedback submission failed:", error);
            }
        },

        handleHistoryContainerClick(e) {
            const conversationButton = e.target.closest(
                "button:not(.delete-btn):not(.edit-btn)"
            );
            const deleteButton = e.target.closest(".delete-btn");
            const editButton = e.target.closest(".edit-btn");
            const { conversationId, isLoading } = store.state;

            if (deleteButton) {
                this.handleDeleteConversationClick(
                    deleteButton.dataset.conversationId
                );
            } else if (editButton) {
                this.handleEditConversationClick(editButton);
            } else if (
                conversationButton &&
                !isLoading &&
                conversationButton.dataset.conversationId !== conversationId
            ) {
                this.renderConversation(
                    conversationButton.dataset.conversationId
                );
            }
        },

        async handleDeleteConversationClick(conversationId) {
            const result = await NotificationService.showConfirm(
                "Are you sure?",
                "This will permanently delete the conversation."
            );
            if (result.isConfirmed) {
                try {
                    await ApiService.delete("/conversations/" + conversationId);
                    NotificationService.showSuccess("Conversation deleted.");
                    await this.fetchHistoryAndLoadLatest();
                } catch (error) {
                    // Error handled by interceptor
                }
            }
        },

        handleEditConversationClick(editButton) {
            const container = editButton.closest(".history-item-container");
            const titleSpan = container.querySelector(".conversation-title");
            const conversationId = editButton.dataset.conversationId;
            const originalTitle = titleSpan.textContent;

            const input = document.createElement("input");
            input.type = "text";
            input.className = "title-edit-input";
            input.value = originalTitle;

            titleSpan.style.display = "none";
            container.querySelector(".history-item-button").prepend(input);
            input.focus();
            input.select();

            const saveChanges = async () => {
                const newTitle = input.value.trim();
                if (newTitle && newTitle !== originalTitle) {
                    try {
                        await ApiService.patch(
                            `/conversations/${conversationId}`,
                            { title: newTitle }
                        );
                        titleSpan.textContent = newTitle;
                        NotificationService.showSuccess("Title updated.");
                    } catch (error) {
                        titleSpan.textContent = originalTitle;
                    }
                }
                cleanup();
            };

            const cleanup = () => {
                input.remove();
                titleSpan.style.display = "";
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

        handleBeforeUnload() {
            const { sessionId } = store.state;
            if (!sessionId || !navigator.sendBeacon) return;
            const url = CONFIG.apiBaseUrl + "/sessions/" + sessionId + "/end";
            navigator.sendBeacon(url, new Blob());
        },

        handleEnterKey(e) {
            if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !ELEMENTS.sendButton.disabled
            ) {
                e.preventDefault();
                ELEMENTS.chatForm.requestSubmit();
            }
        },

        async renderConversation(conversationId) {
            store.state.conversationId = conversationId;
            ELEMENTS.chatWindow.innerHTML = "";
            this.hideFeedbackWidget();
            try {
                const response = await ApiService.get(
                    "/conversations/" + conversationId + "/messages"
                );
                const { messages } = response.data;
                if (messages.length > 0) {
                    messages.forEach((msg) =>
                        this.renderMessage(
                            msg.sender_type.toLowerCase(),
                            msg.content
                        )
                    );
                } else {
                    this.renderWelcomeMessage();
                }
                await this.updateHistorySidebar();
                ELEMENTS.messageInput.focus();
            } catch (error) {
                // Error handled by interceptor
            }
        },

        async updateHistorySidebar() {
            try {
                const response = await ApiService.get(
                    "/conversations/" + store.state.sessionId
                );
                ELEMENTS.historyContainer.innerHTML = "";
                const { conversationId } = store.state;
                response.data.forEach((conv) => {
                    const container = document.createElement("div");
                    container.className = "history-item-container";
                    const item = document.createElement("button");
                    item.type = "button";
                    item.className =
                        "history-item-button w-full text-left p-2 rounded-lg text-sm truncate transition-colors duration-150 " +
                        (conv.id === conversationId
                            ? "bg-ai-bubble font-semibold"
                            : "hover:bg-ai-bubble");
                    item.dataset.conversationId = conv.id;
                    const titleSpan = document.createElement("span");
                    titleSpan.className = "conversation-title";
                    titleSpan.innerHTML = DOMPurify.sanitize(conv.title);
                    item.appendChild(titleSpan);
                    const editBtn = document.createElement("button");
                    editBtn.type = "button";
                    editBtn.className = "edit-btn";
                    editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
                    editBtn.dataset.conversationId = conv.id;
                    editBtn.ariaLabel =
                        "Edit conversation title: " + conv.title;
                    const deleteBtn = document.createElement("button");
                    deleteBtn.type = "button";
                    deleteBtn.className = "delete-btn";
                    deleteBtn.innerHTML =
                        '<i class="fa-solid fa-trash-can"></i>';
                    deleteBtn.dataset.conversationId = conv.id;
                    deleteBtn.ariaLabel = "Delete conversation: " + conv.title;
                    container.append(item, editBtn, deleteBtn);
                    ELEMENTS.historyContainer.appendChild(container);
                });
            } catch (error) {
                console.error("Could not refresh history sidebar:", error);
            }
        },

        renderMessage(role, content, isHtml = false) {
            const wrapper = document.createElement("div");
            wrapper.className =
                "message-wrapper " +
                (role === "user" ? "justify-end" : "justify-start");
            const bubble = document.createElement("div");
            bubble.className =
                "message-bubble " +
                (role === "user" ? "user-bubble" : "ai-bubble");
            bubble.innerHTML = isHtml
                ? DOMPurify.sanitize(content)
                : DOMPurify.sanitize(marked.parse(content));
            wrapper.appendChild(bubble);
            ELEMENTS.chatWindow.appendChild(wrapper);
            this.scrollToBottom();
        },

        renderWelcomeMessage() {
            const welcomeHtml =
                '<p class="font-bold text-lg mb-2">Welcome to TebNegar!</p><p>I am an AI-powered preliminary assessment tool. Please describe your symptoms in detail.</p><p class="text-xs text-gray-400 mt-3 border-t border-border-dark pt-2"><b>Disclaimer:</b> This is not a medical diagnosis. Consult a licensed physician for any medical advice.</p>';
            this.renderMessage("ai", welcomeHtml, true);
        },

        resetInput() {
            ELEMENTS.messageInput.value = "";
            autosize.update(ELEMENTS.messageInput);
            store.state.isLoading = store.state.isLoading;
        },

        getMarketingData: () => ({
            landing_page_url: window.location.href,
            referrer_url: document.referrer || null,
            ...Object.fromEntries(new URLSearchParams(window.location.search)),
        }),

        scrollToBottom: () =>
            ELEMENTS.chatWindow.scrollTo({
                top: ELEMENTS.chatWindow.scrollHeight,
                behavior: "smooth",
            }),

        showTypingIndicator() {
            if (document.getElementById("typing-indicator")) return;
            const html =
                '<div id="typing-indicator" class="message-wrapper justify-start"><div class="message-bubble ai-bubble flex items-center space-x-2"><div class="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div><div class="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div><div class="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div></div></div>';
            ELEMENTS.chatWindow.insertAdjacentHTML("beforeend", html);
            this.scrollToBottom();
        },

        hideTypingIndicator() {
            const indicator = document.getElementById("typing-indicator");
            if (indicator) {
                indicator.remove();
            }
        },

        showFeedbackWidget: () =>
            ELEMENTS.feedbackWidget.classList.remove("hidden"),
        hideFeedbackWidget: () =>
            ELEMENTS.feedbackWidget.classList.add("hidden"),

        hideLoadingOverlay: () => {
            if (ELEMENTS.loadingOverlay) {
                ELEMENTS.loadingOverlay.style.opacity = "0";
                if (ELEMENTS.appContainer) {
                    ELEMENTS.appContainer.style.opacity = "1";
                }
                setTimeout(() => {
                    ELEMENTS.loadingOverlay.style.display = "none";
                }, 500);
            }
        },
    };

    // --- APPLICATION START ---
    App.init();
});
