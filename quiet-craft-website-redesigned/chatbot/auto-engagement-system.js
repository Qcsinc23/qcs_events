/**
 * Auto-Engagement System - Intelligent proactive user engagement
 * Automatically engages users and progressively demonstrates agent capabilities
 */

class AutoEngagementSystem {
    constructor(chatbotWidget) {
        this.chatbot = chatbotWidget;
        this.engagementRules = this.getEngagementRules();
        this.capabilityShowcase = this.getCapabilityShowcase();
        this.userBehaviorTracker = this.getUserBehaviorTracker();
        this.engagementHistory = this.loadEngagementHistory();
        this.currentEngagementLevel = 0;
        this.maxEngagementLevel = 5;
        this.isEngaged = false;
        this.engagementTimer = null;
        
        this.init();
    }

    init() {
        this.setupBehaviorTracking();
        this.startEngagementMonitoring();
        this.bindEvents();
    }

    getEngagementRules() {
        return {
            // Time-based engagement
            timeOnPage: {
                threshold: 10000, // 10 seconds
                priority: 'low',
                trigger: 'welcome'
            },
            scrollDepth: {
                threshold: 25, // 25% scroll
                priority: 'medium',
                trigger: 'services_preview'
            },
            pageIdleTime: {
                threshold: 30000, // 30 seconds idle
                priority: 'high',
                trigger: 'assistance_offer'
            },
            mouseHover: {
                threshold: 3, // 3 hovers on key elements
                priority: 'medium',
                trigger: 'interactive_demo'
            },
            returnVisitor: {
                threshold: 1, // returning visitor
                priority: 'high',
                trigger: 'personalized_greeting'
            },
            // Page-specific engagement
            pricingPage: {
                threshold: 5000, // 5 seconds on pricing
                priority: 'high',
                trigger: 'cost_calculator'
            },
            contactPage: {
                threshold: 2000, // 2 seconds on contact
                priority: 'very_high',
                trigger: 'instant_support'
            }
        };
    }

    getCapabilityShowcase() {
        return {
            level_1: {
                title: "👋 Welcome to AI-Powered Logistics!",
                message: "Hi there! I'm your AI Operations Assistant. I can help you with everything from simple quotes to complex multi-venue event coordination. What brings you here today?",
                quickActions: [
                    { text: "🚛 Get Quick Quote", action: "quote" },
                    { text: "📞 Schedule Call", action: "contact" },
                    { text: "🤖 See What I Can Do", action: "showcase" }
                ],
                capabilities: [
                    "Instant price quotes",
                    "Real-time availability",
                    "24/7 support"
                ]
            },
            level_2: {
                title: "🚀 Let me show you my capabilities:",
                message: "I'm not just a chatbot - I'm a complete operations management system! Here's what I can handle:",
                quickActions: [
                    { text: "📦 Book Delivery", action: "create_delivery" },
                    { text: "🏢 Venue Setup", action: "create_venue" },
                    { text: "🚨 Emergency Service", action: "emergency" }
                ],
                capabilities: [
                    "🤖 **AI-Powered Booking**: Natural language event creation",
                    "📊 **Real-time Analytics**: Live tracking and insights", 
                    "🔔 **Smart Notifications**: Multi-channel updates",
                    "📅 **Calendar Integration**: Seamless scheduling",
                    "💬 **Multi-language Support**: 8+ languages",
                    "⚡ **Instant Processing**: Sub-second response times"
                ]
            },
            level_3: {
                title: "🎯 Advanced Operations at Your Fingertips:",
                message: "I handle complex logistics workflows that typically require multiple phone calls and emails. Watch this:",
                quickActions: [
                    { text: "🏪 Multi-Venue Event", action: "complex_event" },
                    { text: "📈 Live Dashboard", action: "dashboard" },
                    { text: "🤖 AI Demo", action: "ai_demo" }
                ],
                capabilities: [
                    "🔄 **Workflow Automation**: End-to-end process management",
                    "🧠 **Predictive Analytics**: Demand forecasting and optimization",
                    "👥 **Team Collaboration**: Multi-user coordination",
                    "🔗 **System Integration**: CRM, ERP, and calendar sync",
                    "📱 **Mobile Excellence**: Full mobile operations",
                    "🛡️ **Enterprise Security**: Bank-level data protection"
                ]
            },
            level_4: {
                title: "🎪 See Complex Event Management in Action:",
                message: "Let me demonstrate handling a multi-day trade show with complex requirements:",
                example: {
                    scenario: "3-day tech conference with 5 venues, 50+ vendors, international shipping",
                    steps: [
                        "✅ Venue coordination and timeline mapping",
                        "✅ Equipment logistics and customs handling", 
                        "✅ Real-time tracking and updates",
                        "✅ Emergency protocol activation",
                        "✅ Post-event analytics and reporting"
                    ]
                },
                quickActions: [
                    { text: "🎪 Plan Complex Event", action: "complex_demo" },
                    { text: "📊 View Analytics", action: "analytics" },
                    { text: "🎯 Start Planning", action: "start_planning" }
                ]
            },
            level_5: {
                title: "🚀 Enterprise-Grade AI Operations:",
                message: "Ready to experience the future of logistics? I offer enterprise-level capabilities typically found in systems costing $100k+:",
                quickActions: [
                    { text: "🏢 Enterprise Demo", action: "enterprise_demo" },
                    { text: "📞 Schedule Consultation", action: "schedule_consultation" },
                    { text: "🚀 Start Free Trial", action: "start_trial" }
                ],
                capabilities: [
                    "🤖 **AI Operations Center**: Autonomous decision making",
                    "🌐 **Global Logistics**: International coordination",
                    "📊 **Business Intelligence**: Executive dashboards",
                    "⚡ **Auto-scaling**: Handle 1000+ concurrent events",
                    "🔮 **Predictive AI**: 99%+ accuracy forecasting",
                    "💼 **White-label Solutions**: Custom branding"
                ],
                value_props: [
                    "💰 **ROI**: 300%+ cost savings vs traditional methods",
                    "⏱️ **Speed**: 10x faster than manual processes", 
                    "🎯 **Accuracy**: 99.8% error-free operations",
                    "📈 **Growth**: Scale without adding staff"
                ]
            }
        };
    }

    getUserBehaviorTracker() {
        return {
            pageEntry: Date.now(),
            scrollDepth: 0,
            maxScrollDepth: 0,
            timeOnPage: 0,
            idleTime: 0,
            lastActivity: Date.now(),
            keyElementHovers: 0,
            clicksOnCTA: 0,
            pagesVisited: this.getVisitedPages(),
            isReturningVisitor: this.checkReturningVisitor(),
            deviceType: this.getDeviceType(),
            trafficSource: this.getTrafficSource(),
            userAgent: navigator.userAgent,
            sessionStart: Date.now()
        };
    }

    loadEngagementHistory() {
        const saved = localStorage.getItem('auto_engagement_history');
        return saved ? JSON.parse(saved) : {
            totalEngagements: 0,
            successfulEngagements: 0,
            lastEngagement: null,
            engagementPreferences: {
                proactiveLevel: 'medium', // low, medium, high
                showcasePreference: 'progressive', // quick, progressive, detailed
                responseStyle: 'friendly' // professional, friendly, casual
            },
            dismissedTypes: [],
            convertedTypes: []
        };
    }

    setupBehaviorTracking() {
        // Track scroll depth
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            this.userBehaviorTracker.scrollDepth = scrollPercent;
            this.userBehaviorTracker.maxScrollDepth = Math.max(this.userBehaviorTracker.maxScrollDepth, scrollPercent);
            this.userBehaviorTracker.lastActivity = Date.now();
            this.checkEngagementTriggers();
        });

        // Track mouse activity
        let idleTimer;
        const resetIdleTimer = () => {
            this.userBehaviorTracker.lastActivity = Date.now();
            this.userBehaviorTracker.idleTime = 0;
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                this.userBehaviorTracker.idleTime = Date.now() - this.userBehaviorTracker.lastActivity;
                this.checkEngagementTriggers();
            }, 1000);
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, resetIdleTimer, true);
        });

        // Track hover on key elements
        this.trackKeyElementHovers();

        // Update time on page
        setInterval(() => {
            this.userBehaviorTracker.timeOnPage = Date.now() - this.userBehaviorTracker.pageEntry;
            this.checkEngagementTriggers();
        }, 1000);
    }

    trackKeyElementHovers() {
        const keyElements = [
            '.cta-button', '.btn-primary', '.service-card', 
            '.contact-info', '.hero-cta', '.nav-link[href="#quote"]'
        ];

        keyElements.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.addEventListener('mouseenter', () => {
                    this.userBehaviorTracker.keyElementHovers++;
                    this.checkEngagementTriggers();
                });
            });
        });
    }

    startEngagementMonitoring() {
        // Initial engagement check after page load
        setTimeout(() => {
            this.checkEngagementTriggers();
        }, 2000);

        // Periodic engagement checks
        this.engagementTimer = setInterval(() => {
            this.checkEngagementTriggers();
        }, 5000);
    }

    checkEngagementTriggers() {
        if (this.isEngaged || this.currentEngagementLevel >= this.maxEngagementLevel) {
            return;
        }

        const behavior = this.userBehaviorTracker;
        const rules = this.engagementRules;

        // Check each engagement rule
        const triggeredRules = [];

        // Time on page
        if (behavior.timeOnPage >= rules.timeOnPage.threshold && this.currentEngagementLevel === 0) {
            triggeredRules.push({ rule: 'timeOnPage', priority: rules.timeOnPage.priority });
        }

        // Scroll depth
        if (behavior.maxScrollDepth >= rules.scrollDepth.threshold && this.currentEngagementLevel <= 1) {
            triggeredRules.push({ rule: 'scrollDepth', priority: rules.scrollDepth.priority });
        }

        // Idle time
        if (behavior.idleTime >= rules.pageIdleTime.threshold && this.currentEngagementLevel <= 2) {
            triggeredRules.push({ rule: 'pageIdleTime', priority: rules.pageIdleTime.priority });
        }

        // Key element hovers
        if (behavior.keyElementHovers >= rules.mouseHover.threshold && this.currentEngagementLevel <= 3) {
            triggeredRules.push({ rule: 'mouseHover', priority: rules.mouseHover.priority });
        }

        // Returning visitor
        if (behavior.isReturningVisitor && this.currentEngagementLevel === 0) {
            triggeredRules.push({ rule: 'returnVisitor', priority: rules.returnVisitor.priority });
        }

        // Process triggered rules
        if (triggeredRules.length > 0) {
            const highestPriority = this.getHighestPriorityRule(triggeredRules);
            this.triggerEngagement(highestPriority);
        }
    }

    getHighestPriorityRule(rules) {
        const priorityOrder = { 'very_high': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return rules.reduce((highest, current) => {
            return priorityOrder[current.priority] > priorityOrder[highest.priority] ? current : highest;
        });
    }

    async triggerEngagement(rule) {
        if (this.isEngaged) return;

        this.isEngaged = true;
        this.currentEngagementLevel++;

        // Determine engagement type and level
        const engagementLevel = Math.min(this.currentEngagementLevel, this.maxEngagementLevel);
        const showcase = this.capabilityShowcase[`level_${engagementLevel}`];

        // Create engaging introduction
        await this.performEngagement(showcase, rule);

        // Track engagement
        this.trackEngagement(rule.rule, showcase, true);

        // Allow re-engagement after delay
        setTimeout(() => {
            this.isEngaged = false;
        }, 30000); // 30 seconds cooldown
    }

    async performEngagement(showcase, rule) {
        // Open chatbot if not already open
        if (!this.chatbot.isOpen) {
            this.chatbot.openChat();
            
            // Wait for chat to fully open
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Send engaging message with typing animation
        await this.sendEngagingMessage(showcase);

        // Show capability demonstration
        if (showcase.capabilities) {
            await this.demonstrateCapabilities(showcase.capabilities);
        }

        // Show interactive example if available
        if (showcase.example) {
            await this.showInteractiveExample(showcase.example);
        }

        // Present quick actions
        if (showcase.quickActions) {
            this.showQuickActions(showcase.quickActions);
        }
    }

    async sendEngagingMessage(showcase) {
        // Add welcome message with enhanced formatting
        this.chatbot.addMessage(showcase.title, 'bot');
        
        // Wait a moment for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add main message
        this.chatbot.addMessage(showcase.message, 'bot');
    }

    async demonstrateCapabilities(capabilities) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        let capabilityMessage = "Here's what I can help you with:\n\n";
        capabilities.forEach((capability, index) => {
            capabilityMessage += `${capability}\n`;
        });
        
        this.chatbot.addMessage(capabilityMessage, 'bot');
    }

    async showInteractiveExample(example) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        let exampleMessage = `**${example.scenario}**\n\nHere's how I handle it:\n\n`;
        example.steps.forEach(step => {
            exampleMessage += `${step}\n`;
        });
        
        this.chatbot.addMessage(exampleMessage, 'bot');
        
        // Simulate real-time processing
        await this.simulateProcessing();
    }

    async simulateProcessing() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const processingSteps = [
            "🔍 Analyzing requirements...",
            "📊 Checking availability...", 
            "💰 Calculating optimal pricing...",
            "✅ Ready to proceed!"
        ];

        for (const step of processingSteps) {
            this.chatbot.addMessage(step, 'bot');
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    showQuickActions(quickActions) {
        // Update chatbot quick actions
        const quickActionsContainer = this.chatbot.chatWidget.querySelector('#ai-chatbot-quick-actions');
        
        if (quickActionsContainer) {
            quickActionsContainer.innerHTML = quickActions.map(action => 
                `<button class="ai-chatbot-quick-action hover-lift" data-action="${action.action}">${action.text}</button>`
            ).join('');
            
            quickActionsContainer.style.display = 'flex';
            
            // Add enhanced styling
            quickActionsContainer.style.animation = 'slideInUp 0.3s ease';
        }
    }

    trackEngagement(ruleTriggered, showcase, success) {
        this.engagementHistory.totalEngagements++;
        if (success) {
            this.engagementHistory.successfulEngagements++;
        }
        
        this.engagementHistory.lastEngagement = {
            timestamp: new Date().toISOString(),
            rule: ruleTriggered,
            level: this.currentEngagementLevel,
            showcase: showcase.title,
            success: success,
            userBehavior: { ...this.userBehaviorTracker }
        };
        
        // Save to localStorage
        localStorage.setItem('auto_engagement_history', JSON.stringify(this.engagementHistory));
    }

    // Utility Methods
    getVisitedPages() {
        const visited = localStorage.getItem('visited_pages');
        return visited ? JSON.parse(visited) : [];
    }

    checkReturningVisitor() {
        const lastVisit = localStorage.getItem('last_visit');
        const isReturning = lastVisit && (Date.now() - parseInt(lastVisit)) > 24 * 60 * 60 * 1000; // 24 hours
        localStorage.setItem('last_visit', Date.now().toString());
        return isReturning;
    }

    getDeviceType() {
        const width = window.innerWidth;
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    }

    getTrafficSource() {
        const referrer = document.referrer;
        if (!referrer) return 'direct';
        if (referrer.includes('google')) return 'google';
        if (referrer.includes('facebook')) return 'facebook';
        if (referrer.includes('linkedin')) return 'linkedin';
        return 'other';
    }

    bindEvents() {
        // Listen for chatbot interactions
        window.addEventListener('chatbotInteraction', (e) => {
            this.handleChatbotInteraction(e.detail);
        });

        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseEngagement();
            } else {
                this.resumeEngagement();
            }
        });

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    handleChatbotInteraction(details) {
        // User has interacted with chatbot, adjust engagement strategy
        this.engagementHistory.engagementPreferences.proactiveLevel = 'low'; // Reduce proactivity
        
        // Track conversion if user performs valuable action
        if (details.action === 'create_event' || details.action === 'get_quote') {
            this.engagementHistory.convertedTypes.push(details.type);
        }
    }

    pauseEngagement() {
        if (this.engagementTimer) {
            clearInterval(this.engagementTimer);
        }
    }

    resumeEngagement() {
        this.startEngagementMonitoring();
    }

    cleanup() {
        if (this.engagementTimer) {
            clearInterval(this.engagementTimer);
        }
        
        // Save final tracking data
        this.userBehaviorTracker.totalTimeOnPage = Date.now() - this.userBehaviorTracker.pageEntry;
        localStorage.setItem('user_behavior_final', JSON.stringify(this.userBehaviorTracker));
    }

    // Public API methods
    setEngagementLevel(level) {
        this.currentEngagementLevel = Math.max(0, Math.min(level, this.maxEngagementLevel));
    }

    triggerSpecificShowcase(level) {
        if (level >= 1 && level <= this.maxEngagementLevel) {
            const showcase = this.capabilityShowcase[`level_${level}`];
            this.performEngagement(showcase, { rule: 'manual', priority: 'high' });
        }
    }

    updateEngagementPreferences(preferences) {
        Object.assign(this.engagementHistory.engagementPreferences, preferences);
        localStorage.setItem('auto_engagement_history', JSON.stringify(this.engagementHistory));
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoEngagementSystem;
} else {
    window.AutoEngagementSystem = AutoEngagementSystem;
}
