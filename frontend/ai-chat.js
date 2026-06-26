/* ============================================================
   HarvestLink AI Chat Widget + Voice Listing Creator
   Vanilla JS — no framework required
   ============================================================ */

(function () {
    'use strict';

    const AI_CHAT_ENDPOINT    = `${API_BASE}/ai/chat`;
    const AI_VOICE_ENDPOINT   = `${API_BASE}/ai/voice-listing`;

    // ── Conversation history ──────────────────────────────────────────────────
    let chatHistory = [];
    let isTyping    = false;

    // ── Inject HTML ───────────────────────────────────────────────────────────
    function injectChatWidget() {
        const html = `
        <!-- HarvestLink AI Chat Button -->
        <button id="ai-chat-fab" class="ai-chat-fab" title="HarvestLink AI Assistant" aria-label="Open AI Chat">
            <span class="ai-fab-icon">🌾</span>
            <span class="ai-fab-pulse"></span>
        </button>

        <!-- AI Chat Panel -->
        <div id="ai-chat-panel" class="ai-chat-panel" aria-hidden="true">
            <!-- Header -->
            <div class="ai-chat-header">
                <div class="ai-chat-header-info">
                    <div class="ai-chat-avatar">🤖</div>
                    <div>
                        <div class="ai-chat-title">HarvestLink AI</div>
                        <div class="ai-chat-subtitle">Domain-specific assistant</div>
                    </div>
                </div>
                <div class="ai-chat-header-actions">
                    <button class="ai-icon-btn" id="ai-clear-btn" title="Clear chat">🗑️</button>
                    <button class="ai-icon-btn" id="ai-close-btn" title="Close">✕</button>
                </div>
            </div>

            <!-- Messages -->
            <div class="ai-chat-messages" id="ai-chat-messages">
                <div class="ai-msg ai-msg--bot">
                    <div class="ai-msg-bubble">
                        👋 Hi! I'm <strong>HarvestLink AI</strong>. I can help you:
                        <ul style="margin:8px 0 0 16px;padding:0;font-size:0.82rem;">
                            <li>Understand how FarmShare works</li>
                            <li>Answer food storage & freshness questions</li>
                            <li>Explain donation rules</li>
                            <li>Guide farmers on best listing options</li>
                            <li>Help NGOs request &amp; track produce</li>
                        </ul>
                    </div>
                </div>
                <!-- Quick suggestions -->
                <div class="ai-suggestions" id="ai-suggestions">
                    <button class="ai-suggestion-chip" data-q="Can I donate slightly ripe bananas?">🍌 Ripe bananas?</button>
                    <button class="ai-suggestion-chip" data-q="How long can tomatoes be stored?">🍅 Tomato storage</button>
                    <button class="ai-suggestion-chip" data-q="How does FarmShare work for NGOs?">🏢 NGO guide</button>
                    <button class="ai-suggestion-chip" data-q="What produce cannot be donated?">🚫 Donation rules</button>
                </div>
            </div>

            <!-- Voice Listing Banner (Farmer only) -->
            <div class="ai-voice-banner" id="ai-voice-banner" style="display:none;">
                <div class="ai-voice-banner-text">
                    <span>🎤</span>
                    <span>Voice Listing — say what you have</span>
                </div>
                <button class="ai-voice-btn" id="ai-voice-start-btn" title="Start voice input">
                    <span id="ai-voice-icon">🎙️</span>
                    <span id="ai-voice-label">Speak</span>
                </button>
            </div>

            <!-- Input bar -->
            <div class="ai-chat-input-bar">
                <textarea
                    id="ai-chat-input"
                    class="ai-chat-input"
                    placeholder="Ask HarvestLink AI…"
                    rows="1"
                    maxlength="500"
                ></textarea>
                <button class="ai-send-btn" id="ai-send-btn" title="Send">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="18" height="18">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>
        </div>`;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        while (wrapper.firstChild) {
            document.body.appendChild(wrapper.firstChild);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function scrollToBottom() {
        const msgs = document.getElementById('ai-chat-messages');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderMarkdown(text) {
        // Minimal markdown: bold, code blocks, inline code, newlines
        return text
            .replace(/```json\n?([\s\S]*?)```/g, (_, code) => {
                // Don't render JSON autofill blocks as text
                return `<code class="ai-code-block">${escapeHtml(code.trim())}</code>`;
            })
            .replace(/```([\s\S]*?)```/g, (_, code) => `<code class="ai-code-block">${escapeHtml(code.trim())}</code>`)
            .replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`)
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    function appendMessage(role, text) {
        const msgs = document.getElementById('ai-chat-messages');
        if (!msgs) return;

        // Hide suggestions after first user message
        const suggestions = document.getElementById('ai-suggestions');
        if (suggestions && role === 'user') suggestions.style.display = 'none';

        const div = document.createElement('div');
        div.className = `ai-msg ai-msg--${role === 'user' ? 'user' : 'bot'}`;
        div.innerHTML = `<div class="ai-msg-bubble">${role === 'user' ? escapeHtml(text) : renderMarkdown(text)}</div>`;
        msgs.appendChild(div);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const msgs = document.getElementById('ai-chat-messages');
        if (!msgs || isTyping) return;
        isTyping = true;
        const div = document.createElement('div');
        div.className = 'ai-msg ai-msg--bot ai-typing-indicator';
        div.id = 'ai-typing';
        div.innerHTML = `<div class="ai-msg-bubble ai-typing-dots"><span></span><span></span><span></span></div>`;
        msgs.appendChild(div);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const el = document.getElementById('ai-typing');
        if (el) el.remove();
        isTyping = false;
    }

    // ── Try to parse autofill action from AI response ─────────────────────────
    function tryAutofill(replyText) {
        const match = replyText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (!match) return false;
        try {
            const data = JSON.parse(match[1]);
            if (data.action === 'autofill') {
                // Only autofill if farmer view is visible
                const farmerView = document.getElementById('farmer-view');
                if (!farmerView || !farmerView.classList.contains('active')) return false;

                const nameEl     = document.getElementById('produce-name');
                const qtyEl      = document.getElementById('produce-quantity');
                const dateEl     = document.getElementById('produce-date');

                if (nameEl && data.produce)       nameEl.value = data.produce;
                if (qtyEl  && data.quantity)      qtyEl.value  = data.quantity;
                if (dateEl && data.harvest_date)  dateEl.value = data.harvest_date;

                // Flash the form to draw attention
                const form = document.getElementById('upload-produce-form');
                if (form) {
                    form.style.transition = 'box-shadow 0.3s';
                    form.style.boxShadow  = '0 0 0 3px rgba(5,150,105,0.45)';
                    setTimeout(() => { form.style.boxShadow = ''; }, 1500);
                }

                showToast('✅ Form auto-filled from your voice input!', 'success');
                return true;
            }
        } catch (_) {}
        return false;
    }

    // ── Send message ──────────────────────────────────────────────────────────
    async function sendMessage(text) {
        if (!text.trim() || !token) return;

        const userText = text.trim();
        chatHistory.push({ role: 'user', content: userText });
        appendMessage('user', userText);

        const input = document.getElementById('ai-chat-input');
        if (input) { input.value = ''; input.style.height = 'auto'; }

        showTypingIndicator();

        try {
            const res = await fetch(AI_CHAT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ messages: chatHistory }),
            });

            hideTypingIndicator();

            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: res.statusText }));
                appendMessage('assistant', `⚠️ Error: ${err.detail || 'Something went wrong.'}`);
                return;
            }

            const data  = await res.json();
            const reply = data.reply || '';
            chatHistory.push({ role: 'assistant', content: reply });
            appendMessage('assistant', reply);
            tryAutofill(reply);

        } catch (err) {
            hideTypingIndicator();
            appendMessage('assistant', `⚠️ Network error: ${err.message}`);
        }
    }

    // ── Voice Listing ─────────────────────────────────────────────────────────
    let speechRecognition = null;
    let isRecording = false;

    function initVoiceListing() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;  // Browser doesn't support it

        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous    = false;
        speechRecognition.interimResults = true;
        speechRecognition.lang          = 'en-IN';

        speechRecognition.onstart = () => {
            isRecording = true;
            const btn   = document.getElementById('ai-voice-start-btn');
            const icon  = document.getElementById('ai-voice-icon');
            const label = document.getElementById('ai-voice-label');
            if (btn)   btn.classList.add('recording');
            if (icon)  icon.textContent  = '⏹️';
            if (label) label.textContent = 'Stop';
        };

        speechRecognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            const input = document.getElementById('ai-chat-input');
            if (input) input.value = transcript;
        };

        speechRecognition.onend = async () => {
            isRecording = false;
            const btn   = document.getElementById('ai-voice-start-btn');
            const icon  = document.getElementById('ai-voice-icon');
            const label = document.getElementById('ai-voice-label');
            if (btn)   btn.classList.remove('recording');
            if (icon)  icon.textContent  = '🎙️';
            if (label) label.textContent = 'Speak';

            const input = document.getElementById('ai-chat-input');
            const spokenText = input ? input.value.trim() : '';
            if (!spokenText || !token) return;

            // Show what was heard
            chatHistory.push({ role: 'user', content: `🎤 "${spokenText}"` });
            appendMessage('user', `🎤 "${spokenText}"`);
            if (input) { input.value = ''; }

            showTypingIndicator();

            try {
                const res = await fetch(AI_VOICE_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type':  'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ text: spokenText }),
                });

                hideTypingIndicator();

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: res.statusText }));
                    appendMessage('assistant', `⚠️ Error: ${err.detail || 'Something went wrong.'}`);
                    return;
                }

                const data  = await res.json();
                const reply = data.reply || '';
                chatHistory.push({ role: 'assistant', content: reply });
                appendMessage('assistant', reply);
                tryAutofill(reply);

            } catch (err) {
                hideTypingIndicator();
                appendMessage('assistant', `⚠️ Network error: ${err.message}`);
            }
        };

        speechRecognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            isRecording = false;
            const btn   = document.getElementById('ai-voice-start-btn');
            const icon  = document.getElementById('ai-voice-icon');
            const label = document.getElementById('ai-voice-label');
            if (btn)   btn.classList.remove('recording');
            if (icon)  icon.textContent  = '🎙️';
            if (label) label.textContent = 'Speak';
            showToast('Voice input failed. Please try again.', 'error');
        };
    }

    // ── Panel open/close ──────────────────────────────────────────────────────
    function openChat() {
        const panel = document.getElementById('ai-chat-panel');
        const fab   = document.getElementById('ai-chat-fab');
        if (panel) { panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); }
        if (fab)   fab.classList.add('active');
        scrollToBottom();

        // Show voice banner only for logged-in Farmers
        const voiceBanner = document.getElementById('ai-voice-banner');
        if (voiceBanner) {
            const isFarmer = currentUser && currentUser.role === 'Farmer';
            const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
            voiceBanner.style.display = (isFarmer && hasSpeech) ? 'flex' : 'none';
        }
    }

    function closeChat() {
        const panel = document.getElementById('ai-chat-panel');
        const fab   = document.getElementById('ai-chat-fab');
        if (panel) { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); }
        if (fab)   fab.classList.remove('active');
    }

    // ── Event binding ─────────────────────────────────────────────────────────
    function bindEvents() {
        document.getElementById('ai-chat-fab').addEventListener('click', () => {
            const panel = document.getElementById('ai-chat-panel');
            if (panel && panel.classList.contains('open')) closeChat();
            else openChat();
        });

        document.getElementById('ai-close-btn').addEventListener('click', closeChat);

        document.getElementById('ai-clear-btn').addEventListener('click', () => {
            chatHistory = [];
            const msgs = document.getElementById('ai-chat-messages');
            if (msgs) {
                // Keep only first welcome message
                const children = Array.from(msgs.children);
                children.slice(1).forEach(c => c.remove());
            }
            // Restore suggestions
            const suggestions = document.getElementById('ai-suggestions');
            if (suggestions) suggestions.style.display = 'flex';
        });

        // Send on button click
        document.getElementById('ai-send-btn').addEventListener('click', () => {
            const input = document.getElementById('ai-chat-input');
            if (input) sendMessage(input.value);
        });

        // Send on Enter (Shift+Enter for newline)
        document.getElementById('ai-chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const input = document.getElementById('ai-chat-input');
                sendMessage(input.value);
            }
        });

        // Auto-resize textarea
        document.getElementById('ai-chat-input').addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Quick suggestion chips
        document.getElementById('ai-suggestions').addEventListener('click', (e) => {
            const chip = e.target.closest('.ai-suggestion-chip');
            if (chip) sendMessage(chip.dataset.q);
        });

        // Voice button
        const voiceBtn = document.getElementById('ai-voice-start-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                if (!speechRecognition) return;
                if (isRecording) {
                    speechRecognition.stop();
                } else {
                    speechRecognition.start();
                    openChat(); // ensure panel is open
                }
            });
        }
    }

    // ── Inline Voice Strip (beside produce form) ──────────────────────────────
    let inlineSpeechRecognition = null;
    let inlineIsRecording = false;

    function initInlineVoiceStrip() {
        const strip = document.getElementById('inline-voice-strip');
        const btn   = document.getElementById('inline-voice-btn');
        if (!strip || !btn) return;

        const isFarmer  = currentUser && currentUser.role === 'Farmer';
        const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        if (!isFarmer || !hasSpeech) return;

        strip.style.display = 'block';

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        inlineSpeechRecognition = new SpeechRecognition();
        inlineSpeechRecognition.continuous     = false;
        inlineSpeechRecognition.interimResults = false;
        inlineSpeechRecognition.lang           = 'en-IN';

        inlineSpeechRecognition.onstart = () => {
            inlineIsRecording = true;
            btn.classList.add('recording');
            document.getElementById('inline-voice-btn-icon').textContent  = '⏹️';
            document.getElementById('inline-voice-btn-label').textContent = 'Stop';
        };

        inlineSpeechRecognition.onend = async () => {
            inlineIsRecording = false;
            btn.classList.remove('recording');
            document.getElementById('inline-voice-btn-icon').textContent  = '🎙️';
            document.getElementById('inline-voice-btn-label').textContent = 'Speak';
        };

        inlineSpeechRecognition.onresult = async (event) => {
            const spokenText = event.results[0][0].transcript.trim();
            if (!spokenText || !token) return;

            document.getElementById('inline-voice-btn-label').textContent = '⏳ Thinking…';
            btn.disabled = true;

            try {
                const res = await fetch(AI_VOICE_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type':  'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ text: spokenText }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: res.statusText }));
                    showToast(`⚠️ AI Error: ${err.detail || 'Something went wrong.'}`, 'error');
                    return;
                }

                const data  = await res.json();
                const reply = data.reply || '';
                tryAutofill(reply);

            } catch (err) {
                showToast(`⚠️ Network error: ${err.message}`, 'error');
            } finally {
                btn.disabled = false;
                document.getElementById('inline-voice-btn-label').textContent = 'Speak';
            }
        };

        inlineSpeechRecognition.onerror = () => {
            inlineIsRecording = false;
            btn.classList.remove('recording');
            document.getElementById('inline-voice-btn-icon').textContent  = '🎙️';
            document.getElementById('inline-voice-btn-label').textContent = 'Speak';
            showToast('Voice input failed. Please try again.', 'error');
        };

        btn.addEventListener('click', () => {
            if (!inlineSpeechRecognition) return;
            if (inlineIsRecording) {
                inlineSpeechRecognition.stop();
            } else {
                inlineSpeechRecognition.start();
            }
        });
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    function init() {
        injectChatWidget();
        bindEvents();
        initVoiceListing();
        // Expose so app.js can call after login
        window.initInlineVoiceStrip = initInlineVoiceStrip;
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
