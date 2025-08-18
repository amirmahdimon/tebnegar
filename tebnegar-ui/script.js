/**
 * TebNegar Frontend Application (Production - v1.2)
 *
 * CRITICAL FIX: This version corrects a major rendering bug where the HTML welcome
 * message was being incorrectly processed by the Markdown parser, causing raw HTML
 * tags to be displayed to the user.
 *
 * The `renderMessage` function has been updated to accept an `isHtml` option,
 * allowing it to correctly render pre-formatted, sanitized HTML without
 * passing it through the Markdown parser.
 */
((d, w) => {
    "use strict";

    // --- CONFIGURATION ---
    const config = {
        apiBaseUrl: "http://127.0.0.1:8000/api/v1",
        localStorageKey: "tebnegar_conversations_v1",
    };

    // --- DOM ELEMENT CACHING ---
    const chatWindow = d.getElementById("chat-window");
    const chatForm = d.getElementById("chat-form");
    const messageInput = d.getElementById("message-input");
    const sendButton = d.getElementById("send-button");
    const newChatBtn = d.getElementById("new-chat-btn");
    const historyContainer = d.getElementById('history-container');
    const feedbackWidget = d.getElementById("feedback-widget");
    const feedbackForm = d.getElementById("feedback-form");

    // --- STATE MANAGEMENT ---
    let currentSessionId = null;
    let conversations = {};

    /**
     * Main application initializer.
     */
    const init = () => {
        loadConversationsFromStorage();
        const sessionKeys = Object.keys(conversations);
        if (sessionKeys.length > 0) {
            const mostRecentSessionId = sessionKeys.sort((a, b) =>
                new Date(conversations[b].createdAt) - new Date(conversations[a].createdAt)
            )[0];
            renderConversation(mostRecentSessionId);
        } else {
            startNewChat();
        }
        setupEventListeners();
        updateSendButtonState();
    };

    /**
     * Centralized setup for all event listeners.
     */
    const setupEventListeners = () => {
        chatForm.addEventListener("submit", handleFormSubmit);
        messageInput.addEventListener("input", () => {
            autoGrowTextarea(messageInput);
            updateSendButtonState();
        });
        messageInput.addEventListener("keydown", handleEnterKey);
        newChatBtn.addEventListener("click", startNewChat);
        feedbackForm.addEventListener('click', handleFeedbackClick);
    };

    /**
     * Handles the primary chat submission logic.
     */
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const userInput = messageInput.value.trim();
        if (!userInput) return;

        addMessageToConversation("user", userInput);
        // User input is plain text, so it's safe to let it be parsed as Markdown.
        renderMessage("user", userInput);
        resetInput();

        showTypingIndicator();

        try {
            const response = await fetch(`${config.apiBaseUrl}/symptom-check/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    session_id: currentSessionId,
                    symptoms: userInput
                }),
            });

            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);

            const data = await response.json();
            hideTypingIndicator();
            addMessageToConversation("ai", data.assessment);
            // AI response is expected to be Markdown, so we let it parse.
            renderMessage("ai", data.assessment);
            showFeedbackWidget();
        } catch (error) {
            console.error("Failed to get AI response:", error);
            hideTypingIndicator();
            const errorMessage = "I'm sorry, but I'm having trouble connecting to my services right now. Please try again in a moment.";
            addMessageToConversation("ai", errorMessage);
            // Error message is plain text, let it parse.
            renderMessage("ai", errorMessage, {
                isError: true
            });
        } finally {
            updateHistorySidebar();
            saveConversationsToStorage();
        }
    };

    // --- UI RENDERING FUNCTIONS ---

    /**
     * Renders a message bubble in the chat window.
     * @param {'user' | 'ai'} role - The sender's role.
     * @param {string} content - The message content.
     * @param {object} [options={}] - Rendering options.
     * @param {boolean} [options.isError=false] - If true, applies error styling.
     * @param {boolean} [options.isHtml=false] - If true, treats content as HTML; otherwise, parses as Markdown.
     */
    const renderMessage = (role, content, options = {}) => {
        const {
            isError = false, isHtml = false
        } = options;

        const wrapper = d.createElement("div");
        wrapper.className = `message-wrapper ${role === "user" ? "justify-end" : "justify-start"}`;

        const bubble = d.createElement("div");
        bubble.className = `message-bubble ${role === "user" ? "user-bubble" : "ai-bubble"}`;
        if (isError) bubble.classList.add('text-red-400');

        // *** THE BUG FIX IS HERE ***
        // We now check the `isHtml` flag. If true, we only sanitize the content.
        // If false (default), we parse it as Markdown first, then sanitize.
        const finalHtml = isHtml ?
            DOMPurify.sanitize(content) :
            DOMPurify.sanitize(marked.parse(content));

        bubble.innerHTML = finalHtml;

        wrapper.appendChild(bubble);
        chatWindow.appendChild(wrapper);
        scrollToBottom();
    };

    const renderWelcomeMessage = () => {
        const welcomeHtml = `
            <p class="font-bold text-lg mb-2">Welcome to TebNegar!</p>
            <p>I am an AI-powered preliminary assessment tool. Please describe your symptoms in detail.</p>
            <p class="text-xs text-gray-400 mt-3 border-t border-border-dark pt-2">
                <b>Disclaimer:</b> This is not a medical diagnosis. Consult a licensed physician for any medical advice.
            </p>
        `;
        // *** THE BUG FIX IS HERE ***
        // We now pass the `isHtml: true` option to prevent Markdown parsing.
        renderMessage("ai", welcomeHtml, {
            isHtml: true
        });
    };

    const showTypingIndicator = () => {
        const indicatorId = 'typing-indicator';
        if (d.getElementById(indicatorId)) return;

        const indicatorHtml = `
            <div id="${indicatorId}" class="message-wrapper justify-start">
                <div class="message-bubble ai-bubble flex items-center space-x-2">
                    <div class="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div class="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div class="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
            </div>`;
        chatWindow.insertAdjacentHTML("beforeend", indicatorHtml);
        scrollToBottom();
    };

    const hideTypingIndicator = () => {
        const indicator = d.getElementById("typing-indicator");
        if (indicator) indicator.remove();
    };

    // --- STATE & HISTORY MANAGEMENT ---

    const startNewChat = () => {
        currentSessionId = crypto.randomUUID();
        conversations[currentSessionId] = {
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString()
        };
        renderConversation(currentSessionId);
    };

    const renderConversation = (sessionId) => {
        currentSessionId = sessionId;
        chatWindow.innerHTML = '';
        hideFeedbackWidget();

        const conversation = conversations[sessionId];
        if (conversation && conversation.messages.length > 0) {
            conversation.messages.forEach(msg => {
                // Heuristic: Assume user messages are plain text/Markdown, AI messages are Markdown
                const isWelcome = msg.content.includes("Welcome to TebNegar!");
                renderMessage(msg.role, msg.content, {
                    isHtml: isWelcome
                });
            });
        } else {
            renderWelcomeMessage();
        }
        updateHistorySidebar();
        messageInput.focus();
    };

    const addMessageToConversation = (role, content) => {
        const conversation = conversations[currentSessionId];
        if (!conversation) return;

        conversation.messages.push({
            role,
            content
        });

        if (role === 'user' && conversation.messages.filter(m => m.role === 'user').length === 1) {
            conversation.title = content.substring(0, 35) + (content.length > 35 ? "..." : "");
        }
    };

    const updateHistorySidebar = () => {
        historyContainer.innerHTML = '';
        const sortedSessions = Object.keys(conversations).sort((a, b) =>
            new Date(conversations[b].createdAt) - new Date(conversations[a].createdAt)
        );

        sortedSessions.forEach(sessionId => {
            const conversation = conversations[sessionId];
            const item = d.createElement('button');
            item.className = `w-full text-left p-2 rounded-lg text-sm truncate transition-colors duration-150 ${
                sessionId === currentSessionId ? 'bg-ai-bubble font-semibold' : 'hover:bg-ai-bubble'
            }`;
            item.innerHTML = DOMPurify.sanitize(conversation.title);
            item.dataset.sessionId = sessionId;
            item.onclick = () => renderConversation(sessionId);
            historyContainer.appendChild(item);
        });
    };

    const saveConversationsToStorage = () => {
        try {
            w.localStorage.setItem(config.localStorageKey, JSON.stringify(conversations));
        } catch (e) {
            console.error("Could not save conversations to localStorage:", e);
        }
    };

    const loadConversationsFromStorage = () => {
        try {
            const data = w.localStorage.getItem(config.localStorageKey);
            if (data) {
                conversations = JSON.parse(data);
            }
        } catch (e) {
            console.error("Could not load conversations from localStorage:", e);
            conversations = {};
        }
    };

    // --- UTILITY & HELPER FUNCTIONS ---

    const resetInput = () => {
        messageInput.value = "";
        autoGrowTextarea(messageInput);
        updateSendButtonState();
    };

    const updateSendButtonState = () => {
        sendButton.disabled = messageInput.value.trim() === "";
    };

    const handleEnterKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey && !sendButton.disabled) {
            e.preventDefault();
            handleFormSubmit(e);
        }
    };

    const autoGrowTextarea = (element) => {
        element.style.height = "auto";
        element.style.height = `${element.scrollHeight}px`;
    };

    const scrollToBottom = () => {
        chatWindow.scrollTo({
            top: chatWindow.scrollHeight,
            behavior: "smooth"
        });
    };

    // --- FEEDBACK WIDGET ---
    const showFeedbackWidget = () => {
        feedbackWidget.classList.remove('hidden');
        feedbackForm.querySelectorAll('.feedback-btn').forEach(btn => btn.classList.remove('selected'));
    };
    const hideFeedbackWidget = () => feedbackWidget.classList.add('hidden');

    const handleFeedbackClick = (e) => {
        const button = e.target.closest('.feedback-btn');
        if (!button) return;

        feedbackForm.querySelectorAll('.feedback-btn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');

        const rating = button.dataset.rating;
        console.log(`Feedback submitted: ${rating} for session ${currentSessionId}`);

        setTimeout(() => hideFeedbackWidget(), 500);
    };

    // --- APPLICATION START ---
    init();

})(document, window);