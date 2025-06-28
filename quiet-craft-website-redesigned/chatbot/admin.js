// Chatbot Admin Interface
class ChatbotAdmin {
    constructor() {
        this.config = this.loadConfig();
        this.knowledgeBase = this.loadKnowledgeBase();
        this.initializeEventListeners();
        this.renderKnowledgeBase();
        this.loadConfigForm();
        this.updateAnalytics();
    }

    initializeEventListeners() {
        // Configuration form
        document.getElementById('configForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConfiguration();
        });

        // File upload
        const fileUpload = document.getElementById('fileUpload');
        const fileInput = document.getElementById('fileInput');

        fileUpload.addEventListener('click', () => fileInput.click());
        fileUpload.addEventListener('dragover', this.handleDragOver.bind(this));
        fileUpload.addEventListener('drop', this.handleFileDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    loadConfig() {
        const saved = localStorage.getItem('chatbot_config');
        return saved ? JSON.parse(saved) : {
            apiKey: '',
            model: 'gpt-4o',
            companyName: 'Quiet Craft Solutions Inc.',
            botPersonality: 'Professional and helpful logistics expert specializing in event coordination. Provide accurate information about our services, pricing, and capabilities. Always maintain a professional tone while being friendly and solution-oriented.',
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

    loadConfigForm() {
        document.getElementById('apiKey').value = this.config.apiKey;
        document.getElementById('model').value = this.config.model;
        document.getElementById('companyName').value = this.config.companyName;
        document.getElementById('botPersonality').value = this.config.botPersonality;
        document.getElementById('maxTokens').value = this.config.maxTokens;
        document.getElementById('temperature').value = this.config.temperature;
        document.getElementById('enableVoice').checked = this.config.enableVoice;
        document.getElementById('enableFileUpload').checked = this.config.enableFileUpload;
        document.getElementById('enableAnalytics').checked = this.config.enableAnalytics;
        document.getElementById('enableLeadCapture').checked = this.config.enableLeadCapture;
        
        // Update display values
        document.getElementById('tokenValue').textContent = this.config.maxTokens;
        document.getElementById('tempValue').textContent = this.config.temperature;
    }

    saveConfiguration() {
        this.config = {
            apiKey: document.getElementById('apiKey').value,
            model: document.getElementById('model').value,
            companyName: document.getElementById('companyName').value,
            botPersonality: document.getElementById('botPersonality').value,
            maxTokens: parseInt(document.getElementById('maxTokens').value),
            temperature: parseFloat(document.getElementById('temperature').value),
            enableVoice: document.getElementById('enableVoice').checked,
            enableFileUpload: document.getElementById('enableFileUpload').checked,
            enableAnalytics: document.getElementById('enableAnalytics').checked,
            enableLeadCapture: document.getElementById('enableLeadCapture').checked
        };

        localStorage.setItem('chatbot_config', JSON.stringify(this.config));
        
        this.showStatus('configStatus', 'Configuration saved successfully! Advanced features enabled.', 'success');
        
        // Update the main chatbot configuration
        this.updateMainChatbot();
        
        // Update analytics display
        this.updateAnalytics();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    async processFiles(files) {
        for (const file of files) {
            if (this.isValidFileType(file)) {
                await this.addToKnowledgeBase(file);
            } else {
                this.showStatus('kbStatus', `Invalid file type: ${file.name}`, 'error');
            }
        }
    }

    isValidFileType(file) {
        const validTypes = [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/markdown'
        ];
        return validTypes.includes(file.type) || file.name.endsWith('.md');
    }

    async addToKnowledgeBase(file) {
        try {
            const content = await this.extractFileContent(file);
            
            const kbItem = {
                id: Date.now() + Math.random(),
                name: file.name,
                type: file.type,
                size: file.size,
                content: content,
                uploadDate: new Date().toISOString()
            };

            this.knowledgeBase.push(kbItem);
            localStorage.setItem('chatbot_knowledge_base', JSON.stringify(this.knowledgeBase));
            
            this.renderKnowledgeBase();
            this.showStatus('kbStatus', `Added ${file.name} to knowledge base`, 'success');
            
            // Update the main chatbot knowledge base
            this.updateMainChatbot();
            
        } catch (error) {
            this.showStatus('kbStatus', `Failed to process ${file.name}: ${error.message}`, 'error');
        }
    }

    async extractFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    let content = e.target.result;
                    
                    // For text files, return as-is
                    if (file.type === 'text/plain' || file.name.endsWith('.md')) {
                        resolve(content);
                        return;
                    }
                    
                    // For other file types, we'll store the content and let the chatbot handle it
                    // In a real implementation, you'd want to use proper file parsers
                    resolve(content);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            
            if (file.type === 'text/plain' || file.name.endsWith('.md')) {
                reader.readAsText(file);
            } else {
                reader.readAsText(file); // Simplified for demo
            }
        });
    }

    renderKnowledgeBase() {
        const kbList = document.getElementById('kbList');
        
        if (this.knowledgeBase.length === 0) {
            kbList.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #6b7280;">
                    No knowledge base files uploaded yet
                </div>
            `;
            return;
        }

        kbList.innerHTML = this.knowledgeBase.map(item => `
            <div class="kb-item">
                <div class="kb-item-info">
                    <div class="kb-item-name">${item.name}</div>
                    <div class="kb-item-size">${this.formatFileSize(item.size)} • ${new Date(item.uploadDate).toLocaleDateString()}</div>
                </div>
                <button class="btn btn-small" onclick="chatbotAdmin.removeFromKnowledgeBase('${item.id}')" style="background: #ef4444;">
                    Remove
                </button>
            </div>
        `).join('');
    }

    removeFromKnowledgeBase(id) {
        this.knowledgeBase = this.knowledgeBase.filter(item => item.id != id);
        localStorage.setItem('chatbot_knowledge_base', JSON.stringify(this.knowledgeBase));
        this.renderKnowledgeBase();
        this.updateMainChatbot();
        this.showStatus('kbStatus', 'File removed from knowledge base', 'success');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showStatus(elementId, message, type) {
        const statusEl = document.getElementById(elementId);
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
        statusEl.style.display = 'block';
        
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }

    updateMainChatbot() {
        // This will update the main chatbot with the new configuration
        const event = new CustomEvent('chatbotConfigUpdated', {
            detail: {
                config: this.config,
                knowledgeBase: this.knowledgeBase
            }
        });
        window.dispatchEvent(event);
    }

    async testChatbot() {
        if (!this.config.apiKey) {
            this.showStatus('configStatus', 'Please set your OpenAI API key first', 'error');
            return;
        }

        // Create a test window or redirect to the main site
        const testMessage = 'Hello! I need help with event logistics for a trade show next month.';
        
        try {
            const response = await this.simulateChatbotResponse(testMessage);
            alert(`Test successful with ${this.config.model}!\n\nUser: ${testMessage}\n\nChatbot: ${response}`);
        } catch (error) {
            this.showStatus('configStatus', `Test failed: ${error.message}`, 'error');
        }
    }

    updateAnalytics() {
        const analytics = this.loadAnalytics();
        document.getElementById('totalConversations').textContent = analytics.totalConversations || 0;
        document.getElementById('leadsGenerated').textContent = analytics.leadsGenerated || 0;
        document.getElementById('avgResponseTime').textContent = (analytics.avgResponseTime || 0) + 's';
        document.getElementById('satisfactionRate').textContent = (analytics.satisfactionRate || 0) + '%';
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

    saveAnalytics(analytics) {
        localStorage.setItem('chatbot_analytics', JSON.stringify(analytics));
        this.updateAnalytics();
    }

    exportConversations() {
        const analytics = this.loadAnalytics();
        const conversations = analytics.conversations || [];
        
        if (conversations.length === 0) {
            this.showStatus('configStatus', 'No conversations to export', 'error');
            return;
        }

        const csvContent = this.convertToCSV(conversations);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatbot-conversations-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showStatus('configStatus', 'Conversations exported successfully!', 'success');
    }

    convertToCSV(conversations) {
        const headers = ['Timestamp', 'User Message', 'Bot Response', 'Lead Captured', 'Satisfaction'];
        const rows = conversations.map(conv => [
            new Date(conv.timestamp).toLocaleString(),
            `"${conv.userMessage.replace(/"/g, '""')}"`,
            `"${conv.botResponse.replace(/"/g, '""')}"`,
            conv.leadCaptured ? 'Yes' : 'No',
            conv.satisfaction || 'N/A'
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    clearAnalytics() {
        if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
            localStorage.removeItem('chatbot_analytics');
            this.updateAnalytics();
            this.showStatus('configStatus', 'Analytics data cleared successfully!', 'success');
        }
    }

    async generateInsights() {
        const analytics = this.loadAnalytics();
        const conversations = analytics.conversations || [];
        
        if (conversations.length < 5) {
            this.showStatus('configStatus', 'Need at least 5 conversations to generate insights', 'error');
            return;
        }

        try {
            // Generate insights using AI
            const insights = await this.analyzeConversations(conversations);
            
            // Display insights in a modal or new window
            this.displayInsights(insights);
            
        } catch (error) {
            this.showStatus('configStatus', 'Failed to generate insights: ' + error.message, 'error');
        }
    }

    async analyzeConversations(conversations) {
        if (!this.config.apiKey) {
            throw new Error('API key required for insight generation');
        }

        const conversationSummary = conversations.slice(-20).map(conv => 
            `User: ${conv.userMessage}\nBot: ${conv.botResponse}`
        ).join('\n\n');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: `Analyze these customer service conversations for a logistics company and provide actionable insights about customer needs, common questions, service gaps, and recommendations for improvement:\n\n${conversationSummary}`
                }],
                max_tokens: 1000,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate insights');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    displayInsights(insights) {
        // Create a modal to display insights
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 600px; max-height: 80vh; overflow-y: auto; margin: 2rem;">
                <h2 style="margin-top: 0;">Conversation Insights</h2>
                <div style="white-space: pre-wrap; line-height: 1.6; margin-bottom: 2rem;">${insights}</div>
                <button onclick="this.closest('div').remove()" style="background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer;">Close</button>
            </div>
        `;
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        document.body.appendChild(modal);
    }

    async simulateChatbotResponse(message) {
        // This is a simulation - in the real implementation, this would call the OpenAI API
        const knowledgeContext = this.knowledgeBase.map(item => 
            `${item.name}: ${item.content.substring(0, 200)}...`
        ).join('\n\n');

        // Simulate API response
        return `Hello! I'm here to help you with event logistics. Based on your inquiry about trade show logistics, I can assist you with our comprehensive services including time-critical deliveries, venue coordination, and on-site support. Would you like to get a quote or learn more about our specific trade show services?`;
    }
}

// Initialize the admin interface
const chatbotAdmin = new ChatbotAdmin();

// Global functions (called from HTML)
function testChatbot() {
    chatbotAdmin.testChatbot();
}

function exportConversations() {
    chatbotAdmin.exportConversations();
}

function clearAnalytics() {
    chatbotAdmin.clearAnalytics();
}

function generateInsights() {
    chatbotAdmin.generateInsights();
}