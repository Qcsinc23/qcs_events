// AI Chatbot Widget with OpenAI Integration
class AILChatbot {
    constructor(options = {}) {
        this.config = this.loadConfig();
        this.knowledgeBase = this.loadKnowledgeBase();
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        this.currentConversationId = null;
        this.analytics = this.loadAnalytics();
        this.speechRecognition = null;
        this.speechSynthesis = window.speechSynthesis;
        this.isRecording = false;
        this.leadCaptured = false;
        
        // Initialize Operations Agent
        this.operationsAgent = null;
        this.operationsMode = false;
        this.currentOperation = null;
        
        // Initialize Auto-Engagement System
        this.autoEngagement = null;
        this.engagementEnabled = true;
        this.hasAutoEngaged = false;
        
        this.options = {
            position: 'bottom-right',
            primaryColor: '#2563eb',
            fontSize: '14px',
            autoEngage: true,
            engagementDelay: 3000, // 3 seconds
            showcaseCapabilities: true,
            ...options
        };

        this.init();
        this.bindEvents();
        this.initializeAdvancedFeatures();
        this.initializeOperationsAgent();
        this.initializeAutoEngagement();
    }

    loadConfig() {
        const saved = localStorage.getItem('chatbot_config');
        return saved ? JSON.parse(saved) : {
            apiKey: '',
            model: 'gpt-4o',
            companyName: 'Quiet Craft Solutions Inc.',
            botPersonality: 'Professional and helpful logistics expert specializing in event coordination.',
            maxTokens: 800,
            temperature: 0.7,
            enableVoice: false,
            enableFileUpload: false,
            enableAnalytics: true,
            enableLeadCapture: true
        };
    }

    loadKnowledgeBase() {
        const saved = localStorage.getItem('chatbot_knowledge_base');
        return saved ? JSON.parse(saved) : [];
    }

    loadAnalytics() {
        const saved = localStorage.getItem('chatbot_analytics');
        return saved ? JSON.parse(saved) : {
            totalConversations: 0,
            leadsGenerated: 0,
            avgResponseTime: 0,
            satisfactionRate: 0,
            conversations: [],
            insights: []
        };
    }

    saveAnalytics() {
        localStorage.setItem('chatbot_analytics', JSON.stringify(this.analytics));
    }

    initializeAdvancedFeatures() {
        // Initialize voice recognition if enabled
        if (this.config.enableVoice && 'webkitSpeechRecognition' in window) {
            this.speechRecognition = new webkitSpeechRecognition();
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = 'en-US';
            
            this.speechRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.chatWidget.querySelector('#ai-chatbot-input').value = transcript;
                this.sendMessage();
            };
            
            this.speechRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isRecording = false;
                this.updateVoiceButton();
            };
            
            this.speechRecognition.onend = () => {
                this.isRecording = false;
                this.updateVoiceButton();
            };
        }
    }

    async initializeOperationsAgent() {
        try {
            // Load the Operations Agent script if not already loaded
            if (typeof OperationsAgent === 'undefined') {
                await this.loadOperationsAgentScript();
            }
            
            this.operationsAgent = new OperationsAgent();
            console.log('Operations Agent initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Operations Agent:', error);
        }
    }

    async loadOperationsAgentScript() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="operations-agent.js"]')) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = './operations-agent.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    init() {
        this.createChatWidget();
        this.loadWelcomeMessage();
        
        // Listen for configuration updates
        window.addEventListener('chatbotConfigUpdated', (e) => {
            this.config = e.detail.config;
            this.knowledgeBase = e.detail.knowledgeBase;
        });
    }

    createChatWidget() {
        // Chat Button
        this.chatButton = document.createElement('div');
        this.chatButton.className = 'ai-chatbot-button';
        this.chatButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
                <path d="M7 9H17V11H7V9ZM7 12H17V14H7V12ZM7 6H17V8H7V6Z" fill="white"/>
            </svg>
        `;

        // Chat Widget
        this.chatWidget = document.createElement('div');
        this.chatWidget.className = 'ai-chatbot-widget';
        this.chatWidget.innerHTML = `
            <div class="ai-chatbot-header">
                <div class="ai-chatbot-header-info">
                    <div class="ai-chatbot-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19C3 20.1 3.9 21 5 21H11V19H5V3H13V9H21Z"/>
                        </svg>
                    </div>
                    <div class="ai-chatbot-header-text">
                        <div class="ai-chatbot-title">${this.config.companyName} Assistant</div>
                        <div class="ai-chatbot-status">
                            <span class="ai-chatbot-status-dot"></span>
                            Online
                        </div>
                    </div>
                </div>
                <button class="ai-chatbot-close" type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="ai-chatbot-messages" id="ai-chatbot-messages"></div>
            <div class="ai-chatbot-typing" id="ai-chatbot-typing" style="display: none;">
                <div class="ai-chatbot-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span>AI Assistant is typing...</span>
            </div>
            <div class="ai-chatbot-input-area">
                <div class="ai-chatbot-suggestions" id="ai-chatbot-suggestions">
                    <button class="ai-chatbot-suggestion" data-message="I need a quote for event logistics">Get Quote</button>
                    <button class="ai-chatbot-suggestion" data-message="What services do you offer?">Our Services</button>
                    <button class="ai-chatbot-suggestion" data-message="Do you handle urgent deliveries?">Urgent Delivery</button>
                </div>
                <div class="ai-chatbot-input-container">
                    <button class="ai-chatbot-attachment" type="button" id="ai-chatbot-attachment" style="display: ${this.config.enableFileUpload ? 'flex' : 'none'}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"></path>
                        </svg>
                    </button>
                    <input type="text" class="ai-chatbot-input" placeholder="Type your message..." id="ai-chatbot-input">
                    <button class="ai-chatbot-voice" type="button" id="ai-chatbot-voice" style="display: ${this.config.enableVoice ? 'flex' : 'none'}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="22"></line>
                            <line x1="8" y1="22" x2="16" y2="22"></line>
                        </svg>
                    </button>
                    <button class="ai-chatbot-send" type="button" id="ai-chatbot-send">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22,2 15,22 11,13 2,9"></polygon>
                        </svg>
                    </button>
                </div>
                <input type="file" id="ai-chatbot-file-input" style="display: none;" accept=".pdf,.txt,.doc,.docx,.md,.jpg,.jpeg,.png">
                <div class="ai-chatbot-quick-actions" id="ai-chatbot-quick-actions" style="display: none;">
                    <button class="ai-chatbot-quick-action" data-action="quote">Request Quote</button>
                    <button class="ai-chatbot-quick-action" data-action="emergency">Emergency Service</button>
                    <button class="ai-chatbot-quick-action" data-action="track">Track Shipment</button>
                    <button class="ai-chatbot-quick-action" data-action="contact">Contact Human</button>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();

        // Append to body
        document.body.appendChild(this.chatButton);
        document.body.appendChild(this.chatWidget);
    }

    addStyles() {
        const styles = `
            .ai-chatbot-button {
                position: fixed;
                ${this.options.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${this.options.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, ${this.options.primaryColor}, #1e40af);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
                color: white;
                z-index: 10000;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                animation: pulse 2s infinite;
            }

            .ai-chatbot-button:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 30px rgba(37, 99, 235, 0.4);
            }

            @keyframes pulse {
                0%, 100% { box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3); }
                50% { box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3), 0 0 0 10px rgba(37, 99, 235, 0.1); }
            }

            .ai-chatbot-widget {
                position: fixed;
                ${this.options.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${this.options.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
                width: 380px;
                height: 600px;
                max-width: calc(100vw - 40px);
                max-height: calc(100vh - 120px);
                background: #f8fafc;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                display: none;
                flex-direction: column;
                z-index: 10001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: ${this.options.fontSize};
                overflow: hidden;
                border: 1px solid #e5e7eb;
            }

            .ai-chatbot-widget.open {
                display: flex;
                animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .ai-chatbot-header {
                background: white;
                color: #0f172a;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid #e5e7eb;
            }

            .ai-chatbot-header-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .ai-chatbot-avatar {
                width: 36px;
                height: 36px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }

            .ai-chatbot-title {
                font-weight: 600;
                font-size: 16px;
                line-height: 1.2;
            }

            .ai-chatbot-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                opacity: 0.9;
            }

            .ai-chatbot-status-dot {
                width: 8px;
                height: 8px;
                background: #10b981;
                border-radius: 50%;
                animation: breathe 2s infinite;
            }

            @keyframes breathe {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .ai-chatbot-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background 0.2s;
            }

            .ai-chatbot-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .ai-chatbot-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                background: #f8fafc;
            }

            .ai-chatbot-message {
                display: flex;
                gap: 8px;
                max-width: 85%;
                animation: fadeInUp 0.3s ease;
            }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .ai-chatbot-message.user {
                align-self: flex-end;
                flex-direction: row-reverse;
            }

            .ai-chatbot-message-content {
                background: white;
                padding: 12px 16px;
                border-radius: 18px;
                border: 1px solid #e5e7eb;
                line-height: 1.4;
                word-wrap: break-word;
            }

            .ai-chatbot-message.user .ai-chatbot-message-content {
                background: #2563eb;
                color: white;
                border-color: #2563eb;
            }

            .ai-chatbot-typing {
                padding: 12px 20px;
                display: flex;
                align-items: center;
                gap: 8px;
                background: white;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
            }

            .ai-chatbot-typing-dots {
                display: flex;
                gap: 2px;
            }

            .ai-chatbot-typing-dots span {
                width: 4px;
                height: 4px;
                background: #6b7280;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out both;
            }

            .ai-chatbot-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .ai-chatbot-typing-dots span:nth-child(2) { animation-delay: -0.16s; }

            @keyframes typing {
                0%, 80%, 100% { opacity: 0.3; }
                40% { opacity: 1; }
            }

            .ai-chatbot-input-area {
                border-top: 1px solid #e5e7eb;
                background: white;
            }

            .ai-chatbot-suggestions {
                padding: 12px 16px;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                background: #f8fafc;
                border-bottom: 1px solid #e5e7eb;
            }

            .ai-chatbot-suggestion {
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 16px;
                padding: 6px 12px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                color: #374151;
            }

            .ai-chatbot-suggestion:hover {
                background: ${this.options.primaryColor};
                color: white;
                border-color: ${this.options.primaryColor};
            }

            .ai-chatbot-input-container {
                display: flex;
                align-items: center;
                padding: 16px;
                gap: 8px;
            }

            .ai-chatbot-attachment,
            .ai-chatbot-voice {
                background: #f3f4f6;
                border: none;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                color: #6b7280;
            }

            .ai-chatbot-attachment:hover,
            .ai-chatbot-voice:hover {
                background: #e5e7eb;
                color: ${this.options.primaryColor};
            }

            .ai-chatbot-voice.recording {
                background: #ef4444;
                color: white;
                animation: pulse 1s infinite;
            }

            .ai-chatbot-quick-actions {
                padding: 12px 16px;
                background: #f8fafc;
                border-top: 1px solid #e5e7eb;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .ai-chatbot-quick-action {
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 16px;
                padding: 6px 12px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                color: #374151;
            }

            .ai-chatbot-quick-action:hover {
                background: ${this.options.primaryColor};
                color: white;
                border-color: ${this.options.primaryColor};
            }

            .ai-chatbot-message-feedback {
                display: flex;
                gap: 4px;
                margin-top: 8px;
                justify-content: flex-end;
            }

            .ai-chatbot-feedback-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s;
                opacity: 0.5;
            }

            .ai-chatbot-feedback-btn:hover {
                opacity: 1;
                background: #f3f4f6;
            }

            .ai-chatbot-feedback-btn.selected {
                opacity: 1;
                background: ${this.options.primaryColor};
                color: white;
            }

            .ai-chatbot-file-preview {
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
            }

            .ai-chatbot-file-preview button {
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 10px;
            }

            .ai-chatbot-input {
                flex: 1;
                border: 1px solid #d1d5db;
                border-radius: 20px;
                padding: 10px 16px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }

            .ai-chatbot-input:focus {
                border-color: ${this.options.primaryColor};
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }

            .ai-chatbot-send {
                background: ${this.options.primaryColor};
                border: none;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                color: white;
            }

            .ai-chatbot-send:hover {
                background: #1e40af;
                transform: scale(1.05);
            }

            .ai-chatbot-send:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            @media (max-width: 480px) {
                .ai-chatbot-widget {
                    width: calc(100vw - 20px);
                    height: calc(100vh - 100px);
                    right: 10px;
                    bottom: 80px;
                }
            }
        `;

        if (!document.getElementById('ai-chatbot-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'ai-chatbot-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }

    bindEvents() {
        // Chat button click
        this.chatButton.addEventListener('click', () => {
            this.toggleChat();
        });

        // Close button click
        this.chatWidget.querySelector('.ai-chatbot-close').addEventListener('click', () => {
            this.closeChat();
        });

        // Send button click
        this.chatWidget.querySelector('#ai-chatbot-send').addEventListener('click', () => {
            this.sendMessage();
        });

        // Input enter key
        this.chatWidget.querySelector('#ai-chatbot-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Suggestion clicks
        this.chatWidget.addEventListener('click', (e) => {
            if (e.target.classList.contains('ai-chatbot-suggestion')) {
                const message = e.target.getAttribute('data-message');
                this.addMessage(message, 'user');
                this.processMessage(message);
                this.hideSuggestions();
            }
            
            // Quick action clicks
            if (e.target.classList.contains('ai-chatbot-quick-action')) {
                const action = e.target.getAttribute('data-action');
                this.handleQuickAction(action);
            }
            
            // Feedback clicks
            if (e.target.classList.contains('ai-chatbot-feedback-btn')) {
                this.handleFeedback(e.target);
            }
        });

        // Voice button click
        if (this.config.enableVoice) {
            this.chatWidget.querySelector('#ai-chatbot-voice').addEventListener('click', () => {
                this.toggleVoiceRecording();
            });
        }

        // Attachment button click
        if (this.config.enableFileUpload) {
            this.chatWidget.querySelector('#ai-chatbot-attachment').addEventListener('click', () => {
                this.chatWidget.querySelector('#ai-chatbot-file-input').click();
            });
            
            // File input change
            this.chatWidget.querySelector('#ai-chatbot-file-input').addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files[0]);
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.chatWidget.contains(e.target) && !this.chatButton.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        this.chatWidget.classList.add('open');
        this.chatButton.style.transform = 'scale(0.8)';
        
        // Start new conversation tracking
        if (this.config.enableAnalytics && !this.currentConversationId) {
            this.currentConversationId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            this.analytics.totalConversations++;
            this.saveAnalytics();
        }
        
        // Focus input
        setTimeout(() => {
            this.chatWidget.querySelector('#ai-chatbot-input').focus();
        }, 300);
    }

    closeChat() {
        this.isOpen = false;
        this.chatWidget.classList.remove('open');
        this.chatButton.style.transform = 'scale(1)';
    }

    loadWelcomeMessage() {
        const path = window.location.pathname;
        let welcomeMessage = `Hello! I'm the ${this.config.companyName} AI assistant. I can help you with event logistics questions, quotes, and information about our services. How can I assist you today?`;

        if (path.includes('services')) {
            welcomeMessage = `Hello! I see you're interested in our services. I can help you with any questions you have about our event logistics solutions. What can I help you with?`;
        } else if (path.includes('quote')) {
            welcomeMessage = `Hello! It looks like you're interested in a quote. I can help you with that. What kind of services are you looking for?`;
        }

        this.addMessage(welcomeMessage, 'bot');
    }

    addMessage(content, sender, options = {}) {
        const messagesContainer = this.chatWidget.querySelector('#ai-chatbot-messages');
        const messageEl = document.createElement('div');
        messageEl.className = `ai-chatbot-message ${sender}`;
        messageEl.setAttribute('data-message-id', Date.now() + '-' + Math.random().toString(36).substr(2, 9));
        
        let messageContent = `
            <div class="ai-chatbot-message-content">
                ${content}
            </div>
        `;

        // Add feedback buttons for bot messages
        if (sender === 'bot' && this.config.enableAnalytics) {
            messageContent += `
                <div class="ai-chatbot-message-feedback">
                    <button class="ai-chatbot-feedback-btn" data-feedback="positive" title="Helpful">
                        👍
                    </button>
                    <button class="ai-chatbot-feedback-btn" data-feedback="negative" title="Not helpful">
                        👎
                    </button>
                </div>
            `;
        }

        messageEl.innerHTML = messageContent;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        const messageData = { 
            content, 
            sender, 
            timestamp: new Date(),
            conversationId: this.currentConversationId,
            ...options
        };
        
        this.messages.push(messageData);

        // Speak the message if voice is enabled and it's a bot message
        if (sender === 'bot' && this.config.enableVoice && this.speechSynthesis) {
            this.speakMessage(content);
        }
    }

    async sendMessage() {
        const input = this.chatWidget.querySelector('#ai-chatbot-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Clear input and disable send button
        input.value = '';
        this.chatWidget.querySelector('#ai-chatbot-send').disabled = true;

        // Add user message
        this.addMessage(message, 'user');
        this.hideSuggestions();

        // Process message
        await this.processMessage(message);

        // Re-enable send button
        this.chatWidget.querySelector('#ai-chatbot-send').disabled = false;
    }

    async processMessage(message) {
        this.showTyping();

        try {
            // Check if this is an operations-related message
            const operationsResponse = await this.checkOperationsIntent(message);
            
            if (operationsResponse.isOperational) {
                // Handle with Operations Agent
                await this.handleOperationsMessage(message);
                this.hideTyping();
                // The `addMessage` call is now handled within `handleOperationsMessage`
                this.updateOperationsUI(operationsResponse);
            } else {
                // Handle with regular AI
                const response = await this.getAIResponse(message);
                this.hideTyping();
                this.addMessage(response, 'bot');
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('I apologize, but I\'m having trouble connecting right now. Please try again later or call us directly at (973) 415-9532.', 'bot');
            console.error('Chatbot error:', error);
        }
    }

    async checkOperationsIntent(message) {
        if (!this.operationsAgent) {
            return { isOperational: false };
        }

        const lowerMessage = message.toLowerCase();
        
        // Operations trigger words and phrases
        const operationsTriggers = [
            'schedule', 'book', 'create event', 'arrange', 'logistics',
            'delivery', 'pickup', 'venue setup', 'equipment transport',
            'trade show', 'emergency service', 'consultation',
            'reschedule', 'cancel', 'modify', 'update event',
            'view events', 'my bookings', 'upcoming events',
            'yes create', 'confirm booking', 'proceed'
        ];
        
        const isOperational = operationsTriggers.some(trigger => lowerMessage.includes(trigger)) ||
                             this.operationsAgent.conversationState !== 'idle' ||
                             this.operationsMode;
        
        return {
            isOperational,
            conversationState: this.operationsAgent?.conversationState || 'idle',
            currentOperation: this.operationsAgent?.currentEventDraft?.type || null
        };
    }


    updateOperationsUI(context) {
        // Show operations-specific quick actions
        if (context.isOperational) {
            this.showOperationsQuickActions(context);
        } else {
            this.hideOperationsQuickActions();
        }
        
        // Update input placeholder based on context
        this.updateInputPlaceholder(context);
    }

    showOperationsQuickActions(context) {
        const quickActionsContainer = this.chatWidget.querySelector('#ai-chatbot-quick-actions');
        
        if (context.conversationState === 'collecting') {
            // Show helpful quick actions during information collection
            quickActionsContainer.innerHTML = `
                <button class="ai-chatbot-quick-action" data-action="operations-help">Need Help?</button>
                <button class="ai-chatbot-quick-action" data-action="operations-start-over">Start Over</button>
                <button class="ai-chatbot-quick-action" data-action="operations-speak-human">Speak to Human</button>
            `;
        } else if (context.conversationState === 'confirming') {
            // Show confirmation actions
            quickActionsContainer.innerHTML = `
                <button class="ai-chatbot-quick-action operations-confirm" data-action="operations-confirm">✅ Confirm Booking</button>
                <button class="ai-chatbot-quick-action operations-cancel" data-action="operations-cancel">❌ Make Changes</button>
            `;
        } else {
            // Show general operations actions
            quickActionsContainer.innerHTML = `
                <button class="ai-chatbot-quick-action" data-action="book-delivery">📦 Book Delivery</button>
                <button class="ai-chatbot-quick-action" data-action="venue-setup">🏢 Venue Setup</button>
                <button class="ai-chatbot-quick-action" data-action="emergency">🚨 Emergency Service</button>
                <button class="ai-chatbot-quick-action" data-action="view-bookings">📅 View My Bookings</button>
            `;
        }
        
        quickActionsContainer.style.display = 'flex';
    }

    hideOperationsQuickActions() {
        // Revert to standard quick actions
        const quickActionsContainer = this.chatWidget.querySelector('#ai-chatbot-quick-actions');
        quickActionsContainer.innerHTML = `
            <button class="ai-chatbot-quick-action" data-action="quote">Request Quote</button>
            <button class="ai-chatbot-quick-action" data-action="emergency">Emergency Service</button>
            <button class="ai-chatbot-quick-action" data-action="track">Track Shipment</button>
            <button class="ai-chatbot-quick-action" data-action="contact">Contact Human</button>
        `;
        quickActionsContainer.style.display = 'none';
    }

    updateInputPlaceholder(context) {
        const input = this.chatWidget.querySelector('#ai-chatbot-input');
        
        if (context.conversationState === 'collecting') {
            input.placeholder = "Please provide the requested information...";
        } else if (context.conversationState === 'confirming') {
            input.placeholder = "Type 'yes' to confirm or 'no' to make changes...";
        } else if (context.isOperational) {
            input.placeholder = "Describe your logistics needs...";
        } else {
            input.placeholder = "Type your message...";
        }
    }

    async getAIResponse(message) {
        if (!this.config.apiKey) {
            return 'I need to be configured with an API key to provide responses. Please contact our team directly at (973) 415-9532 for immediate assistance.';
        }

        // Track response time
        const startTime = Date.now();

        // Prepare context from knowledge base
        const context = this.prepareContext(message);

        const systemPrompt = `You are an AI assistant for ${this.config.companyName}, a professional event logistics company. 

Your personality: ${this.config.botPersonality}

Company Information:
- Specializes in event logistics and time-critical deliveries
- Services: Event logistics, venue coordination, high-value goods handling, on-site support, temporary storage, dedicated fleet, 24/7 emergency support
- Phone: (973) 415-9532
- Location: 165 Passaic Ave #203, Fairfield, NJ 07004
- Target clients: Event managers, conference organizers, festival organizers, corporate event planners

Knowledge Base Context:
${context}

Guidelines:
1. Always be professional, helpful, and solution-oriented
2. Focus on event logistics expertise
3. Offer to provide quotes or connect with human specialists for complex requests
4. If you don't know something, be honest and offer to connect them with a human expert
5. Keep responses concise but informative
6. Always include relevant contact information when appropriate
7. If the user provides contact information, acknowledge it and offer to have someone contact them`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...this.messages.slice(-5).map(msg => ({
                            role: msg.sender === 'user' ? 'user' : 'assistant',
                            content: msg.content
                        })),
                        { role: 'user', content: message }
                    ],
                    max_tokens: this.config.maxTokens || 800,
                    temperature: this.config.temperature || 0.7,
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // Track analytics
            if (this.config.enableAnalytics) {
                const responseTime = (Date.now() - startTime) / 1000;
                this.updateResponseTimeAnalytics(responseTime);
                
                // Store conversation
                this.analytics.conversations.push({
                    conversationId: this.currentConversationId,
                    userMessage: message,
                    botResponse: aiResponse,
                    timestamp: new Date().toISOString(),
                    responseTime: responseTime,
                    model: this.config.model,
                    leadCaptured: this.detectLeadCapture(message)
                });
                
                this.saveAnalytics();
            }

            // Check for lead capture
            if (this.config.enableLeadCapture && this.detectLeadCapture(message)) {
                this.handleLeadCapture(message);
            }

            return aiResponse;

        } catch (error) {
            console.error('OpenAI API Error:', error);
            
            // Fallback response
            return this.getFallbackResponse(message);
        }
    }

    prepareContext(message) {
        if (this.knowledgeBase.length === 0) {
            return 'No additional company documents available.';
        }

        // Simple keyword matching for relevant documents
        const relevantDocs = this.knowledgeBase.filter(doc => {
            const messageWords = message.toLowerCase().split(' ');
            const docContent = doc.content.toLowerCase();
            return messageWords.some(word => word.length > 3 && docContent.includes(word));
        });

        if (relevantDocs.length === 0) {
            return this.knowledgeBase.slice(0, 2).map(doc => 
                `${doc.name}: ${doc.content.substring(0, 300)}...`
            ).join('\n\n');
        }

        return relevantDocs.slice(0, 3).map(doc => 
            `${doc.name}: ${doc.content.substring(0, 400)}...`
        ).join('\n\n');
    }

    getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('quote') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
            return 'I\'d be happy to help you get a quote! For accurate pricing, I\'ll need some details about your event logistics needs. You can fill out our quote form on this page, or call us directly at (973) 415-9532 for immediate assistance.';
        }
        
        if (lowerMessage.includes('service') || lowerMessage.includes('what do you')) {
            return 'We specialize in event logistics with services including:\n\n• Time-critical deliveries\n• High-value goods handling\n• Venue coordination\n• On-site support\n• Temporary storage\n• 24/7 emergency support\n\nWould you like to know more about any specific service?';
        }
        
        if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('rush')) {
            return 'Yes! We offer 24/7 emergency support and same-day rush deliveries. Our emergency response team is always ready to handle last-minute changes and critical situations. Call us immediately at (973) 415-9532 for urgent requests.';
        }
        
        return 'Thank you for your question! I\'m here to help with event logistics information. For detailed assistance, please call us at (973) 415-9532 or use our quote form. Our team is ready to help with your specific needs.';
    }

    showTyping() {
        this.isTyping = true;
        this.chatWidget.querySelector('#ai-chatbot-typing').style.display = 'flex';
    }

    hideTyping() {
        this.isTyping = false;
        this.chatWidget.querySelector('#ai-chatbot-typing').style.display = 'none';
    }

    hideSuggestions() {
        this.chatWidget.querySelector('#ai-chatbot-suggestions').style.display = 'none';
    }

    showSuggestions() {
        this.chatWidget.querySelector('#ai-chatbot-suggestions').style.display = 'flex';
    }

    // Advanced Features Methods

    toggleVoiceRecording() {
        if (!this.speechRecognition) return;

        if (this.isRecording) {
            this.speechRecognition.stop();
        } else {
            this.speechRecognition.start();
            this.isRecording = true;
            this.updateVoiceButton();
        }
    }

    updateVoiceButton() {
        const voiceBtn = this.chatWidget.querySelector('#ai-chatbot-voice');
        if (voiceBtn) {
            voiceBtn.classList.toggle('recording', this.isRecording);
        }
    }

    speakMessage(text) {
        if (!this.speechSynthesis) return;

        // Clean text for speech
        const cleanText = text.replace(/[*_~`]/g, '').replace(/\n/g, ' ');
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        this.speechSynthesis.speak(utterance);
    }

    handleFileUpload(file) {
        if (!file) return;

        // Show file preview
        this.showFilePreview(file);

        // Process file if it's a text file
        if (file.type.startsWith('text/') || file.name.endsWith('.md')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                this.addMessage(`📎 Uploaded file: ${file.name}`, 'user');
                this.processMessage(`I'm sharing a file with you: ${file.name}\n\nContent: ${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}`);
            };
            reader.readAsText(file);
        } else if (file.type.startsWith('image/')) {
            // Handle image upload (if using GPT-4o with vision)
            this.addMessage(`📷 Uploaded image: ${file.name}`, 'user');
            this.processMessage(`I've uploaded an image: ${file.name}. Can you help me with questions about this image?`);
        } else {
            this.addMessage(`📎 Uploaded file: ${file.name}`, 'user');
            this.processMessage(`I've uploaded a file: ${file.name}. Can you help me with questions about this document?`);
        }
    }

    showFilePreview(file) {
        const inputContainer = this.chatWidget.querySelector('.ai-chatbot-input-container');
        
        // Remove existing preview
        const existingPreview = this.chatWidget.querySelector('.ai-chatbot-file-preview');
        if (existingPreview) {
            existingPreview.remove();
        }

        const preview = document.createElement('div');
        preview.className = 'ai-chatbot-file-preview';
        preview.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            <span>${file.name} (${this.formatFileSize(file.size)})</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        inputContainer.parentNode.insertBefore(preview, inputContainer);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handleQuickAction(action) {
        const quickActions = {
            'quote': 'I need a quote for event logistics services. Can you help me get started?',
            'emergency': 'I have an emergency logistics situation. I need immediate assistance.',
            'track': 'I need to track a shipment. Can you help me with tracking information?',
            'contact': 'I would like to speak with a human representative. Can you connect me?',
            
            // Operations-specific actions
            'book-delivery': 'I need to schedule a logistics delivery service.',
            'venue-setup': 'I need venue setup services for an event.',
            'emergency': 'I have an emergency logistics situation that needs immediate attention.',
            'view-bookings': 'I would like to view my current bookings and scheduled events.',
            'operations-help': 'I need help with the booking process. Can you guide me?',
            'operations-start-over': 'I want to start the booking process over from the beginning.',
            'operations-speak-human': 'I would like to speak with a human operations specialist.',
            'operations-confirm': 'Yes, please confirm and create this booking.',
            'operations-cancel': 'No, I want to make changes to this booking.'
        };

        const message = quickActions[action];
        if (message) {
            this.addMessage(message, 'user');
            this.processMessage(message);
            
            // Handle special operations actions
            if (action === 'operations-start-over' && this.operationsAgent) {
                this.operationsAgent.currentEventDraft = null;
                this.operationsAgent.conversationState = 'idle';
                this.operationsMode = false;
            }
            
            this.hideQuickActions();
        }
    }

    hideQuickActions() {
        this.chatWidget.querySelector('#ai-chatbot-quick-actions').style.display = 'none';
    }

    showQuickActions() {
        this.chatWidget.querySelector('#ai-chatbot-quick-actions').style.display = 'flex';
    }

    handleFeedback(button) {
        const feedback = button.getAttribute('data-feedback');
        const messageEl = button.closest('.ai-chatbot-message');
        const messageId = messageEl.getAttribute('data-message-id');

        // Update button states
        const feedbackBtns = messageEl.querySelectorAll('.ai-chatbot-feedback-btn');
        feedbackBtns.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');

        // Track feedback
        if (this.config.enableAnalytics) {
            this.trackFeedback(messageId, feedback);
        }

        // Show thank you message
        this.showTemporaryMessage('Thank you for your feedback!');
    }

    trackFeedback(messageId, feedback) {
        // Find the conversation and update feedback
        const conversation = this.analytics.conversations.find(conv => 
            conv.timestamp && new Date(conv.timestamp).getTime().toString().includes(messageId.split('-')[0])
        );
        
        if (conversation) {
            conversation.satisfaction = feedback === 'positive' ? 5 : 1;
        }

        // Update satisfaction rate
        const conversations = this.analytics.conversations.filter(conv => conv.satisfaction);
        if (conversations.length > 0) {
            const avgSatisfaction = conversations.reduce((sum, conv) => sum + conv.satisfaction, 0) / conversations.length;
            this.analytics.satisfactionRate = Math.round((avgSatisfaction / 5) * 100);
        }

        this.saveAnalytics();
    }

    showTemporaryMessage(text) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10002;
            font-size: 14px;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = text;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    detectLeadCapture(message) {
        const leadIndicators = [
            'phone', 'email', 'contact', 'call me', 'reach out',
            'quote', 'price', 'cost', 'interested', 'need help',
            '@', 'phone number', 'telephone', 'mobile'
        ];
        
        return leadIndicators.some(indicator => 
            message.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    handleLeadCapture(message) {
        if (this.leadCaptured) return;

        this.leadCaptured = true;
        this.analytics.leadsGenerated++;
        this.saveAnalytics();

        // Show lead capture confirmation
        setTimeout(() => {
            this.addMessage('Great! I\'ve noted your interest. A member of our team will follow up with you soon. Is there anything else I can help you with right now?', 'bot');
        }, 1000);
    }

    updateResponseTimeAnalytics(responseTime) {
        const conversations = this.analytics.conversations || [];
        if (conversations.length > 0) {
            const totalTime = conversations.reduce((sum, conv) => sum + (conv.responseTime || 0), 0);
            this.analytics.avgResponseTime = Math.round(totalTime / conversations.length * 10) / 10;
        }
    }

    initializeAutoEngagement() {
        // Initialize Auto-Engagement System if enabled
        if (this.options.autoEngage && typeof AutoEngagementSystem !== 'undefined') {
            setTimeout(() => {
                this.autoEngagement = new AutoEngagementSystem(this);
                console.log('🚀 Auto-Engagement System initialized successfully');
                
                // Emit event for engagement system
                window.dispatchEvent(new CustomEvent('chatbotReady', {
                    detail: { 
                        chatbot: this,
                        autoEngagement: this.autoEngagement,
                        capabilities: this.operationsAgent ? this.operationsAgent.aiCapabilities : null
                    }
                }));
            }, this.options.engagementDelay);
        } else {
            console.warn('⚠️ Auto-Engagement System disabled or not available');
        }
    }

    // Enhanced message handling with backend integration
    async handleOperationsMessage(message) {
        try {
            // Use backend API if available, fallback to local operations agent
            if (window.backendAPI) {
                const response = await window.backendAPI.sendChatMessage(message, {
                    conversationId: this.conversationId,
                    userId: this.userId,
                    sessionId: this.sessionId,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                });
                
                if (response.success) {
                    // Handle backend response
                    this.addMessage(response.message, 'bot');
                    
                    if (response.suggestions && response.suggestions.length > 0) {
                        this.showSuggestions(response.suggestions);
                    }
                    
                    if (response.actions && response.actions.length > 0) {
                        this.updateQuickActions(response.actions);
                    }
                    
                    // Store conversation ID for future messages
                    this.conversationId = response.conversationId;
                    
                    // Track successful interaction
                    window.backendAPI.trackUserInteraction('chat_message', 'chatbot', {
                        intent: response.intent,
                        confidence: response.confidence,
                        messageLength: message.length
                    });
                    
                    return response;
                } else {
                    throw new Error(response.message || 'Backend chat failed');
                }
            } else if (this.operationsAgent) {
                // Fallback to local operations agent
                const response = await this.operationsAgent.processOperationsMessage(message, {
                    userId: this.userId,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString()
                });
                
                // Handle local response
                if (response.message) {
                    this.addMessage(response.message, 'bot');
                }
                
                if (response.quickActions) {
                    this.updateQuickActions(response.quickActions);
                }
                
                if (response.suggestions) {
                    this.showSuggestions(response.suggestions);
                }
                
                return response;
            } else {
                throw new Error('No chat service available');
            }
        } catch (error) {
            console.error('Chat message error:', error);
            
            // Provide helpful error message based on error type
            let errorMessage = 'I apologize, but I encountered an issue processing your request.';
            
            if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
                errorMessage = 'I\'m having trouble connecting to our servers. Please check your internet connection and try again.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'The request is taking longer than expected. Please try again with a shorter message.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'You\'re sending messages too quickly. Please wait a moment and try again.';
            }
            
            this.addMessage(errorMessage + ' You can also call us at (973) 415-9532 for immediate assistance.', 'bot');
            
            // Track error for analytics
            if (window.backendAPI) {
                window.backendAPI.trackUserInteraction('chat_error', 'chatbot', {
                    error: error.message,
                    messageLength: message.length
                });
            }
            
            return { success: false, error: error.message };
        }
        
        // Emit interaction event for auto-engagement
        window.dispatchEvent(new CustomEvent('chatbotInteraction', {
            detail: {
                action: 'chat_message',
                type: 'user_interaction',
                success: true
            }
        }));
    }

    updateQuickActions(actions) {
        const quickActionsContainer = this.chatWidget.querySelector('#ai-chatbot-quick-actions');
        if (quickActionsContainer && actions && actions.length > 0) {
            quickActionsContainer.innerHTML = actions.map(action => 
                `<button class="ai-chatbot-quick-action hover-lift" data-action="${action.action}">${action.text}</button>`
            ).join('');
            quickActionsContainer.style.display = 'flex';
        }
    }

    showSuggestions(suggestions) {
        const suggestionsContainer = this.chatWidget.querySelector('.ai-chatbot-suggestions');
        if (suggestionsContainer && suggestions && suggestions.length > 0) {
            suggestionsContainer.innerHTML = suggestions.map(suggestion => 
                `<button class="ai-chatbot-suggestion" data-suggestion="${suggestion.action}">${suggestion.text}</button>`
            ).join('');
            suggestionsContainer.style.display = 'flex';
        }
    }

    // Enhanced analytics for auto-engagement
    trackEngagementEvent(event, data = {}) {
        if (!this.analytics.engagement) {
            this.analytics.engagement = {
                autoEngagements: 0,
                manualEngagements: 0,
                conversionRate: 0,
                averageTimeToEngage: 0
            };
        }
        
        this.analytics.engagement[event] = (this.analytics.engagement[event] || 0) + 1;
        this.analytics.engagement.lastEvent = {
            type: event,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        this.saveAnalytics();
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not in admin mode
    if (!window.location.pathname.includes('/chatbot/')) {
        window.aiChatbot = new AILChatbot();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AILChatbot;
}
