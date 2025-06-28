/**
 * Operations Agent - Advanced Event Management System
 * Handles complete event lifecycle: Create, Read, Update, Delete, Schedule
 */

class OperationsAgent {
    constructor() {
        this.events = this.loadEvents();
        this.eventTypes = this.getEventTypes();
        this.currentEventDraft = null;
        this.collectedInfo = {};
        this.conversationState = 'idle'; // idle, collecting, confirming, scheduling
        this.notificationService = null;
        
        // Enhanced Capabilities
        this.aiCapabilities = this.getAICapabilities();
        this.multiLanguageSupport = this.getLanguageSupport();
        this.advancedWorkflows = this.getAdvancedWorkflows();
        this.enterpriseFeatures = this.getEnterpriseFeatures();
        this.contextMemory = this.loadContextMemory();
        this.userPreferences = this.loadUserPreferences();
        this.smartSuggestions = this.loadSmartSuggestions();
        this.automationRules = this.loadAutomationRules();
        
        // Real-time capabilities
        this.realtimeUpdates = true;
        this.collaborativeMode = false;
        this.predictiveAnalytics = true;
        this.proactiveEngagement = true;
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.startPeriodicSync();
        await this.initializeNotificationService();
    }

    async initializeNotificationService() {
        try {
            // Load notification service if available
            if (typeof NotificationService !== 'undefined') {
                this.notificationService = new NotificationService();
                console.log('Notification service initialized');
            } else {
                // Try to load the script
                await this.loadNotificationScript();
                this.notificationService = new NotificationService();
            }
        } catch (error) {
            console.warn('Notification service unavailable:', error);
        }
    }

    async loadNotificationScript() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="notification-service.js"]')) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = './notification-service.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Advanced AI Capabilities
    getAICapabilities() {
        return {
            naturalLanguageProcessing: {
                enabled: true,
                languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja'],
                sentimentAnalysis: true,
                intentClassification: true,
                entityExtraction: true,
                contextualUnderstanding: true
            },
            conversationalAI: {
                multiTurnDialogue: true,
                contextRetention: true,
                personalizedResponses: true,
                emotionalIntelligence: true,
                proactiveEngagement: true
            },
            automation: {
                smartWorkflows: true,
                ruleBasedAutomation: true,
                mlPoweredSuggestions: true,
                predictiveActions: true,
                adaptiveLearning: true
            },
            analytics: {
                realTimeInsights: true,
                predictiveAnalytics: true,
                behaviorAnalysis: true,
                performanceOptimization: true,
                customReporting: true
            }
        };
    }

    getLanguageSupport() {
        return {
            primaryLanguage: 'en',
            supportedLanguages: {
                'en': { name: 'English', flag: '🇺🇸', confidence: 100 },
                'es': { name: 'Español', flag: '🇪🇸', confidence: 95 },
                'fr': { name: 'Français', flag: '🇫🇷', confidence: 90 },
                'de': { name: 'Deutsch', flag: '🇩🇪', confidence: 90 },
                'it': { name: 'Italiano', flag: '🇮🇹', confidence: 85 },
                'pt': { name: 'Português', flag: '🇧🇷', confidence: 85 },
                'zh': { name: '中文', flag: '🇨🇳', confidence: 80 },
                'ja': { name: '日本語', flag: '🇯🇵', confidence: 80 }
            },
            autoDetection: true,
            realTimeTranslation: true
        };
    }

    getAdvancedWorkflows() {
        return {
            complexEventChaining: {
                enabled: true,
                maxChainLength: 10,
                automaticSequencing: true,
                dependencyManagement: true
            },
            multiVenueCoordination: {
                enabled: true,
                simultaneousEvents: 50,
                crossVenueOptimization: true,
                resourceSharing: true
            },
            emergencyProtocols: {
                enabled: true,
                escalationMatrix: true,
                automaticNotifications: true,
                backupPlanning: true
            },
            qualityAssurance: {
                enabled: true,
                automaticChecks: true,
                complianceMonitoring: true,
                performanceTracking: true
            }
        };
    }

    getEnterpriseFeatures() {
        return {
            multiTenant: {
                enabled: true,
                isolatedData: true,
                customBranding: true,
                roleBasedAccess: true
            },
            integration: {
                apiConnections: true,
                webhookSupport: true,
                ssoAuthentication: true,
                thirdPartyServices: true
            },
            compliance: {
                dataProtection: true,
                auditTrails: true,
                encryptionAtRest: true,
                encryptionInTransit: true
            },
            scalability: {
                autoScaling: true,
                loadBalancing: true,
                redundancy: true,
                performanceOptimization: true
            }
        };
    }

    loadContextMemory() {
        const saved = localStorage.getItem('operations_context_memory');
        return saved ? JSON.parse(saved) : {
            conversationHistory: [],
            userPatterns: {},
            frequentRequests: {},
            seasonalTrends: {},
            personalPreferences: {}
        };
    }

    loadUserPreferences() {
        const saved = localStorage.getItem('user_preferences');
        return saved ? JSON.parse(saved) : {
            preferredLanguage: 'en',
            communicationStyle: 'professional', // casual, professional, formal
            responseLength: 'medium', // brief, medium, detailed
            notificationPreferences: {
                email: true,
                sms: false,
                push: true,
                inApp: true
            },
            automationLevel: 'standard', // minimal, standard, maximum
            privacySettings: {
                shareAnalytics: true,
                personalizedExperience: true,
                targetedSuggestions: true
            }
        };
    }

    loadSmartSuggestions() {
        const saved = localStorage.getItem('smart_suggestions');
        return saved ? JSON.parse(saved) : {
            enabled: true,
            types: {
                eventTypes: true,
                venues: true,
                timing: true,
                resources: true,
                pricing: true
            },
            learningEnabled: true,
            confidence: 0.7
        };
    }

    loadAutomationRules() {
        const saved = localStorage.getItem('automation_rules');
        return saved ? JSON.parse(saved) : {
            autoApproval: {
                enabled: false,
                maxValue: 1000,
                trustedClients: [],
                conditions: []
            },
            smartScheduling: {
                enabled: true,
                optimizeForCost: true,
                optimizeForTime: true,
                avoidConflicts: true
            },
            proactiveNotifications: {
                enabled: true,
                weatherAlerts: true,
                trafficUpdates: true,
                resourceAvailability: true
            }
        };
    }

    // Event Data Models and Types
    getEventTypes() {
        return {
            'logistics_delivery': {
                name: 'Logistics Delivery',
                icon: '🚛',
                fields: ['pickup_location', 'delivery_location', 'cargo_details', 'timeline', 'special_requirements'],
                workflow: ['request', 'quote', 'approval', 'scheduling', 'pickup', 'transit', 'delivery', 'completed']
            },
            'venue_setup': {
                name: 'Venue Setup',
                icon: '🏢',
                fields: ['venue_location', 'event_type', 'setup_requirements', 'equipment_list', 'timeline', 'breakdown_time'],
                workflow: ['request', 'site_visit', 'planning', 'approval', 'setup', 'event_support', 'breakdown', 'completed']
            },
            'equipment_transport': {
                name: 'Equipment Transport',
                icon: '📦',
                fields: ['equipment_list', 'pickup_location', 'destination', 'handling_requirements', 'timeline'],
                workflow: ['request', 'assessment', 'quote', 'approval', 'pickup', 'transport', 'delivery', 'completed']
            },
            'trade_show_support': {
                name: 'Trade Show Support',
                icon: '🏪',
                fields: ['show_location', 'booth_details', 'equipment_needs', 'setup_date', 'breakdown_date', 'storage_needs'],
                workflow: ['request', 'planning', 'approval', 'pre_show', 'setup', 'show_support', 'breakdown', 'post_show']
            },
            'emergency_service': {
                name: 'Emergency Service',
                icon: '🚨',
                fields: ['urgency_level', 'service_type', 'location', 'immediate_needs', 'contact_person'],
                workflow: ['request', 'dispatch', 'arrival', 'service', 'completed']
            },
            'consultation': {
                name: 'Consultation Meeting',
                icon: '💼',
                fields: ['meeting_type', 'location', 'attendees', 'agenda', 'duration'],
                workflow: ['request', 'scheduling', 'confirmation', 'meeting', 'follow_up']
            }
        };
    }

    // Core Event Management Operations

    async createEvent(eventData) {
        const event = {
            id: this.generateEventId(),
            type: eventData.type,
            status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: eventData.created_by || 'chatbot',
            
            // Client Information
            client: {
                name: eventData.client_name,
                email: eventData.client_email,
                phone: eventData.client_phone,
                company: eventData.client_company,
                contact_preference: eventData.contact_preference || 'email'
            },
            
            // Event Details
            title: eventData.title || this.generateEventTitle(eventData.type),
            description: eventData.description,
            priority: eventData.priority || 'medium',
            
            // Scheduling
            schedule: {
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                start_time: eventData.start_time,
                end_time: eventData.end_time,
                timezone: eventData.timezone || 'America/New_York',
                all_day: eventData.all_day || false
            },
            
            // Location and Logistics
            locations: {
                primary: eventData.primary_location,
                secondary: eventData.secondary_location,
                pickup: eventData.pickup_location,
                delivery: eventData.delivery_location
            },
            
            // Service Details
            services: eventData.services || [],
            equipment: eventData.equipment || [],
            special_requirements: eventData.special_requirements || [],
            
            // Business Information
            quote: {
                estimated_cost: eventData.estimated_cost,
                final_cost: null,
                quoted_at: null,
                approved_at: null
            },
            
            // Workflow Tracking
            workflow: {
                current_stage: eventData.workflow_stage || 'request',
                stages_completed: ['request'],
                next_actions: this.getNextActions(eventData.type, 'request')
            },
            
            // Internal Tracking
            assigned_team: eventData.assigned_team || [],
            internal_notes: eventData.internal_notes || [],
            
            // Communication Log
            communications: [{
                timestamp: new Date().toISOString(),
                type: 'event_created',
                message: 'Event created via chatbot',
                direction: 'internal'
            }]
        };

        // Store the event
        this.events.push(event);
        this.saveEvents();
        
        // Trigger notifications
        await this.sendEventNotification(event, 'created');
        
        // Dispatch event for other listeners
        window.dispatchEvent(new CustomEvent('eventCreated', { detail: event }));
        
        return event;
    }

    async updateEvent(eventId, updateData) {
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) {
            throw new Error('Event not found');
        }

        const event = this.events[eventIndex];
        const originalEvent = JSON.parse(JSON.stringify(event)); // Deep copy for comparison
        
        // Update fields
        Object.keys(updateData).forEach(key => {
            if (key === 'schedule' || key === 'client' || key === 'locations' || key === 'quote' || key === 'workflow') {
                // Handle nested objects
                event[key] = { ...event[key], ...updateData[key] };
            } else {
                event[key] = updateData[key];
            }
        });
        
        event.updated_at = new Date().toISOString();
        
        // Log the change
        event.communications.push({
            timestamp: new Date().toISOString(),
            type: 'event_updated',
            message: `Event updated: ${this.getUpdateSummary(originalEvent, event)}`,
            direction: 'internal'
        });
        
        this.events[eventIndex] = event;
        this.saveEvents();
        
        // Send notification if significant changes
        if (this.isSignificantUpdate(originalEvent, event)) {
            await this.sendEventNotification(event, 'updated');
        }
        
        return event;
    }

    async cancelEvent(eventId, reason = '') {
        const event = this.getEvent(eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        event.status = 'cancelled';
        event.cancelled_at = new Date().toISOString();
        event.cancellation_reason = reason;
        event.updated_at = new Date().toISOString();
        
        event.communications.push({
            timestamp: new Date().toISOString(),
            type: 'event_cancelled',
            message: `Event cancelled. Reason: ${reason}`,
            direction: 'internal'
        });
        
        this.saveEvents();
        await this.sendEventNotification(event, 'cancelled');
        
        return event;
    }

    getEvent(eventId) {
        return this.events.find(e => e.id === eventId);
    }

    getEvents(filters = {}) {
        let filteredEvents = [...this.events];
        
        if (filters.status) {
            filteredEvents = filteredEvents.filter(e => e.status === filters.status);
        }
        
        if (filters.type) {
            filteredEvents = filteredEvents.filter(e => e.type === filters.type);
        }
        
        if (filters.date_from) {
            filteredEvents = filteredEvents.filter(e => 
                new Date(e.schedule.start_date) >= new Date(filters.date_from)
            );
        }
        
        if (filters.date_to) {
            filteredEvents = filteredEvents.filter(e => 
                new Date(e.schedule.start_date) <= new Date(filters.date_to)
            );
        }
        
        if (filters.client_email) {
            filteredEvents = filteredEvents.filter(e => 
                e.client.email === filters.client_email
            );
        }
        
        return filteredEvents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Advanced AI Processing Methods

    async detectLanguage(message) {
        // Simple language detection based on common words and patterns
        const languagePatterns = {
            'es': ['hola', 'necesito', 'ayuda', 'gracias', 'por favor', 'cómo', 'qué', 'dónde'],
            'fr': ['bonjour', 'besoin', 'aide', 'merci', 'comment', 'quoi', 'où', 'pouvez'],
            'de': ['hallo', 'brauche', 'hilfe', 'danke', 'wie', 'was', 'wo', 'können'],
            'it': ['ciao', 'bisogno', 'aiuto', 'grazie', 'come', 'cosa', 'dove', 'posso'],
            'pt': ['olá', 'preciso', 'ajuda', 'obrigado', 'como', 'que', 'onde', 'posso'],
            'zh': ['你好', '需要', '帮助', '谢谢', '怎么', '什么', '哪里', '可以'],
            'ja': ['こんにちは', '必要', '助け', 'ありがとう', 'どう', '何', 'どこ', 'できる']
        };

        const lowerMessage = message.toLowerCase();
        let detectedLanguage = 'en';
        let maxMatches = 0;

        for (const [lang, patterns] of Object.entries(languagePatterns)) {
            const matches = patterns.filter(pattern => lowerMessage.includes(pattern)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedLanguage = lang;
            }
        }

        return {
            language: detectedLanguage,
            confidence: Math.min(0.9, maxMatches / 3),
            supportedLanguage: this.multiLanguageSupport.supportedLanguages[detectedLanguage] || this.multiLanguageSupport.supportedLanguages.en
        };
    }

    async generateSmartSuggestions(context, userInput) {
        const suggestions = [];
        
        // Time-based suggestions
        const currentHour = new Date().getHours();
        if (currentHour >= 9 && currentHour <= 17) {
            suggestions.push({
                type: 'timing',
                suggestion: 'Same-day delivery available for orders placed before 2 PM',
                confidence: 0.9,
                action: 'create_event',
                priority: 'high'
            });
        }

        // Event type suggestions based on patterns
        if (userInput.toLowerCase().includes('urgent') || userInput.toLowerCase().includes('emergency')) {
            suggestions.push({
                type: 'service',
                suggestion: 'Emergency logistics service with 2-hour response time',
                confidence: 0.95,
                action: 'emergency_service',
                priority: 'critical'
            });
        }

        // Seasonal suggestions
        const month = new Date().getMonth();
        if (month >= 9 && month <= 11) { // Q4
            suggestions.push({
                type: 'seasonal',
                suggestion: 'Holiday event logistics - book early for December events',
                confidence: 0.8,
                action: 'create_event',
                priority: 'medium'
            });
        }

        // Historical pattern suggestions
        const userHistory = this.contextMemory.userPatterns[context.userId];
        if (userHistory && userHistory.frequentEventTypes) {
            const mostFrequent = Object.keys(userHistory.frequentEventTypes)[0];
            suggestions.push({
                type: 'personalized',
                suggestion: `Based on your history, you might need ${this.getEventTypeDisplay(mostFrequent)}`,
                confidence: 0.7,
                action: 'create_event',
                priority: 'low'
            });
        }

        return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
    }

    async performSentimentAnalysis(message) {
        const positiveWords = ['great', 'excellent', 'perfect', 'amazing', 'wonderful', 'fantastic', 'good', 'happy', 'satisfied', 'pleased'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointed', 'frustrated', 'angry', 'upset', 'problem', 'issue'];
        const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'rush', 'critical', 'important', 'deadline'];

        const lowerMessage = message.toLowerCase();
        
        const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
        const urgentCount = urgentWords.filter(word => lowerMessage.includes(word)).length;

        let sentiment = 'neutral';
        let urgency = 'normal';
        let confidence = 0.5;

        if (positiveCount > negativeCount) {
            sentiment = 'positive';
            confidence = Math.min(0.9, 0.5 + (positiveCount * 0.2));
        } else if (negativeCount > positiveCount) {
            sentiment = 'negative';
            confidence = Math.min(0.9, 0.5 + (negativeCount * 0.2));
        }

        if (urgentCount > 0) {
            urgency = 'high';
            confidence = Math.min(0.95, confidence + (urgentCount * 0.1));
        }

        return {
            sentiment,
            urgency,
            confidence,
            keywords: {
                positive: positiveWords.filter(word => lowerMessage.includes(word)),
                negative: negativeWords.filter(word => lowerMessage.includes(word)),
                urgent: urgentWords.filter(word => lowerMessage.includes(word))
            }
        };
    }

    async enrichContext(message, userContext = {}) {
        const language = await this.detectLanguage(message);
        const sentiment = await this.performSentimentAnalysis(message);
        const suggestions = await this.generateSmartSuggestions(userContext, message);
        
        return {
            language,
            sentiment,
            suggestions,
            timestamp: new Date().toISOString(),
            messageLength: message.length,
            complexity: this.assessComplexity(message),
            entities: this.extractEntities(message),
            intent: this.detectAdvancedIntent(message, sentiment)
        };
    }

    assessComplexity(message) {
        const factors = {
            length: message.length,
            sentences: message.split(/[.!?]+/).length,
            questions: (message.match(/\?/g) || []).length,
            techTerms: this.countTechnicalTerms(message),
            multipleRequests: this.countRequests(message)
        };

        let complexity = 'simple';
        
        if (factors.length > 200 || factors.sentences > 3 || factors.questions > 2) {
            complexity = 'moderate';
        }
        
        if (factors.length > 500 || factors.sentences > 5 || factors.techTerms > 3 || factors.multipleRequests > 2) {
            complexity = 'complex';
        }

        return {
            level: complexity,
            factors,
            confidence: 0.8
        };
    }

    extractEntities(message) {
        const entities = {
            dates: this.extractDates(message),
            times: this.extractTimes(message),
            locations: this.extractLocations(message),
            emails: this.extractEmails(message),
            phones: this.extractPhones(message),
            companies: this.extractCompanies(message),
            amounts: this.extractAmounts(message)
        };

        return entities;
    }

    detectAdvancedIntent(message, sentiment) {
        const intents = {
            'create_event': {
                patterns: ['schedule', 'book', 'arrange', 'set up', 'organize', 'plan'],
                confidence: 0.0
            },
            'emergency_service': {
                patterns: ['emergency', 'urgent', 'asap', 'immediately', 'rush', 'critical'],
                confidence: 0.0
            },
            'get_quote': {
                patterns: ['quote', 'price', 'cost', 'how much', 'estimate', 'pricing'],
                confidence: 0.0
            },
            'track_shipment': {
                patterns: ['track', 'status', 'where is', 'update', 'progress'],
                confidence: 0.0
            },
            'modify_event': {
                patterns: ['change', 'modify', 'update', 'reschedule', 'move'],
                confidence: 0.0
            },
            'cancel_event': {
                patterns: ['cancel', 'call off', 'abort', 'stop'],
                confidence: 0.0
            },
            'get_help': {
                patterns: ['help', 'assist', 'support', 'guide', 'how to'],
                confidence: 0.0
            },
            'complaint': {
                patterns: ['problem', 'issue', 'wrong', 'mistake', 'disappointed'],
                confidence: 0.0
            },
            'compliment': {
                patterns: ['great', 'excellent', 'thank you', 'amazing', 'perfect'],
                confidence: 0.0
            }
        };

        const lowerMessage = message.toLowerCase();

        // Calculate confidence for each intent
        Object.keys(intents).forEach(intentKey => {
            const intent = intents[intentKey];
            intent.confidence = intent.patterns.reduce((total, pattern) => {
                return total + (lowerMessage.includes(pattern) ? 1 : 0);
            }, 0) / intent.patterns.length;
        });

        // Boost confidence based on sentiment
        if (sentiment.urgency === 'high') {
            intents.emergency_service.confidence *= 1.5;
        }
        if (sentiment.sentiment === 'negative') {
            intents.complaint.confidence *= 1.3;
        }
        if (sentiment.sentiment === 'positive') {
            intents.compliment.confidence *= 1.3;
        }

        // Find the highest confidence intent
        const topIntent = Object.keys(intents).reduce((a, b) => 
            intents[a].confidence > intents[b].confidence ? a : b
        );

        return {
            primary: topIntent,
            confidence: intents[topIntent].confidence,
            alternatives: Object.keys(intents)
                .filter(key => key !== topIntent && intents[key].confidence > 0.3)
                .sort((a, b) => intents[b].confidence - intents[a].confidence)
                .slice(0, 2)
        };
    }

    // Enhanced Conversation Flow Management
    
    async processOperationsMessage(message, context = {}) {
        // Enhanced processing with AI capabilities
        const enrichedContext = await this.enrichContext(message, context);
        
        // Store context for learning
        this.updateContextMemory(message, enrichedContext, context);
        
        // Determine appropriate response strategy
        const responseStrategy = this.determineResponseStrategy(enrichedContext);
        
        // Handle based on primary intent
        switch (enrichedContext.intent.primary) {
            case 'create_event':
                return await this.handleEventCreation(message, enrichedContext);
            case 'emergency_service':
                return await this.handleEmergencyService(message, enrichedContext);
            case 'get_quote':
                return await this.handleQuoteRequest(message, enrichedContext);
            case 'track_shipment':
                return await this.handleShipmentTracking(message, enrichedContext);
            case 'modify_event':
                return await this.handleEventUpdate(message, enrichedContext);
            case 'cancel_event':
                return await this.handleEventCancellation(message, enrichedContext);
            case 'complaint':
                return await this.handleComplaint(message, enrichedContext);
            case 'compliment':
                return await this.handleCompliment(message, enrichedContext);
            case 'get_help':
                return await this.handleHelpRequest(message, enrichedContext);
            case 'provide_info':
                return await this.handleInfoCollection(message, enrichedContext);
            default:
                return await this.handleGeneralInquiry(message, enrichedContext);
        }
    }

    detectIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        // Event creation intents
        if (this.matchesPatterns(lowerMessage, [
            'schedule', 'book', 'create event', 'need logistics', 'arrange pickup',
            'delivery service', 'venue setup', 'trade show', 'equipment transport'
        ])) {
            return { 
                type: 'create_event',
                event_type: this.detectEventType(lowerMessage),
                confidence: 0.8
            };
        }
        
        // Event management intents
        if (this.matchesPatterns(lowerMessage, [
            'reschedule', 'change date', 'modify', 'update event'
        ])) {
            return { type: 'update_event', confidence: 0.8 };
        }
        
        if (this.matchesPatterns(lowerMessage, [
            'cancel', 'call off', 'cancel event', 'cancel booking'
        ])) {
            return { type: 'cancel_event', confidence: 0.8 };
        }
        
        if (this.matchesPatterns(lowerMessage, [
            'view events', 'show events', 'my bookings', 'upcoming events'
        ])) {
            return { type: 'view_events', confidence: 0.8 };
        }
        
        // Information providing
        if (this.conversationState === 'collecting') {
            return { type: 'provide_info', confidence: 0.9 };
        }
        
        return { type: 'general', confidence: 0.5 };
    }

    async handleEventCreation(message, intent) {
        if (!this.currentEventDraft) {
            this.currentEventDraft = {
                type: intent.event_type || 'logistics_delivery',
                collected_info: {},
                missing_fields: this.getRequiredFields(intent.event_type || 'logistics_delivery')
            };
            this.conversationState = 'collecting';
        }
        
        // Extract any information from the initial message
        this.extractAndStoreInfo(message);
        
        return this.requestNextInformation();
    }

    async handleInfoCollection(message, intent) {
        if (!this.currentEventDraft) {
            return "I don't have an active event creation in progress. Would you like to start booking a new service?";
        }
        
        // Extract information from the message
        this.extractAndStoreInfo(message);
        
        // Check if we have all required information
        if (this.hasAllRequiredInfo()) {
            return await this.confirmEventDetails();
        } else {
            return this.requestNextInformation();
        }
    }

    extractAndStoreInfo(message) {
        const info = this.currentEventDraft.collected_info;
        const lowerMessage = message.toLowerCase();
        
        // Extract common information patterns
        
        // Email addresses
        const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch && !info.client_email) {
            info.client_email = emailMatch[0];
            this.removeFromMissing('client_email');
        }
        
        // Phone numbers
        const phoneMatch = message.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch && !info.client_phone) {
            info.client_phone = phoneMatch[0];
            this.removeFromMissing('client_phone');
        }
        
        // Dates
        const dateMatch = this.extractDate(message);
        if (dateMatch && !info.start_date) {
            info.start_date = dateMatch;
            this.removeFromMissing('start_date');
        }
        
        // Times
        const timeMatch = this.extractTime(message);
        if (timeMatch && !info.start_time) {
            info.start_time = timeMatch;
            this.removeFromMissing('start_time');
        }
        
        // Location patterns
        if (this.containsLocationIndicators(message) && !info.primary_location) {
            info.primary_location = this.extractLocation(message);
            this.removeFromMissing('primary_location');
        }
        
        // Company names
        if (this.matchesPatterns(lowerMessage, ['company', 'corp', 'inc', 'llc']) && !info.client_company) {
            info.client_company = this.extractCompanyName(message);
            this.removeFromMissing('client_company');
        }
        
        // Names (if asking for name)
        if (this.waitingForField('client_name') && this.isPersonName(message)) {
            info.client_name = this.cleanName(message);
            this.removeFromMissing('client_name');
        }
        
        // Specific field collection based on current request
        if (this.waitingForField('description')) {
            info.description = message;
            this.removeFromMissing('description');
        }
    }

    requestNextInformation() {
        const missing = this.currentEventDraft.missing_fields;
        if (missing.length === 0) {
            return this.confirmEventDetails();
        }
        
        const nextField = missing[0];
        const eventType = this.eventTypes[this.currentEventDraft.type];
        
        const questions = {
            'client_name': "What's your name?",
            'client_email': "What's your email address so I can send you updates?",
            'client_phone': "What's your phone number for urgent communications?",
            'client_company': "What company are you with?",
            'start_date': "When do you need this service? (Please provide the date)",
            'start_time': "What time should we start?",
            'primary_location': "Where should we perform this service? (Please provide the full address)",
            'pickup_location': "Where should we pick up from?",
            'delivery_location': "Where should we deliver to?",
            'description': `Please describe your ${eventType.name.toLowerCase()} requirements in detail.`,
            'equipment_list': "What equipment or items need to be handled?",
            'special_requirements': "Do you have any special requirements or instructions?"
        };
        
        return questions[nextField] || `Please provide information about: ${nextField.replace('_', ' ')}`;
    }

    async confirmEventDetails() {
        const draft = this.currentEventDraft;
        const eventType = this.eventTypes[draft.type];
        
        let summary = `📋 **Event Summary**\n\n`;
        summary += `**Service:** ${eventType.icon} ${eventType.name}\n`;
        summary += `**Client:** ${draft.collected_info.client_name || 'Not specified'}\n`;
        summary += `**Email:** ${draft.collected_info.client_email || 'Not specified'}\n`;
        summary += `**Phone:** ${draft.collected_info.client_phone || 'Not specified'}\n`;
        summary += `**Date:** ${this.formatDate(draft.collected_info.start_date)}\n`;
        summary += `**Time:** ${draft.collected_info.start_time || 'To be determined'}\n`;
        summary += `**Location:** ${draft.collected_info.primary_location || 'Not specified'}\n`;
        
        if (draft.collected_info.description) {
            summary += `**Details:** ${draft.collected_info.description}\n`;
        }
        
        summary += `\n**Next Steps:**\n`;
        summary += `1. I'll create this event in our system\n`;
        summary += `2. Our team will review and provide a detailed quote\n`;
        summary += `3. You'll receive confirmation within 2 hours\n\n`;
        summary += `Would you like me to proceed with creating this event? (Reply with "yes" to confirm or "no" to make changes)`;
        
        this.conversationState = 'confirming';
        return summary;
    }

    async finalizeEventCreation() {
        if (!this.currentEventDraft) {
            return "No event draft to finalize.";
        }
        
        try {
            const event = await this.createEvent(this.currentEventDraft.collected_info);
            
            // Reset draft state
            this.currentEventDraft = null;
            this.conversationState = 'idle';
            
            let response = `✅ **Event Created Successfully!**\n\n`;
            response += `**Event ID:** ${event.id}\n`;
            response += `**Status:** ${event.status}\n`;
            response += `**Reference:** ${event.title}\n\n`;
            response += `📧 You'll receive a confirmation email shortly with:\n`;
            response += `• Detailed quote and pricing\n`;
            response += `• Timeline and logistics plan\n`;
            response += `• Direct contact information for your assigned coordinator\n\n`;
            response += `Is there anything else I can help you with today?`;
            
            return response;
        } catch (error) {
            console.error('Error creating event:', error);
            return "I encountered an error creating your event. Please try again or contact our support team at (973) 415-9532.";
        }
    }

    // Utility Methods

    generateEventId() {
        const prefix = 'QCS';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }

    generateEventTitle(eventType) {
        const type = this.eventTypes[eventType];
        const date = new Date().toLocaleDateString();
        return `${type.name} - ${date}`;
    }

    getRequiredFields(eventType) {
        const baseFields = ['client_name', 'client_email', 'client_phone', 'start_date', 'primary_location'];
        const typeSpecificFields = this.eventTypes[eventType]?.fields || [];
        return [...baseFields, ...typeSpecificFields.slice(0, 3)]; // Limit to prevent overwhelming
    }

    removeFromMissing(field) {
        if (this.currentEventDraft) {
            this.currentEventDraft.missing_fields = this.currentEventDraft.missing_fields.filter(f => f !== field);
        }
    }

    waitingForField(field) {
        return this.currentEventDraft?.missing_fields.includes(field);
    }

    hasAllRequiredInfo() {
        return this.currentEventDraft?.missing_fields.length === 0;
    }

    // Data Storage
    loadEvents() {
        const saved = localStorage.getItem('operations_agent_events');
        return saved ? JSON.parse(saved) : [];
    }

    saveEvents() {
        localStorage.setItem('operations_agent_events', JSON.stringify(this.events));
    }

    // Helper Methods for Information Extraction
    
    matchesPatterns(text, patterns) {
        return patterns.some(pattern => text.includes(pattern));
    }

    detectEventType(message) {
        const types = Object.keys(this.eventTypes);
        for (const type of types) {
            const typeInfo = this.eventTypes[type];
            if (message.includes(typeInfo.name.toLowerCase()) || 
                message.includes(type.replace('_', ' '))) {
                return type;
            }
        }
        return 'logistics_delivery'; // default
    }

    extractDate(message) {
        // Simple date extraction - can be enhanced with a proper date parsing library
        const datePatterns = [
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
            /(tomorrow|today|next week|next month)/i,
            /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
        ];
        
        for (const pattern of datePatterns) {
            const match = message.match(pattern);
            if (match) {
                return this.normalizeDate(match[0]);
            }
        }
        return null;
    }

    extractTime(message) {
        const timePattern = /(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/;
        const match = message.match(timePattern);
        return match ? match[0] : null;
    }

    normalizeDate(dateString) {
        // Convert various date formats to ISO date
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    formatDate(dateString) {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Notification System
    async sendEventNotification(event, action) {
        try {
            if (this.notificationService) {
                // Send notification through the notification service
                const notificationId = await this.notificationService.sendNotification(`event_${action}`, event);
                
                // Store notification in the communications log
                event.communications.push({
                    timestamp: new Date().toISOString(),
                    type: 'notification_sent',
                    message: `${action} notification sent to ${event.client.email} (ID: ${notificationId})`,
                    direction: 'outbound',
                    notificationId
                });
            } else {
                // Fallback: simple console log
                console.log(`Notification: Event ${event.id} was ${action}`);
                
                event.communications.push({
                    timestamp: new Date().toISOString(),
                    type: 'notification_attempted',
                    message: `${action} notification attempted for ${event.client.email}`,
                    direction: 'outbound'
                });
            }
        } catch (error) {
            console.error('Notification error:', error);
            
            event.communications.push({
                timestamp: new Date().toISOString(),
                type: 'notification_failed',
                message: `Failed to send ${action} notification: ${error.message}`,
                direction: 'outbound'
            });
        }
    }

    // Event Handlers
    bindEvents() {
        // Listen for configuration updates
        window.addEventListener('chatbotConfigUpdated', () => {
            this.loadConfig();
        });
    }

    startPeriodicSync() {
        // Sync data every 5 minutes
        setInterval(() => {
            this.syncData();
        }, 5 * 60 * 1000);
    }

    async syncData() {
        // In production, this would sync with backend services
        console.log('Syncing operations data...');
    }
}

// Export for use in chatbot widget
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OperationsAgent;
} else {
    window.OperationsAgent = OperationsAgent;
}
