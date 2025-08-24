/*
 * AlgoMento - AI Coding Assistant
 * Content Script - Main Extension Logic
 * 
 * Copyright (c) 2025 Biraj Paul (Biraj-P)
 * Licensed under the MIT License
 * 
 * Original Author: Biraj Paul
 * GitHub: https://github.com/Biraj-P
 * Project: https://github.com/Biraj-P/AlgoMento
 */

// AlgoMento AI - Modern LeetCode Assistant Extension
// Enhanced version with chat interface and interview simulation

(function() {
    'use strict';

    // Enhanced error suppression for external analytics and SSL issues
    const suppressExternalErrors = function(e) {
        const errorPatterns = [
            'googletagmanager', 'google-analytics', 'analytics.js', 'gtag', 'ga.js',
            'ERR_CERT_AUTHORITY_INVALID', 'failed to install ga', 'failed to install GTAG',
            'ERR_NETWORK', 'ERR_INTERNET_DISCONNECTED', 'ERR_CERT_COMMON_NAME_INVALID',
            'ERR_CERT_DATE_INVALID', 'ERR_SSL_PROTOCOL_ERROR', '_app-', 'framework-',
            'G-CDRWKZTDEX', 'google.com/analytics', 'doubleclick.net'
        ];
        
        const errorText = String(e.message || e.error || e.filename || e.source || '').toLowerCase();
        if (errorPatterns.some(pattern => errorText.includes(pattern.toLowerCase()))) {
            console.log('[AlgoMento] Suppressed external analytics/SSL error');
            if (e.preventDefault) e.preventDefault();
            return false;
        }
    };

    // Apply comprehensive error suppression
    window.addEventListener('error', suppressExternalErrors, true);
    window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && suppressExternalErrors({message: e.reason.message || e.reason})) {
            e.preventDefault();
        }
    });

    // Global variables
    let sidebar = null;
    let isMinimized = false;
    let currentProblem = null;
    let chatMessages = [];
    let interviewMode = false;

    // Initialize the extension
    function init() {
        console.log('[AlgoMento] Initializing modern AI assistant...');
        
        // Remove any existing sidebar
        const existingSidebar = document.getElementById('algomento-sidebar');
        if (existingSidebar) {
            existingSidebar.remove();
        }

        // Create and inject new CSS
        injectModernCSS();
        
        // Create floating trigger button
        createFloatingTrigger();
        
        // Extract problem context
        extractProblemContext();
        
        console.log('[AlgoMento] Modern AI assistant initialized successfully');
    }

    function createFloatingTrigger() {
        // Remove existing trigger
        const existingTrigger = document.getElementById('algomento-trigger');
        if (existingTrigger) {
            existingTrigger.remove();
        }

        const trigger = document.createElement('div');
        trigger.id = 'algomento-trigger';
        trigger.className = 'algomento-floating-trigger';
        trigger.innerHTML = `
            <div class="trigger-icon">🧠</div>
            <div class="trigger-tooltip">AlgoMento AI Assistant</div>
        `;

        trigger.addEventListener('click', toggleSidebar);
        document.body.appendChild(trigger);
    }

    function toggleSidebar() {
        if (sidebar && document.body.contains(sidebar)) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    function openSidebar() {
        if (sidebar && document.body.contains(sidebar)) {
            return;
        }

        sidebar = document.createElement('div');
        sidebar.id = 'algomento-sidebar';
        sidebar.className = 'algomento-modern-sidebar';
        sidebar.innerHTML = getSidebarHTML();

        document.body.appendChild(sidebar);
        setupEventListeners();
        
        // Add opening animation
        setTimeout(() => {
            sidebar.classList.add('open');
            // Force scrolling and theme
            const chatMessages = sidebar.querySelector('.chat-messages');
            if (chatMessages) {
                chatMessages.style.overflowY = 'auto';
                chatMessages.style.maxHeight = 'calc(100vh - 300px)';
            }
            applyTheme(loadTheme());
        }, 10);

        // Initialize problem context
        updateProblemContext();
        // Apply saved or auto theme on open
        try { initTheme(); } catch (e) { console.warn('[AlgoMento] Theme init failed', e); }
        // Default to Chat tab
        setActiveTab('chat');
        // Enable vertical scrolling for sidebar
        sidebar.style.overflowY = 'auto';
        
        // Set up periodic context refresh (every 10 seconds)
        setInterval(() => {
            if (sidebar && document.body.contains(sidebar)) {
                const contextTab = sidebar.querySelector('.tab-btn[data-tab="context"]');
                if (contextTab && contextTab.classList.contains('active')) {
                    updateProblemContext();
                }
            }
        }, 10000);
    }

    function closeSidebar() {
        if (sidebar && document.body.contains(sidebar)) {
            sidebar.classList.remove('open');
            setTimeout(() => {
                if (sidebar && document.body.contains(sidebar)) {
                    sidebar.remove();
                    sidebar = null;
                }
            }, 300);
        }
    }

    function minimizeSidebar() {
        if (sidebar) {
            isMinimized = !isMinimized;
            const content = sidebar.querySelector('#ai-content');
            const minimizeBtn = sidebar.querySelector('#minimize-sidebar');
            
            if (isMinimized) {
                content.style.display = 'none';
                sidebar.classList.add('minimized');
                minimizeBtn.textContent = '+';
                minimizeBtn.title = 'Restore';
            } else {
                content.style.display = 'block';
                sidebar.classList.remove('minimized');
                minimizeBtn.textContent = '−';
                minimizeBtn.title = 'Minimize';
            }
        }
    }

    function getSidebarHTML() {
        return `
            <div class="ai-assistant-header">
                <div class="header-content">
                    <div class="ai-logo">🧠</div>
                    <div class="ai-title">
                        <h3>AlgoMento AI</h3>
                        <span class="ai-status">Ready to help</span>
                    </div>
                </div>
                <button class="theme-btn" id="theme-toggle" title="Theme: Auto">🌓</button>
                <button class="minimize-btn" id="minimize-sidebar" title="Minimize">−</button>
                <button class="close-btn" id="close-sidebar" title="Close">×</button>
            </div>

            <!-- New: Tabs to reduce vertical clutter -->
            <div class="ai-tabs">
                <button class="tab-btn active" data-tab="chat">💬 Chat</button>
                <button class="tab-btn" data-tab="tools">🧰 Tools</button>
                <button class="tab-btn" data-tab="context">📋 Context</button>
            </div>
            
            <div class="ai-content" id="ai-content">
                <div class="tab-section active" data-section="chat">
                    <!-- Quick Action Bar -->
                    <div class="quick-action-bar">
                        <button class="quick-btn" id="explain-approach" title="Explain approach">
                            <span class="icon">💡</span>
                            <span class="label">Approach</span>
                        </button>
                        <button class="quick-btn" id="generate-pseudocode" title="Generate pseudocode">
                            <span class="icon">📝</span>
                            <span class="label">Code</span>
                        </button>
                        <button class="quick-btn" id="debug-help" title="Debug help">
                            <span class="icon">🐛</span>
                            <span class="label">Debug</span>
                        </button>
                        <button class="quick-btn" id="interview-mode" title="Interview simulation">
                            <span class="icon">🎤</span>
                            <span class="label">Interview</span>
                        </button>
                    </div>

                    <!-- Main Chat Interface -->
                    <div class="chat-interface">
                        <div class="chat-messages" id="chat-messages">
                            <div class="welcome-card">
                                <div class="welcome-header">
                                    <span class="welcome-icon">🚀</span>
                                    <h4>Hello! I'm your coding mentor</h4>
                                </div>
                                <p>I can help you with:</p>
                                <ul class="help-list">
                                    <li>🔍 Understanding problem approaches</li>
                                    <li>📋 Generating pseudocode & solutions</li>
                                    <li>🐛 Debugging your code</li>
                                    <li>🎯 Interview preparation & simulation</li>
                                    <li>⚡ Code optimization & complexity analysis</li>
                                </ul>
                                <p class="get-started-text">Click any button above or ask me anything!</p>
                            </div>
                        </div>
                        
                        <!-- Input Area -->
                        <div class="chat-input-container">
                            <div class="input-wrapper">
                                <textarea 
                                    id="user-input" 
                                    placeholder="Ask me anything about this problem, or paste your code for review..."
                                    rows="2"
                                ></textarea>
                                <div class="input-actions">
                                    <button class="attach-btn" id="attach-code" title="Attach current code">📎</button>
                                    <button class="send-btn" id="send-message" title="Send message">
                                        <span class="send-icon">🚀</span>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Quick suggestions -->
                            <div class="quick-suggestions" id="quick-suggestions">
                                <button class="suggestion-pill" data-text="Can you explain the optimal solution?">Optimal solution?</button>
                                <button class="suggestion-pill" data-text="What's the time complexity?">Time complexity?</button>
                                <button class="suggestion-pill" data-text="Can you review my code?">Review code?</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tools Tab -->
                <div class="tab-section" data-section="tools">
                    <div class="features-panel" id="features-panel">
                        <div class="panel-header" id="panel-toggle">
                            <span class="panel-title">⚡ Advanced Features</span>
                            <span class="panel-arrow">▼</span>
                        </div>
                        <div class="panel-content">
                            <!-- Interview Simulation -->
                            <div class="feature-group">
                                <h5>🎤 Interview Simulation</h5>
                                <div class="feature-buttons">
                                    <button class="feature-btn compact" id="start-interview">
                                        <span class="btn-icon">🎯</span>
                                        <span class="btn-text">Start Mock Interview</span>
                                    </button>
                                    <button class="feature-btn compact" id="practice-questions">
                                        <span class="btn-icon">📚</span>
                                        <span class="btn-text">Practice Questions</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Code Analysis -->
                            <div class="feature-group">
                                <h5>🔬 Code Analysis</h5>
                                <div class="feature-buttons">
                                    <button class="feature-btn compact" id="complexity-analysis">
                                        <span class="btn-icon">📊</span>
                                        <span class="btn-text">Complexity Analysis</span>
                                    </button>
                                    <button class="feature-btn compact" id="optimize-code">
                                        <span class="btn-icon">⚡</span>
                                        <span class="btn-text">Optimize Code</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Learning Tools -->
                            <div class="feature-group">
                                <h5>📖 Learning Tools</h5>
                                <div class="feature-buttons">
                                    <button class="feature-btn compact" id="similar-problems">
                                        <span class="btn-icon">🔗</span>
                                        <span class="btn-text">Similar Problems</span>
                                    </button>
                                    <button class="feature-btn compact" id="concept-quiz">
                                        <span class="btn-icon">🧩</span>
                                        <span class="btn-text">Quick Quiz</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Context Tab -->
                <div class="tab-section" data-section="context">
                    <div class="problem-context" id="problem-context">
                        <div class="context-header">
                            <span class="context-icon">📋</span>
                            <span class="context-title">Current Problem</span>
                            <button class="refresh-btn" id="refresh-context" title="Refresh problem context">🔄</button>
                        </div>
                        <div class="context-content" id="context-content">
                            <div class="context-section">
                                <h4>🎯 Problem Overview</h4>
                                <p class="context-placeholder">Analyzing current problem...</p>
                            </div>
                            
                            <div class="context-section">
                                <h4>🔧 Current Code</h4>
                                <div class="code-preview" id="code-preview">
                                    <p class="context-placeholder">No code detected...</p>
                                </div>
                            </div>
                            
                            <div class="context-section">
                                <h4>💡 Suggestions</h4>
                                <div class="suggestions-list" id="suggestions-list">
                                    <p class="context-placeholder">AI suggestions will appear here...</p>
                                </div>
                            </div>
                            
                            <div class="context-section">
                                <h4>📊 Complexity Info</h4>
                                <div class="complexity-info" id="complexity-info">
                                    <p class="context-placeholder">Complexity analysis pending...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function setupEventListeners() {
        try {
            // Header controls
            const closeBtn = document.getElementById('close-sidebar');
            const minimizeBtn = document.getElementById('minimize-sidebar');
            
            if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
            if (minimizeBtn) minimizeBtn.addEventListener('click', minimizeSidebar);

            // Quick action buttons
            const quickButtons = [
                { id: 'explain-approach', action: 'explain-approach' },
                { id: 'generate-pseudocode', action: 'generate-pseudocode' },
                { id: 'debug-help', action: 'debug-help' },
                { id: 'interview-mode', action: 'interview-mode' }
            ];

            quickButtons.forEach(({ id, action }) => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => handleQuickAction(action));
                }
            });

            // Chat input
            const userInput = document.getElementById('user-input');
            const sendBtn = document.getElementById('send-message');
            const attachBtn = document.getElementById('attach-code');

            if (userInput) {
                userInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });
                // New: live composer UX updates (auto-resize, suggestions visibility, send enabled)
                userInput.addEventListener('input', handleComposerInput);
                // Initialize composer state
                handleComposerInput();
            }

            if (sendBtn) sendBtn.addEventListener('click', sendMessage);
            if (attachBtn) attachBtn.addEventListener('click', attachCode);

            // Quick suggestions
            const suggestionPills = document.querySelectorAll('.suggestion-pill');
            suggestionPills.forEach(pill => {
                pill.addEventListener('click', (e) => {
                    const text = e.target.dataset.text;
                    if (userInput && text) {
                        // Set the text and focus the input
                        userInput.value = text;
                        userInput.focus();
                        
                        // Send the message immediately
                        setTimeout(() => {
                            sendMessage();
                        }, 10);
                    }
                });
            });

            // Features panel toggle
            const panelToggle = document.getElementById('panel-toggle');
            if (panelToggle) {
                panelToggle.addEventListener('click', toggleFeaturesPanel);
            }

            // Advanced feature buttons
            const advancedButtons = [
                'start-interview', 'practice-questions', 'complexity-analysis',
                'optimize-code', 'similar-problems', 'concept-quiz'
            ];

            advancedButtons.forEach(buttonId => {
                const btn = document.getElementById(buttonId);
                if (btn) {
                    btn.addEventListener('click', () => handleAdvancedFeature(buttonId));
                }
            });

            // Problem context refresh
            const refreshBtn = document.getElementById('refresh-context');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', updateProblemContext);
            }

            // Theme toggle
            const themeBtn = document.getElementById('theme-toggle');
            if (themeBtn) themeBtn.addEventListener('click', cycleTheme);

            // Tabs switching (event delegation for reliability)
            const tabsContainer = sidebar.querySelector('.ai-tabs');
            if (tabsContainer) {
                tabsContainer.addEventListener('click', function(e) {
                    const btn = e.target.closest('.tab-btn');
                    if (btn) {
                        setActiveTab(btn.getAttribute('data-tab'));
                        applyTheme(loadTheme());
                    }
                });
            }

            // Suggestion pills event listeners
            const sidebarSuggestionPills = sidebar.querySelectorAll('.suggestion-pill');
            sidebarSuggestionPills.forEach(pill => {
                pill.addEventListener('click', function() {
                    const text = this.getAttribute('data-text');
                    if (text) {
                        const userInput = document.getElementById('user-input');
                        if (userInput) {
                            userInput.value = text;
                            userInput.focus();
                            handleComposerInput(); // Update UI state
                            
                            // Send the message automatically
                            setTimeout(() => {
                                sendMessage();
                            }, 10);
                        }
                    }
                });
            });

            console.log('[AlgoMento] Event listeners setup completed');
        } catch (error) {
            console.error('[AlgoMento] Error setting up event listeners:', error);
        }
    }

    function setActiveTab(tab) {
        if (!sidebar) return;
        const buttons = sidebar.querySelectorAll('.ai-tabs .tab-btn');
        const sections = sidebar.querySelectorAll('.tab-section');
        buttons.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        const activeBtn = sidebar.querySelector(`.ai-tabs .tab-btn[data-tab="${tab}"]`);
        const activeSection = sidebar.querySelector(`.tab-section[data-section="${tab}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        if (activeSection) activeSection.classList.add('active');
        
        // Auto-refresh context when switching to context tab
        if (tab === 'context') {
            setTimeout(updateProblemContext, 100);
        }
    }

    function handleQuickAction(action) {
        console.log('[AlgoMento] Quick action:', action);
        
        const actionMessages = {
            'explain-approach': 'Explain the approach on how to solve this problem step by step, probably start from Brute Force',
            'generate-pseudocode': 'Generate pseudocode and implementation for this problem.',
            'debug-help': 'Help me debug my current solution and find any issues.',
            'interview-mode': 'Start an interview simulation for this problem.'
        };

        const message = actionMessages[action];
        if (message) {
            addUserMessage(message);
            processAIRequest(message, action);
        }
    }

    function sendMessage() {
        const userInput = document.getElementById('user-input');
        if (!userInput || !userInput.value.trim()) return;

        const message = userInput.value.trim();
        userInput.value = '';

        addUserMessage(message);
        processAIRequest(message, 'chat');
        // Update composer state after sending
        handleComposerInput();
        
        // Ensure we stay at bottom after sending
        setTimeout(() => scrollToBottom(), 50);
        setTimeout(() => scrollToBottom(), 200);
    }

    function attachCode() {
        const code = extractCode();
        const userInput = document.getElementById('user-input');
        
        if (code && userInput) {
            const currentText = userInput.value;
            const codePrompt = `\n\nHere's my current code:\n\`\`\`\n${code}\n\`\`\`\n\nCan you review it?`;
            userInput.value = currentText + codePrompt;
            userInput.focus();
            handleComposerInput();
        } else {
            addSystemMessage('No code found to attach. Make sure you have code in the editor.');
        }
    }

    function addUserMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        // Remove welcome card on first interaction
        hideWelcomeCard();

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(message)}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        scrollToBottom();

        // Keep suggestions visible even after conversation starts
        // const qs = document.getElementById('quick-suggestions');
        // if (qs) qs.style.display = 'none';
    }

    function addAIMessage(message, type = 'response') {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        // Remove welcome card on first AI response
        hideWelcomeCard();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ai-message ${type}`;
        
        const formattedMessage = formatAIResponse(message);
        
        messageDiv.innerHTML = `
            <div class="message-avatar">🧠</div>
            <div class="message-content">
                <div class="message-text">${formattedMessage}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
                <div class="message-actions">
                    <button class="action-btn copy-btn">📋</button>
                    <button class="action-btn follow-up-btn">💬</button>
                </div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        
        // Add event listeners to action buttons
        const copyBtn = messageDiv.querySelector('.copy-btn');
        const followUpBtn = messageDiv.querySelector('.follow-up-btn');
        
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                window.copyMessage(this);
            });
        }
        
        if (followUpBtn) {
            followUpBtn.addEventListener('click', function() {
                window.followUp(this);
            });
        }
        
        // Add event listeners to quiz buttons
        const quizButtons = messageDiv.querySelectorAll('.quiz-option');
        quizButtons.forEach(button => {
            button.addEventListener('click', function() {
                const letter = this.getAttribute('data-answer');
                const option = this.getAttribute('data-option');
                window.selectQuizAnswer(letter, option, this);
            });
        });
        
        scrollToBottom();
        
        // Ensure quiz buttons are visible by scrolling after a brief delay
        setTimeout(() => {
            const chatContainer = document.getElementById('chat-messages');
            if (chatContainer) {
                // Scroll to the very bottom to show all quiz options
                chatContainer.scrollTop = chatContainer.scrollHeight;
                
                // Additional check to ensure the last quiz button is visible
                const lastQuizButton = chatContainer.querySelector('.quiz-option:last-child');
                if (lastQuizButton) {
                    lastQuizButton.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'end',
                        inline: 'nearest'
                    });
                }
            }
        }, 200);
    }

    function addSystemMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(message)}</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function addLoadingMessage() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message loading';
        messageDiv.id = 'loading-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">🧠</div>
            <div class="message-content">
                <div class="loading-animation">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span class="loading-text">AI is thinking...</span>
                </div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function removeLoadingMessage() {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    // Global scroll position maintenance
    let lastChatHeight = 0;
    
    function maintainChatScroll() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const currentHeight = chatMessages.scrollHeight;
            if (currentHeight !== lastChatHeight) {
                // Content has changed, ensure we're at the bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
                lastChatHeight = currentHeight;
                console.log('[AlgoMento] Maintained scroll position after content change');
            }
        }
    }
    
    // Check scroll position every 500ms
    setInterval(maintainChatScroll, 500);

    function scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            // Use requestAnimationFrame for smoother scrolling
            requestAnimationFrame(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
                console.log('[AlgoMento] Scrolled to bottom:', chatMessages.scrollTop, '/', chatMessages.scrollHeight);
                
                // Ensure scroll position stays at bottom - retry if needed
                setTimeout(() => {
                    if (chatMessages.scrollTop < chatMessages.scrollHeight - chatMessages.clientHeight - 50) {
                        console.log('[AlgoMento] Re-scrolling to bottom as position changed');
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }, 100);
            });
        } else {
            console.warn('[AlgoMento] Chat messages container not found for scrolling');
        }
    }

    function processAIRequest(message, type) {
        console.log('[AlgoMento] Processing AI request:', { message, type });
        
        addLoadingMessage();
        
        const code = extractCode();
        const problem = extractProblem();
        
        const prompt = generateContextualPrompt(message, type, code, problem);
        
        chrome.runtime.sendMessage({
            action: 'processFeature',
            featureType: type,
            prompt: prompt,
            code: code,
            problem: problem,
            context: { type, timestamp: Date.now() }
        }, (response) => {
            removeLoadingMessage();
            
            if (chrome.runtime.lastError) {
                console.error('[AlgoMento] Runtime error:', chrome.runtime.lastError);
                addSystemMessage(`Error: ${chrome.runtime.lastError.message}`);
                return;
            }
            
            if (response && response.success) {
                addAIMessage(response.data.rawResponse || response.data.summary || 'Response generated successfully', type);
            } else {
                addSystemMessage(response ? response.error : 'Failed to process request');
            }
        });
    }

    function generateContextualPrompt(message, type, code, problem) {
        const context = `
Problem: ${problem || 'No problem context available'}
Current Code: ${code || 'No code available'}
User Question: ${message}
`;

        const prompts = {
            'explain-approach': `${context}\n\nExplain the best approach to solve this problem in under 100 words, WhatsApp style. Be concise and clear.`,
            
            'generate-pseudocode': `${context}\n\nGenerate pseudocode and implementation for this problem in under 100 words, WhatsApp style. Be concise.`,
            
            'debug-help': `${context}\n\nHelp debug this solution in under 100 words, WhatsApp style. Be direct and helpful.`,
            
            'interview-mode': `${context}\n\nConduct an interview simulation in under 100 words, WhatsApp style. Ask one key question.`,
            
            'chat': `${context}\n\nUser message: ${message}\n\nRespond helpfully in under 100 words, WhatsApp style. Be concise but thorough.`
        };

        return prompts[type] || prompts['chat'];
    }

    function handleAdvancedFeature(featureId) {
        console.log('[AlgoMento] Advanced feature:', featureId);
        
        // Switch to Chat tab before processing the feature
        setActiveTab('chat');
        
        const featureActions = {
            'start-interview': () => startInterviewSimulation(),
            'practice-questions': () => suggestPracticeQuestions(),
            'complexity-analysis': () => analyzeComplexity(),
            'optimize-code': () => optimizeCode(),
            'similar-problems': () => findSimilarProblems(),
            'concept-quiz': () => startConceptQuiz()
        };

        const action = featureActions[featureId];
        if (action) {
            action();
        }
    }

    function startInterviewSimulation() {
        interviewMode = true;
        addSystemMessage('🎤 Interview Mode Activated');
        const prompt = 'Start a technical interview simulation for this problem. Act as an experienced interviewer and guide me through the problem-solving process.';
        processAIRequest(prompt, 'interview-mode');
    }

    function suggestPracticeQuestions() {
        const prompt = 'Suggest 3-5 similar practice problems that would help me master this type of algorithm. Include difficulty levels and brief descriptions.';
        processAIRequest(prompt, 'similar-problems');
    }

    function analyzeComplexity() {
        const prompt = 'Provide a detailed time and space complexity analysis of the current solution. Explain the Big O notation step by step.';
        processAIRequest(prompt, 'complexity-analysis');
    }

    function optimizeCode() {
        const prompt = 'Analyze the current solution and suggest optimizations. Focus on improving time/space complexity and code readability.';
        processAIRequest(prompt, 'optimize-code');
    }

    function findSimilarProblems() {
        const prompt = 'Find 5 similar LeetCode problems that use the same algorithms or patterns. Include problem numbers, titles, and difficulty levels.';
        processAIRequest(prompt, 'similar-problems');
    }

    function startConceptQuiz() {
        const prompt = 'Create a quick 3-question quiz about the key concepts and algorithms used in this problem. Make it interactive and educational.';
        processAIRequest(prompt, 'concept-quiz');
    }

    function toggleFeaturesPanel() {
        const panel = document.getElementById('features-panel');
        const arrow = panel.querySelector('.panel-arrow');
        
        if (panel.classList.contains('collapsed')) {
            panel.classList.remove('collapsed');
            arrow.textContent = '▲';
        } else {
            panel.classList.add('collapsed');
            arrow.textContent = '▼';
        }
    }

    function updateProblemContext() {
        console.log('[AlgoMento] Updating problem context...');
        
        const problem = extractProblem();
        const code = extractCode();
        const difficulty = extractDifficulty();
        const tags = extractTags();
        
        // Update Problem Overview section
        const overviewSection = document.querySelector('.context-content .context-section:nth-child(1) p');
        if (overviewSection) {
            if (problem) {
                overviewSection.innerHTML = `
                    <div class="problem-title">${problem.substring(0, 200)}${problem.length > 200 ? '...' : ''}</div>
                    ${difficulty ? `<div class="problem-difficulty ${difficulty.toLowerCase()}" style="margin-top: 8px; padding: 2px 8px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 11px; display: inline-block;">${difficulty}</div>` : ''}
                    ${tags && tags.length > 0 ? `
                        <div class="problem-tags" style="margin-top: 8px;">
                            ${tags.slice(0, 4).map(tag => `<span class="tag" style="background: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px; display: inline-block;">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                `;
                overviewSection.className = '';
            } else {
                overviewSection.innerHTML = 'No problem detected. Navigate to a LeetCode, HackerRank, or coding problem page.';
                overviewSection.className = 'context-placeholder';
            }
        }
        
        // Update Current Code section
        const codeSection = document.getElementById('code-preview');
        if (codeSection) {
            if (code && code.length > 10) {
                codeSection.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; font-size: 10px; line-height: 1.3;">${code.substring(0, 500)}${code.length > 500 ? '\n...(truncated)' : ''}</pre>`;
                codeSection.className = 'code-preview';
            } else {
                codeSection.innerHTML = '<p class="context-placeholder">No code detected in editor</p>';
            }
        }
        
        // Update Suggestions section  
        const suggestionsSection = document.getElementById('suggestions-list');
        if (suggestionsSection) {
            if (problem && code) {
                suggestionsSection.innerHTML = `
                    <ul style="margin: 0; padding-left: 16px; font-size: 11px; line-height: 1.4;">
                        <li>💡 Use the "Explain Approach" button for step-by-step guidance</li>
                        <li>🔍 Try "Complexity Analysis" to understand time/space requirements</li>
                        <li>🚀 Click "Optimize Code" if you want to improve performance</li>
                        <li>🎯 Use "Debug Help" if your solution isn't working</li>
                    </ul>
                `;
            } else if (problem) {
                suggestionsSection.innerHTML = `
                    <ul style="margin: 0; padding-left: 16px; font-size: 11px; line-height: 1.4;">
                        <li>📝 Start writing your solution in the code editor</li>
                        <li>💭 Use "Generate Pseudocode" for implementation ideas</li>
                        <li>🎤 Try "Start Mock Interview" for interview practice</li>
                    </ul>
                `;
            } else {
                suggestionsSection.innerHTML = '<p class="context-placeholder">Navigate to a problem page for personalized suggestions</p>';
            }
        }
        
        // Update Complexity Info section
        const complexitySection = document.getElementById('complexity-info');
        if (complexitySection) {
            if (code && code.length > 20) {
                // Basic complexity analysis
                let timeComplexity = 'O(?)';
                let spaceComplexity = 'O(?)';
                
                if (code.includes('for') && code.includes('for')) {
                    timeComplexity = 'O(n²)';
                } else if (code.includes('for') || code.includes('while')) {
                    timeComplexity = 'O(n)';
                } else if (code.includes('sort')) {
                    timeComplexity = 'O(n log n)';
                } else {
                    timeComplexity = 'O(1)';
                }
                
                if (code.includes('[]') || code.includes('{}') || code.includes('new ')) {
                    spaceComplexity = 'O(n)';
                } else {
                    spaceComplexity = 'O(1)';
                }
                
                complexitySection.innerHTML = `
                    <div style="font-size: 11px;">
                        <div style="margin-bottom: 4px;"><strong>⏱️ Time:</strong> ${timeComplexity}</div>
                        <div style="margin-bottom: 4px;"><strong>💾 Space:</strong> ${spaceComplexity}</div>
                        <div style="color: #6b7280; font-size: 10px;">*Basic analysis - use "Complexity Analysis" for detailed review</div>
                    </div>
                `;
            } else {
                complexitySection.innerHTML = '<p class="context-placeholder">Write some code to see complexity analysis</p>';
            }
        }
        
        console.log('[AlgoMento] Context updated:', { problem: !!problem, code: !!code });
    }

    // Utility functions
    function extractCode() {
        // Try multiple selectors for different code editors and platforms
        const codeSelectors = [
            // Monaco Editor (VS Code style)
            '.monaco-editor textarea',
            '.monaco-editor .view-lines',
            '.monaco-editor .view-line span',
            // CodeMirror
            '.CodeMirror-code',
            '.CodeMirror-line',
            // LeetCode specific
            '[data-track-load="description_content"] pre code',
            '.notranslate',
            // HackerRank
            '#editor textarea',
            '.ace_content',
            // Codepen/JSFiddle
            '.codepen-editor textarea',
            // Generic code areas
            'pre code',
            'textarea[placeholder*="code"]',
            'textarea[placeholder*="solution"]',
            'div[role="textbox"]',
            '.ace_text-input',
            'textarea[data-hoist="true"]',
            // Alternative patterns
            '[class*="editor"] textarea',
            '[class*="code"] textarea',
            '[id*="editor"] textarea',
            '[id*="code"] textarea'
        ];

        for (const selector of codeSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    const code = element.value || element.textContent || element.innerText;
                    if (code && code.trim().length > 20 && !code.includes('Example') && !code.includes('Input:')) {
                        console.log('[AlgoMento] Code found via selector:', selector);
                        return code.trim();
                    }
                }
            } catch (e) {
                // Skip invalid selectors
            }
        }

        // Try to get code from Monaco editor directly
        if (window.monaco && window.monaco.editor) {
            try {
                const editors = window.monaco.editor.getEditors();
                if (editors.length > 0) {
                    const code = editors[0].getValue();
                    if (code && code.trim().length > 20) {
                        console.log('[AlgoMento] Code found via Monaco API');
                        return code.trim();
                    }
                }
            } catch (e) {
                // Monaco not available
            }
        }

        // Try Ace Editor
        if (window.ace) {
            try {
                const editor = window.ace.edit();
                if (editor) {
                    const code = editor.getValue();
                    if (code && code.trim().length > 20) {
                        console.log('[AlgoMento] Code found via Ace API');
                        return code.trim();
                    }
                }
            } catch (e) {
                // Ace not available
            }
        }

        return '';
    }

    function extractProblem() {
        // Try multiple selectors for problem description from different platforms
        const problemSelectors = [
            // LeetCode
            '[data-track-load="description_content"]',
            '.content__u3I1 .notranslate',
            '[data-cy="question-detail-main-tabs"] .notranslate',
            '.elfjS',
            '[data-key="description-content"]',
            '.question-content',
            '.description__24sA',
            // HackerRank
            '.problem-statement',
            '.challenge-text',
            '.challenge-problem-statement',
            // HackerEarth
            '.problem-statement',
            '.content .problem-body',
            '.tab-content .problem-statement',
            '#problem-statement',
            '.problem-content',
            // GeeksforGeeks
            '.problems_problem_content__Xm_eO',
            '.problem-statement',
            '.content-wrapper .content',
            '.ui.segment .header + p',
            'article .content',
            '.problem-description',
            // CodeChef
            '.problem-statement',
            '.content-wrapper',
            '.problem-content',
            // Codeforces
            '.problem-statement .header',
            '.ttypography',
            // AtCoder
            '.part pre',
            '.lang-en .part',
            // SPOJ
            '.prob',
            '#problem-body',
            // CodeSignal/Other platforms
            '.task-description',
            '.problem-body',
            // Generic patterns
            'h1 + div',
            '.content h1 + *',
            '[class*="description"]',
            '[class*="problem"]',
            '[class*="statement"]'
        ];

        for (const selector of problemSelectors) {
            try {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent || element.innerText;
                    if (text && text.trim().length > 50) {
                        console.log('[AlgoMento] Problem found via selector:', selector);
                        return text.trim();
                    }
                }
            } catch (e) {
                // Skip invalid selectors
            }
        }

        // Fallback: Look for page title or h1
        const titleSelectors = ['h1', 'title', '.page-title', '.problem-title'];
        for (const selector of titleSelectors) {
            try {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent || element.innerText;
                    if (text && text.trim().length > 10 && text.toLowerCase().includes('problem')) {
                        console.log('[AlgoMento] Problem title found via selector:', selector);
                        return text.trim();
                    }
                }
            } catch (e) {
                // Skip invalid selectors
            }
        }

        for (const selector of problemSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent || element.innerText;
                if (text && text.trim().length > 50) {
                    return text.trim();
                }
            }
        }

        return '';
    }

    function extractDifficulty() {
        const difficultySelectors = [
            '[diff="easy"]',
            '[diff="medium"]',
            '[diff="hard"]',
            '.text-difficulty-easy',
            '.text-difficulty-medium',
            '.text-difficulty-hard',
            '.text-green-s',
            '.text-yellow',
            '.text-red-s'
        ];

        for (const selector of difficultySelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent || element.getAttribute('diff');
                if (text) {
                    if (text.toLowerCase().includes('easy')) return 'Easy';
                    if (text.toLowerCase().includes('medium')) return 'Medium';
                    if (text.toLowerCase().includes('hard')) return 'Hard';
                }
            }
        }

        return null;
    }

    function extractTags() {
        const tagElements = document.querySelectorAll('.topic-tag, .tag, [class*="tag"], .rounded-xl');
        const tags = [];
        
        tagElements.forEach(el => {
            const tagText = el.textContent?.trim();
            if (tagText && tagText.length < 20 && !tagText.includes('LeetCode') && !tagText.includes('Premium')) {
                tags.push(tagText);
            }
        });

        return tags.slice(0, 5); // Return first 5 tags
    }

    function extractProblemContext() {
        // Extract and store current problem context
        currentProblem = {
            title: document.querySelector('h1, .text-title-large')?.textContent?.trim() || '',
            problem: extractProblem(),
            difficulty: extractDifficulty(),
            tags: extractTags(),
            url: window.location.href
        };
        
        console.log('[AlgoMento] Problem context extracted:', currentProblem);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatAIResponse(response) {
        if (!response) return '';
        
        // Remove any existing quiz to avoid duplicates
        response = response.replace(/\n\n📝.*$/s, '').replace(/📝.*$/s, '');
        
        // Keep responses under 100 words
        const words = response.split(' ');
        if (words.length > 100) {
            response = words.slice(0, 97).join(' ') + '...';
        }
        
        // Add clickable quiz at the end
        const quizQuestions = [
            {
                question: "What's the time complexity?",
                options: ["O(1)", "O(n)", "O(n²)", "O(log n)"]
            },
            {
                question: "Best data structure?",
                options: ["Array", "Hash Map", "Tree", "Stack"]
            },
            {
                question: "Key approach?",
                options: ["Greedy", "DP", "Two Pointers", "Divide & Conquer"]
            }
        ];
        
        const randomQuiz = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
        let quiz = `\n\n📝 **${randomQuiz.question}**\n<div class="quiz-container">`;
        randomQuiz.options.forEach((option, index) => {
            const letter = String.fromCharCode(65 + index);
            quiz += `<button class="quiz-option" data-answer="${letter}" data-option="${option}">${letter}) ${option}</button>`;
        });
        quiz += `</div>`;

        const processedResponse = (response + quiz)
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
            
        return processedResponse;
    }

    // Quiz answer selection function
    window.selectQuizAnswer = function(letter, answer, buttonElement) {
        // Visual feedback
        const allQuizButtons = buttonElement.parentNode.querySelectorAll('.quiz-option');
        allQuizButtons.forEach(btn => {
            btn.classList.remove('selected');
            btn.disabled = true; // Disable all buttons
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
        });
        
        buttonElement.classList.add('selected');
        buttonElement.style.opacity = '1'; // Keep selected button fully visible
        
        // Send the answer as a message
        setTimeout(() => {
            const answerMessage = `My answer: ${letter}) ${answer}`;
            
            // Add user message to chat
            addUserMessage(answerMessage);
            
            // Process AI request for the answer
            processAIRequest(answerMessage, 'chat');
        }, 300);
    };

    // Copy message functionality
    window.copyMessage = function(buttonElement) {
        console.log('[AlgoMento] Copy function called', buttonElement);
        try {
            const messageContent = buttonElement.closest('.message-content');
            if (messageContent) {
                const messageText = messageContent.querySelector('.message-text');
                if (messageText) {
                    // Get text content without HTML tags
                    const textToCopy = messageText.innerText || messageText.textContent;
                    
                    // Try modern clipboard API first
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            showCopyFeedback(buttonElement, true);
                        }).catch(() => {
                            fallbackCopyText(textToCopy, buttonElement);
                        });
                    } else {
                        fallbackCopyText(textToCopy, buttonElement);
                    }
                }
            }
        } catch (error) {
            console.error('[AlgoMento] Copy failed:', error);
            showCopyFeedback(buttonElement, false);
        }
    };

    // Fallback copy method for older browsers
    function fallbackCopyText(text, buttonElement) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            showCopyFeedback(buttonElement, successful);
        } catch (error) {
            console.error('[AlgoMento] Fallback copy failed:', error);
            showCopyFeedback(buttonElement, false);
        }
    }

    // Show visual feedback for copy operation
    function showCopyFeedback(buttonElement, success) {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = success ? '✅' : '❌';
        buttonElement.style.pointerEvents = 'none';
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.style.pointerEvents = 'auto';
        }, 1500);
    }

    // Follow-up functionality
    window.followUp = function(buttonElement) {
        console.log('[AlgoMento] Follow-up function called', buttonElement);
        try {
            const messageContent = buttonElement.closest('.message-content');
            if (messageContent) {
                const messageText = messageContent.querySelector('.message-text');
                if (messageText) {
                    const originalMessage = messageText.innerText || messageText.textContent;
                    
                    // Generate contextual follow-up prompts
                    const followUpOptions = [
                        "Can you explain this in more detail?",
                        "What are some alternative approaches?",
                        "Can you provide a code example?",
                        "What are the edge cases to consider?",
                        "How can I optimize this further?",
                        "What's the time and space complexity?"
                    ];
                    
                    // Show follow-up options as suggestion pills
                    showFollowUpOptions(followUpOptions, buttonElement);
                }
            }
        } catch (error) {
            console.error('[AlgoMento] Follow-up failed:', error);
        }
    };

    // Show follow-up options
    function showFollowUpOptions(options, buttonElement) {
        // Remove any existing follow-up container
        const existingContainer = document.querySelector('.follow-up-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.className = 'follow-up-container';
        container.innerHTML = `
            <div class="follow-up-header">💬 Follow-up questions:</div>
            <div class="follow-up-options">
                ${options.map(option => `
                    <button class="follow-up-option" data-text="${option}">${option}</button>
                `).join('')}
            </div>
            <button class="follow-up-close">✖️ Close</button>
        `;

        // Insert after the message
        const messageDiv = buttonElement.closest('.message');
        messageDiv.parentNode.insertBefore(container, messageDiv.nextSibling);

        // Add event listeners
        const followUpButtons = container.querySelectorAll('.follow-up-option');
        console.log('[AlgoMento] Adding event listeners to', followUpButtons.length, 'follow-up buttons');
        
        followUpButtons.forEach((option, index) => {
            console.log('[AlgoMento] Adding listener to button', index, ':', option.textContent);
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[AlgoMento] Follow-up option clicked:', option.textContent);
                const text = option.getAttribute('data-text');
                console.log('[AlgoMento] Follow-up text:', text);
                const userInput = document.getElementById('user-input');
                console.log('[AlgoMento] User input element:', userInput);
                if (userInput) {
                    userInput.value = text;
                    userInput.focus();
                    handleComposerInput();
                    console.log('[AlgoMento] Text set in input field');
                    
                    // Automatically send the message - use timeout to ensure DOM is ready
                    setTimeout(() => {
                        console.log('[AlgoMento] Attempting to send message...');
                        try {
                            // Try calling sendMessage directly
                            if (typeof sendMessage === 'function') {
                                sendMessage();
                                console.log('[AlgoMento] Message sent via sendMessage()');
                                // Ensure we scroll to bottom after sending
                                setTimeout(() => scrollToBottom(), 200);
                            } else {
                                throw new Error('sendMessage function not available');
                            }
                        } catch (error) {
                            console.error('[AlgoMento] Direct send failed:', error);
                            // Fallback: trigger send button click
                            const sendBtn = document.getElementById('send-message');
                            if (sendBtn) {
                                console.log('[AlgoMento] Fallback: clicking send button');
                                sendBtn.click();
                                // Ensure we scroll to bottom after clicking
                                setTimeout(() => scrollToBottom(), 200);
                            } else {
                                console.error('[AlgoMento] Send button not found!');
                            }
                        }
                    }, 100);
                } else {
                    console.error('[AlgoMento] User input element not found!');
                }
                container.remove();
            });
        });

        container.querySelector('.follow-up-close').addEventListener('click', () => {
            container.remove();
        });

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (container.parentNode) {
                container.remove();
            }
        }, 10000);
    }

    // New: Hide welcome card after first interaction
    function hideWelcomeCard() {
        const welcome = document.querySelector('.welcome-card');
        if (welcome) welcome.remove();
    }

    // New: Composer UX - autoresize textarea, toggle suggestions, enable/disable send
    function handleComposerInput() {
        const userInput = document.getElementById('user-input');
        if (!userInput) return;

        // Auto-resize up to a max height
        userInput.style.height = 'auto';
        const maxHeight = 160; // px
        userInput.style.height = Math.min(userInput.scrollHeight, maxHeight) + 'px';
        userInput.style.overflowY = userInput.scrollHeight > maxHeight ? 'auto' : 'hidden';

        // Keep suggestions always visible for quick access
        const qs = document.getElementById('quick-suggestions');
        if (qs) {
            qs.style.display = 'flex'; // Always show suggestions
        }

        // Toggle send button enabled state
        const sendBtn = document.getElementById('send-message');
        if (sendBtn) {
            sendBtn.disabled = userInput.value.trim().length === 0;
        }
    }

    // Functions removed to avoid duplicates - using comprehensive implementation above

    // Theme management
    const THEME_KEY = 'algomento-theme'; // values: 'auto' | 'light' | 'dark' | 'contrast'
    let themeMediaQuery;

    function initTheme() {
        const saved = loadTheme();
        applyTheme(saved);
        // Watch system theme if auto
        if (themeMediaQuery) {
            try { themeMediaQuery.removeEventListener('change', handleSystemThemeChange); } catch (_) {}
        }
        themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        themeMediaQuery.addEventListener('change', handleSystemThemeChange);
    }

    function handleSystemThemeChange() {
        const mode = loadTheme();
        if (mode === 'auto') applyTheme('auto');
    }

    function loadTheme() {
        try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch (_) { return 'auto'; }
    }

    function saveTheme(mode) {
        try { localStorage.setItem(THEME_KEY, mode); } catch (_) {}
    }

    function resolveTheme(mode) {
        if (mode === 'auto') {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return mode;
    }

    function updateThemeButton(mode) {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        const resolved = resolveTheme(mode);
        const label = mode === 'auto' ? `Auto (${resolved.charAt(0).toUpperCase() + resolved.slice(1)})` : mode.charAt(0).toUpperCase() + mode.slice(1);
        btn.title = `Theme: ${label}`;
        btn.textContent = mode === 'contrast' ? '⬛' : '🌓';
    }

    function applyTheme(mode) {
        const resolved = resolveTheme(mode);
        if (sidebar) {
            sidebar.setAttribute('data-theme', resolved);
            sidebar.setAttribute('data-theme-mode', mode);
        }
        
        // Only apply theme to extension elements, not the entire browser
        const algoMentoElements = document.querySelectorAll('.algomento-modern-sidebar, .algomento-floating-trigger');
        algoMentoElements.forEach(element => {
            element.setAttribute('data-theme', resolved);
        });
        
        updateThemeButton(mode);
    }

    function cycleTheme() {
        const order = ['auto', 'dark', 'light', 'contrast'];
        const current = loadTheme();
        const next = order[(order.indexOf(current) + 1) % order.length];
        saveTheme(next);
        applyTheme(next);
    }

    function injectModernCSS() {
        // Remove existing CSS
        const existingCSS = document.getElementById('algomento-modern-css');
        if (existingCSS) {
            existingCSS.remove();
        }

        const css = `
            /* AlgoMento Modern UI Styles */
            
            /* Floating Trigger Button */
            .algomento-floating-trigger {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                z-index: 10000;
                transition: all 0.3s ease;
                animation: pulse 2s infinite;
            }

            .algomento-floating-trigger:hover {
                transform: scale(1.1);
                box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
            }

            .trigger-icon {
                font-size: 24px;
                color: white;
            }

            .trigger-tooltip {
                position: absolute;
                bottom: 70px;
                right: 0;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }

            .algomento-floating-trigger:hover .trigger-tooltip {
                opacity: 1;
            }

            @keyframes pulse {
                0% { box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3); }
                50% { box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6); }
                100% { box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3); }
            }

            /* Modern Sidebar */
            .algomento-modern-sidebar {
                position: fixed;
                top: 0;
                right: -420px;
                width: 400px;
                height: 100vh;
                background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
                border-left: 1px solid #e2e8f0;
                box-shadow: -10px 0 50px rgba(0, 0, 0, 0.1);
                z-index: 10001;
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow-y: auto !important;
            }

            .algomento-modern-sidebar.open {
                right: 0;
            }

            .algomento-modern-sidebar.minimized {
                height: 60px;
            }

            /* Header */
            .ai-assistant-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }

            .header-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .ai-logo {
                font-size: 24px;
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ai-title h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }

            .ai-status {
                font-size: 12px;
                opacity: 0.9;
                margin-top: 2px;
                display: block;
            }

            .minimize-btn, .close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.2s ease;
                margin-left: 8px;
            }

            .minimize-btn:hover, .close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            /* Theme toggle button */
            .theme-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.2s ease, box-shadow 0.2s ease;
                margin-left: 8px;
            }
            .theme-btn:hover { background: rgba(255, 255, 255, 0.3); }
            .theme-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(255,255,255,0.35); }

            /* Main Content */
            .ai-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: visible;
                min-height: 0;
            }

            /* Quick Action Bar */
            .quick-action-bar {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1px;
                background: #e2e8f0;
                margin: 0;
            }

            .quick-btn {
                background: white;
                border: none;
                padding: 12px 6px; /* reduced padding for compact look */
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }

            .quick-btn:hover {
                background: #f1f5f9;
                transform: translateY(-1px);
            }

            .quick-btn .icon {
                font-size: 20px;
            }

            .quick-btn .label {
                display: none; /* hide labels to declutter; rely on title tooltips */
                font-size: 11px;
                font-weight: 500;
                color: #475569;
            }

            /* Chat Interface */
            .chat-interface {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto !important;
                padding: 20px;
                padding-bottom: 30px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: calc(100vh - 300px) !important;
                scroll-behavior: smooth !important;
                scroll-padding-bottom: 20px;
            }

            /* Welcome Card */
            .welcome-card {
                background: linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%);
                border: 1px solid #bfdbfe;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
            }

            .welcome-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 12px;
            }

            .welcome-icon {
                font-size: 24px;
            }

            .welcome-card h4 {
                margin: 0;
                color: #1e40af;
                font-size: 16px;
                font-weight: 600;
            }

            .help-list {
                text-align: left;
                margin: 16px 0;
                padding-left: 0;
                list-style: none;
            }

            .help-list li {
                padding: 4px 0;
                color: #374151;
                font-size: 14px;
            }

            .get-started-text {
                color: #6b7280;
                font-size: 13px;
                margin-top: 16px;
                margin-bottom: 0;
            }

            /* Messages */
            .message {
                display: flex;
                gap: 12px;
                max-width: 100%;
            }

            .user-message {
                justify-content: flex-end;
            }

            .user-message .message-content {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 18px 18px 4px 18px;
                max-width: 80%;
            }

            .ai-message {
                justify-content: flex-start;
            }

            .message-avatar {
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }

            .ai-message .message-content {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 12px 16px 16px 16px;
                border-radius: 18px 18px 18px 4px;
                max-width: 80%;
                margin-bottom: 8px;
            }

            .message-text {
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 4px;
            }

            .message-time {
                font-size: 11px;
                opacity: 0.7;
            }

            .message-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
                opacity: 0; /* hidden by default for less clutter */
                pointer-events: none;
                transition: opacity 0.2s ease;
            }

            .message:hover .message-actions {
                opacity: 1;
                pointer-events: auto;
            }

            .action-btn {
                background: none;
                border: 1px solid #e2e8f0;
                padding: 4px 8px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }

            .action-btn:hover {
                background: #f1f5f9;
            }

            /* Loading Animation */
            .loading .message-content {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 16px;
                border-radius: 18px 18px 18px 4px;
            }

            .loading-animation {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .typing-dots {
                display: flex;
                gap: 4px;
            }

            .typing-dots span {
                width: 8px;
                height: 8px;
                background: #667eea;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }

            .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

            @keyframes typing {
                0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }

            .loading-text {
                font-size: 13px;
                color: #6b7280;
            }

            /* Chat Input */
            .chat-input-container {
                border-top: 1px solid #e2e8f0;
                padding: 16px 20px 20px 20px;
                background: white;
                flex-shrink: 0;
                min-height: auto;
            }

            .input-wrapper {
                position: relative;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                overflow: hidden;
            }

            #user-input {
                width: 100%;
                border: none;
                background: none;
                padding: 12px 16px;
                padding-right: 80px;
                font-size: 14px;
                resize: none;
                outline: none;
                font-family: inherit;
                line-height: 1.5;
                max-height: 160px; /* keep composer compact */
                overflow-y: auto;
            }

            .input-actions {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                gap: 4px;
            }

            .attach-btn, .send-btn {
                background: none;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }

            .attach-btn:hover {
                background: #e2e8f0;
            }

            .send-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .send-btn:hover {
                transform: scale(1.05);
            }

            .send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            /* Quick Suggestions */
            .quick-suggestions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                margin-bottom: 4px;
                flex-wrap: wrap;
                overflow: visible;
                padding-bottom: 4px;
            }

            .suggestion-pill {
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            .suggestion-pill:hover {
                background: #e0e7ff;
                transform: translateY(-1px);
            }
            
            /* Dark mode suggestion pills */
            .algomento-modern-sidebar[data-theme="dark"] .suggestion-pill {
                background: #334155 !important;
                border-color: #475569 !important;
                color: #e5e7eb !important;
            }
            
            .algomento-modern-sidebar[data-theme="dark"] .suggestion-pill:hover {
                background: #475569 !important;
                border-color: #64748b !important;
                color: #f1f5f9 !important;
            }

            /* Follow-up container styles */
            .follow-up-container {
                margin: 8px 0;
                padding: 12px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                border-left: 3px solid #3b82f6;
            }

            .follow-up-header {
                font-size: 12px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }

            .follow-up-options {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-bottom: 8px;
            }

            .follow-up-option {
                background: #ffffff;
                border: 1px solid #d1d5db;
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 11px;
                color: #374151;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
                pointer-events: auto;
                position: relative;
                z-index: 1000;
            }

            .follow-up-option:hover {
                background: #eff6ff;
                border-color: #3b82f6;
                color: #1d4ed8;
            }

            .follow-up-close {
                background: #fee2e2;
                border: 1px solid #fecaca;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                color: #dc2626;
                cursor: pointer;
                transition: all 0.2s;
            }

            .follow-up-close:hover {
                background: #fecaca;
                border-color: #f87171;
            }

            /* Dark theme follow-up styles */
            .algomento-modern-sidebar[data-theme="dark"] .follow-up-container {
                background: #1e293b !important;
                border-color: #334155 !important;
                border-left-color: #3b82f6 !important;
            }

            .algomento-modern-sidebar[data-theme="dark"] .follow-up-header {
                color: #e5e7eb !important;
            }

            .algomento-modern-sidebar[data-theme="dark"] .follow-up-option {
                background: #334155 !important;
                border-color: #475569 !important;
                color: #e5e7eb !important;
            }

            .algomento-modern-sidebar[data-theme="dark"] .follow-up-option:hover {
                background: #475569 !important;
                border-color: #3b82f6 !important;
                color: #60a5fa !important;
            }

            .algomento-modern-sidebar[data-theme="dark"] .follow-up-close {
                background: #450a0a !important;
                border-color: #7f1d1d !important;
                color: #f87171 !important;
            }

            .algomento-modern-sidebar[data-theme="dark"] .follow-up-close:hover {
                background: #7f1d1d !important;
                border-color: #dc2626 !important;
            }

            /* Features Panel */
            .features-panel {
                border-top: 1px solid #e2e8f0;
                background: #fafbfc;
            }

            .panel-header {
                padding: 12px 20px;
                background: #f8fafc;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 13px;
                font-weight: 500;
                color: #374151;
            }

            .panel-header:hover {
                background: #f1f5f9;
            }

            .panel-content {
                max-height: 300px;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }

            .features-panel.collapsed .panel-content {
                max-height: 0;
            }

            .feature-group {
                padding: 16px 20px;
                border-bottom: 1px solid #e2e8f0;
            }

            .feature-group:last-child {
                border-bottom: none;
            }

            .feature-group h5 {
                margin: 0 0 12px 0;
                font-size: 13px;
                font-weight: 600;
                color: #374151;
            }

            .feature-buttons {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .feature-btn.compact {
                background: white;
                border: 1px solid #e2e8f0;
                padding: 10px 12px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 13px;
                transition: all 0.2s ease;
            }

            .feature-btn.compact:hover {
                background: #f8fafc;
                border-color: #c7d2fe;
                transform: translateY(-1px);
            }

            .btn-icon {
                font-size: 16px;
            }

            .btn-text {
                color: #374151;
                font-weight: 500;
            }

            /* Problem Context */
            .problem-context {
                border-top: 1px solid #e2e8f0;
                background: #f8fafc;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .context-header {
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f1f5f9;
                flex-shrink: 0;
            }

            .context-title {
                font-size: 13px;
                font-weight: 500;
                color: #374151;
            }

            .refresh-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background 0.2s ease;
            }

            .refresh-btn:hover {
                background: #e2e8f0;
            }

            .context-content {
                padding: 16px 20px;
                flex: 1;
                overflow-y: auto;
                max-height: calc(100vh - 300px);
            }
            
            .context-section {
                margin-bottom: 20px;
                padding: 12px;
                background: #ffffff;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            
            .context-section h4 {
                margin: 0 0 8px 0;
                font-size: 12px;
                font-weight: 600;
                color: #374151;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .code-preview {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 8px;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                max-height: 120px;
                overflow-y: auto;
            }
            
            .suggestions-list {
                font-size: 12px;
                line-height: 1.4;
            }
            
            .complexity-info {
                font-size: 12px;
                line-height: 1.4;
            }

            .context-placeholder {
                color: #6b7280;
                font-size: 12px;
                text-align: center;
                margin: 0;
                font-style: italic;
            }

            .problem-info {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .problem-title {
                font-size: 13px;
                font-weight: 500;
                color: #374151;
                line-height: 1.4;
            }

            .problem-difficulty {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .problem-difficulty.easy {
                background: #dcfce7;
                color: #166534;
            }

            .problem-difficulty.medium {
                background: #fef3c7;
                color: #92400e;
            }

            .problem-difficulty.hard {
                background: #fecaca;
                color: #991b1b;
            }

            .problem-tags {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }

            .tag {
                background: #e0e7ff;
                color: #3730a3;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
            }

            /* System Message */
            .system-message .message-content {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                color: #92400e;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 13px;
                text-align: center;
            }

            /* Tabs */
            .ai-tabs {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                background: #eef2ff; /* brighter to reduce dim feel */
                border-bottom: 1px solid #e2e8f0;
            }
            .ai-tabs .tab-btn {
                padding: 10px 8px;
                background: transparent;
                border: none;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                color: #374151;
                transition: background 0.2s ease, color 0.2s ease;
            }
            .ai-tabs .tab-btn.active { background: #ffffff; color: #111827; }
            .ai-tabs .tab-btn:hover { background: #f1f5f9; }

            .tab-section { 
                display: none; 
                flex: 1;
                overflow-y: auto;
                min-height: 0;
            }
            .tab-section.active { 
                display: flex;
                flex-direction: column;
            }

            /* Brighten default text and AI bubble */
            .algomento-modern-sidebar { color: #0f172a; }
            .ai-message .message-content { background: #ffffff; border-color: #e5e7eb; }
            .message-text { color: #111827; }

            /* Soften dim look in suggestions */
            .suggestion-pill { background: #eef2ff; border-color: #e0e7ff; }
            .suggestion-pill:hover { background: #e0e7ff; }

            /* Tools panel inside tab: remove extra border top */
            .features-panel { border-top: none; }

            /* Dark theme tab and brightness adjustments */
            .algomento-modern-sidebar[data-theme="dark"] .ai-tabs { background: #0f172a; border-bottom-color: #1f2937; }
            .algomento-modern-sidebar[data-theme="dark"] .ai-tabs .tab-btn { color: #cbd5e1; }
            .algomento-modern-sidebar[data-theme="dark"] .ai-tabs .tab-btn.active { background: #0b1220; color: #e5e7eb; }
            .algomento-modern-sidebar[data-theme="dark"] .suggestion-pill { background: #0f172a; border-color: #1f2937; }

            /* High-contrast tabs */
            .algomento-modern-sidebar[data-theme="contrast"] .ai-tabs { background: #000; border-bottom: 2px solid #fff; }
            .algomento-modern-sidebar[data-theme="contrast"] .ai-tabs .tab-btn { color: #fff; border-left: 2px solid transparent; border-right: 2px solid transparent; }
            .algomento-modern-sidebar[data-theme="contrast"] .ai-tabs .tab-btn.active { background: #000; color: #fff; border-bottom: 2px solid #fff; }

            /* Ensure dark mode applies to all sidebar children */
            .algomento-modern-sidebar[data-theme="dark"],
            .algomento-modern-sidebar[data-theme="dark"] * {
                background-color: inherit !important;
                color: #e5e7eb !important;
                border-color: #1f2937 !important;
            }
            /* Fix tab and bubble backgrounds in dark */
            .algomento-modern-sidebar[data-theme="dark"] .ai-tabs { background: #181f2f !important; }
            .algomento-modern-sidebar[data-theme="dark"] .tab-btn.active { background: #232a3d !important; color: #e5e7eb !important; }
            .algomento-modern-sidebar[data-theme="dark"] .ai-message .message-content { background: #232a3d !important; color: #e5e7eb !important; border-color: #334155 !important; }
            .algomento-modern-sidebar[data-theme="dark"] .user-message .message-content { background: linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%) !important; color: #fff !important; }
            .algomento-modern-sidebar[data-theme="dark"] .suggestion-pill { background: #232a3d !important; color: #e5e7eb !important; border-color: #334155 !important; }
            .algomento-modern-sidebar[data-theme="dark"] .features-panel { background: #181f2f !important; }
            .algomento-modern-sidebar[data-theme="dark"] .problem-context { background: #232a3d !important; }
            .algomento-modern-sidebar[data-theme="dark"] .context-header { background: #181f2f !important; }
            .algomento-modern-sidebar[data-theme="dark"] .context-section { background: #1e293b !important; border-color: #334155 !important; }
            .algomento-modern-sidebar[data-theme="dark"] .context-section h4 { color: #e5e7eb !important; }
            .algomento-modern-sidebar[data-theme="dark"] .code-preview { background: #0f172a !important; border-color: #334155 !important; color: #e5e7eb !important; }
            .algomento-modern-sidebar[data-theme="dark"] .suggestions-list { color: #e5e7eb !important; }
            .algomento-modern-sidebar[data-theme="dark"] .complexity-info { color: #e5e7eb !important; }
            .algomento-modern-sidebar[data-theme="dark"] .context-placeholder { color: #94a3b8 !important; }
            .algomento-modern-sidebar[data-theme="dark"] .tag { background: #334155 !important; color: #c7d2fe !important; }
            .algomento-modern-sidebar[data-theme="dark"] .system-message .message-content { background: #334155 !important; color: #e5e7eb !important; border-color: #6366f1 !important; }
            .algomento-modern-sidebar[data-theme="dark"] .feature-btn.compact { background: #232a3d !important; color: #e5e7eb !important; border-color: #334155 !important; }
            .algomento-modern-sidebar[data-theme="dark"] .panel-header { background: #232a3d !important; color: #e5e7eb !important; }
            .algomento-modern-sidebar[data-theme="dark"] .panel-header:hover { background: #334155 !important; }
            .algomento-modern-sidebar[data-theme="dark"] .refresh-btn:hover { background: #334155 !important; }
            .algomento-modern-sidebar[data-theme="dark"] #user-input { color: #e5e7eb !important; background: #232a3d !important; }
            .algomento-modern-sidebar[data-theme="dark"] #user-input::placeholder { color: #94a3b8 !important; }
            .algomento-modern-sidebar[data-theme="dark"] .input-wrapper { background: #232a3d !important; border-color: #334155 !important; }
            .algomento-modern-sidebar[data-theme="dark"] .chat-input-container { background: #181f2f !important; border-top-color: #334155 !important; }
            
            /* Quiz button styles */
            .quiz-container {
                margin: 12px 0 20px 0;
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding-bottom: 10px;
            }
            
            .quiz-option {
                display: block;
                width: 100%;
                margin: 0;
                padding: 10px 14px;
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                color: #0f172a;
                font-size: 13px;
                font-family: inherit;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            }
            
            .quiz-option:hover {
                background: #e2e8f0;
                border-color: #94a3b8;
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .quiz-option.selected {
                background: #3b82f6;
                border-color: #2563eb;
                color: white;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            }
            
            /* Dark theme quiz buttons - more specific and forceful */
            [data-theme="dark"] .quiz-option,
            .algomento-modern-sidebar[data-theme="dark"] .quiz-option,
            .algomento-modern-sidebar[data-theme="dark"] .quiz-container .quiz-option {
                background: #475569 !important;
                border-color: #64748b !important;
                color: #f8fafc !important;
                font-weight: 500 !important;
            }
            
            [data-theme="dark"] .quiz-option:hover,
            .algomento-modern-sidebar[data-theme="dark"] .quiz-option:hover,
            .algomento-modern-sidebar[data-theme="dark"] .quiz-container .quiz-option:hover {
                background: #64748b !important;
                border-color: #94a3b8 !important;
                color: #ffffff !important;
                font-weight: 500 !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
            }
            
            [data-theme="dark"] .quiz-option.selected,
            .algomento-modern-sidebar[data-theme="dark"] .quiz-option.selected,
            .algomento-modern-sidebar[data-theme="dark"] .quiz-container .quiz-option.selected {
                background: #2563eb !important;
                border-color: #1d4ed8 !important;
                color: #ffffff !important;
                font-weight: 600 !important;
                box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4) !important;
            }
            
            /* Fix main content area dark theme - only for AlgoMento extension */
            .algomento-modern-sidebar[data-theme="dark"] ~ * [data-theme="dark"],
            .algomento-modern-sidebar[data-theme="dark"] ~ .main-content,
            .algomento-modern-sidebar[data-theme="dark"] ~ #content {
                background-color: #0f172a !important;
                color: #e5e7eb !important;
            }
            
            .algomento-modern-sidebar[data-theme="dark"] ~ * .problem-display,
            .algomento-modern-sidebar[data-theme="dark"] ~ * .code-editor,
            .algomento-modern-sidebar[data-theme="dark"] ~ * .output-panel {
                background-color: #1e293b !important;
                color: #e5e7eb !important;
                border-color: #334155 !important;
            }
        `;

        const style = document.createElement('style');
        style.id = 'algomento-modern-css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Global error handling
    window.addEventListener('error', (e) => {
        if (e.message.includes('Non-Error promise rejection captured')) {
            e.preventDefault();
            return false;
        }
    });

    console.log('[AlgoMento] Modern AI Assistant loaded successfully');

})();
