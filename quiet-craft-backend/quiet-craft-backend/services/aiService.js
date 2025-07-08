/**
 * AI Service - OpenRouter Integration
 * Advanced AI capabilities for Quiet Craft Solutions
 */

const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    this.defaultModel = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';
    this.fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || 'openai/gpt-3.5-turbo';
    this.appName = 'Quiet Craft Solutions';
    this.appUrl = process.env.FRONTEND_URL || 'https://quietcrafting.com';
    
    // Initialize conversation contexts
    this.conversationContexts = new Map();
    
    // AI capabilities configuration
    this.capabilities = {
      maxTokens: 4000,
      temperature: 0.7,
      topP: 0.9,
      contextWindow: 10, // Keep last 10 messages
      timeout: 30000, // 30 seconds timeout
    };
    
    // Logistics-specific prompts and intents
    this.systemPrompts = this.getSystemPrompts();
    this.intentClassifiers = this.getIntentClassifiers();
  }

  getSystemPrompts() {
    return {
      default: `You are an AI Operations Agent for Quiet Craft Solutions, a premium event logistics company. You are intelligent, professional, and helpful.

Key capabilities:
- Event logistics coordination and planning
- Real-time quote generation based on distance and requirements
- Multi-venue event management
- Emergency logistics response
- 24/7 customer support

Company services:
- Time-critical deliveries for conferences, trade shows, festivals
- High-value & delicate goods handling (AV equipment, exhibition materials)
- Venue coordination and on-site support
- Temporary storage and warehousing
- Customs & documentation for international events
- Dedicated fleet & staff
- 24/7 emergency support

Guidelines:
- Always maintain a professional, knowledgeable tone
- Provide specific, actionable information
- Ask clarifying questions when needed
- Offer to generate quotes when appropriate
- Be proactive in suggesting additional services
- Handle emergencies with urgency and precision
- Use industry-specific terminology appropriately`,

      quote: `You are a logistics expert helping generate accurate quotes for event services. Focus on:
- Understanding event type, size, and complexity
- Determining exact locations (pickup and delivery)
- Assessing item types and quantities
- Identifying timeline requirements
- Calculating distance-based pricing
- Recommending appropriate service levels
- Explaining value propositions clearly`,

      emergency: `You are handling an emergency logistics situation. Priorities:
- Assess urgency and criticality immediately
- Gather essential information quickly
- Provide immediate assistance options
- Escalate to emergency team if needed
- Maintain calm, professional demeanor
- Offer real-time updates and communication`,

      technical: `You are providing technical logistics advice. Focus on:
- Equipment specifications and handling requirements
- Venue access and loading restrictions
- Timeline optimization and critical path planning
- Risk assessment and mitigation strategies
- Regulatory compliance and documentation
- Technology integration and tracking systems`
    };
  }

  getIntentClassifiers() {
    return {
      'get_quote': {
        patterns: ['quote', 'price', 'cost', 'how much', 'estimate', 'pricing', 'rate'],
        confidence: 0.8,
        systemPrompt: 'quote'
      },
      'emergency_service': {
        patterns: ['emergency', 'urgent', 'asap', 'immediately', 'rush', 'critical', 'last minute'],
        confidence: 0.9,
        systemPrompt: 'emergency'
      },
      'schedule_delivery': {
        patterns: ['schedule', 'book', 'arrange', 'set up', 'plan', 'coordinate'],
        confidence: 0.7,
        systemPrompt: 'default'
      },
      'track_shipment': {
        patterns: ['track', 'status', 'where is', 'update', 'progress', 'delivery status'],
        confidence: 0.8,
        systemPrompt: 'default'
      },
      'technical_advice': {
        patterns: ['how to', 'technical', 'specifications', 'requirements', 'setup', 'installation'],
        confidence: 0.7,
        systemPrompt: 'technical'
      },
      'general_inquiry': {
        patterns: ['what', 'how', 'why', 'when', 'where', 'help', 'info', 'about'],
        confidence: 0.5,
        systemPrompt: 'default'
      }
    };
  }

  async generateResponse(message, context = {}) {
    const startTime = Date.now();
    
    try {
      // Analyze intent and context
      const intentAnalysis = await this.analyzeIntent(message);
      const enrichedContext = await this.enrichContext(message, context, intentAnalysis);
      
      // Generate response using OpenRouter
      const response = await this.callOpenRouter(message, enrichedContext);
      
      // Post-process and enhance response
      const enhancedResponse = await this.enhanceResponse(response, enrichedContext);
      
      // Log interaction
      const duration = Date.now() - startTime;
      logger.logAIInteraction(
        context.userId || 'anonymous',
        message,
        enhancedResponse.content,
        enrichedContext.model,
        duration
      );

      return {
        success: true,
        content: enhancedResponse.content,
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence,
        suggestions: enhancedResponse.suggestions,
        actions: enhancedResponse.actions,
        metadata: {
          model: enrichedContext.model,
          duration,
          tokensUsed: response.usage?.total_tokens || 0,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.logError(error, { 
        message: message.substring(0, 100),
        context,
        service: 'AIService.generateResponse'
      });

      return {
        success: false,
        content: this.getFallbackResponse(message, context),
        error: this.sanitizeError(error),
        metadata: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    let bestMatch = { intent: 'general_inquiry', confidence: 0.5 };

    for (const [intent, config] of Object.entries(this.intentClassifiers)) {
      const matches = config.patterns.filter(pattern => 
        lowerMessage.includes(pattern.toLowerCase())
      ).length;
      
      const confidence = (matches / config.patterns.length) * config.confidence;
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { intent, confidence };
      }
    }

    return bestMatch;
  }

  async enrichContext(message, context, intentAnalysis) {
    const conversationId = context.conversationId || context.userId || 'default';
    
    // Get or create conversation context
    if (!this.conversationContexts.has(conversationId)) {
      this.conversationContexts.set(conversationId, {
        messages: [],
        userProfile: {},
        preferences: {},
        createdAt: new Date()
      });
    }

    const conversation = this.conversationContexts.get(conversationId);
    
    // Add current message to context
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      intent: intentAnalysis.intent
    });

    // Keep only recent messages within context window
    if (conversation.messages.length > this.capabilities.contextWindow) {
      conversation.messages = conversation.messages.slice(-this.capabilities.contextWindow);
    }

    // Select system prompt based on intent
    const systemPromptKey = this.intentClassifiers[intentAnalysis.intent]?.systemPrompt || 'default';
    const systemPrompt = this.systemPrompts[systemPromptKey];

    // Determine model based on complexity
    const model = this.selectModel(message, intentAnalysis);

    return {
      conversationId,
      conversation,
      systemPrompt,
      model,
      intent: intentAnalysis.intent,
      userContext: {
        userId: context.userId,
        sessionId: context.sessionId,
        isReturning: conversation.messages.length > 1,
        preferences: conversation.preferences
      }
    };
  }

  selectModel(message, intentAnalysis) {
    // Use more capable model for complex tasks
    const complexIntents = ['emergency_service', 'technical_advice', 'get_quote'];
    const isLongMessage = message.length > 500;
    const isComplexIntent = complexIntents.includes(intentAnalysis.intent);
    
    if (isComplexIntent || isLongMessage || intentAnalysis.confidence < 0.7) {
      return this.defaultModel; // Use primary model for complex tasks
    }
    
    return this.fallbackModel; // Use faster model for simple tasks
  }

  async callOpenRouter(message, enrichedContext) {
    const messages = [
      {
        role: 'system',
        content: enrichedContext.systemPrompt
      }
    ];

    // Add recent conversation history
    const recentMessages = enrichedContext.conversation.messages.slice(-5);
    for (const msg of recentMessages) {
      if (msg.role === 'assistant') {
        messages.push({
          role: 'assistant',
          content: msg.content
        });
      } else {
        messages.push({
          role: 'user',
          content: msg.content
        });
      }
    }

    const requestData = {
      model: enrichedContext.model,
      messages: messages,
      max_tokens: this.capabilities.maxTokens,
      temperature: this.capabilities.temperature,
      top_p: this.capabilities.topP,
      stream: false
    };

    try {
      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.appUrl,
          'X-Title': this.appName
        },
        timeout: this.capabilities.timeout
      });
      return response.data;
    } catch (error) {
      logger.logError(error, {
        message: 'Error calling OpenRouter API',
        context: enrichedContext,
        service: 'AIService.callOpenRouter'
      });
      throw new Error(this.sanitizeError(error));
    }
  }

  async enhanceResponse(response, enrichedContext) {
    const content = response.choices[0]?.message?.content || '';
    
    // Add conversation to context
    enrichedContext.conversation.messages.push({
      role: 'assistant',
      content: content,
      timestamp: new Date(),
      model: enrichedContext.model
    });

    // Generate suggestions based on intent
    const suggestions = this.generateSuggestions(enrichedContext.intent, content);
    
    // Generate action buttons
    const actions = this.generateActions(enrichedContext.intent, content);

    return {
      content,
      suggestions,
      actions
    };
  }

  generateSuggestions(intent, content) {
    const suggestions = [];

    switch (intent) {
      case 'get_quote':
        suggestions.push(
          'Tell me about your event details',
          'What type of items need delivery?',
          'When is your event date?',
          'Where is the pickup location?'
        );
        break;
      
      case 'emergency_service':
        suggestions.push(
          'I need immediate pickup',
          'This is time-critical',
          'Schedule emergency delivery',
          'Speak to emergency team'
        );
        break;

      case 'schedule_delivery':
        suggestions.push(
          'Book standard delivery',
          'Schedule venue setup',
          'Arrange equipment transport',
          'Plan multi-day event'
        );
        break;

      default:
        suggestions.push(
          'Get a quote',
          'Schedule delivery',
          'Track shipment',
          'Emergency service',
          'Contact support'
        );
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  generateActions(intent, content) {
    const actions = [];

    switch (intent) {
      case 'get_quote':
        actions.push(
          { text: '💰 Get Quote', action: 'open_quote_form', type: 'primary' },
          { text: '📞 Call Us', action: 'initiate_call', type: 'secondary' }
        );
        break;

      case 'emergency_service':
        actions.push(
          { text: '🚨 Emergency Service', action: 'emergency_booking', type: 'danger' },
          { text: '📞 Call Emergency Line', action: 'emergency_call', type: 'primary' }
        );
        break;

      case 'schedule_delivery':
        actions.push(
          { text: '📅 Schedule Delivery', action: 'open_scheduler', type: 'primary' },
          { text: '💰 Get Pricing', action: 'open_quote_form', type: 'secondary' }
        );
        break;

      default:
        actions.push(
          { text: '💰 Get Quote', action: 'open_quote_form', type: 'primary' },
          { text: '📞 Contact Us', action: 'initiate_call', type: 'secondary' }
        );
    }

    return actions;
  }

  getFallbackResponse(message, context) {
    const fallbackResponses = [
      "I apologize, but I'm experiencing a temporary issue. However, I'm here to help with your logistics needs! Could you please tell me more about your event or delivery requirements?",
      "I'm having a brief technical difficulty, but our team is always ready to assist. What type of event logistics support do you need today?",
      "While I sort out a technical issue, I'd love to help you with your event planning. Are you looking for delivery services, venue coordination, or something else?",
      "I'm currently experiencing a service interruption, but your logistics needs are important to us. Please let me know how I can assist with your event requirements."
    ];

    const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
    return fallbackResponses[randomIndex];
  }

  sanitizeError(error) {
    // Don't expose sensitive error details to clients
    if (error.response?.status === 401) {
      return 'Authentication issue with AI service';
    } else if (error.response?.status === 429) {
      return 'Service temporarily busy, please try again';
    } else if (error.response?.status >= 500) {
      return 'AI service temporarily unavailable';
    } else if (error.code === 'ECONNABORTED') {
      return 'Request timeout, please try again';
    }
    
    return 'Temporary service issue';
  }

  // Cleanup old conversation contexts
  cleanupContexts() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, context] of this.conversationContexts.entries()) {
      if (now - context.createdAt > maxAge) {
        this.conversationContexts.delete(id);
      }
    }
  }

  // Get conversation statistics
  getStats() {
    return {
      activeConversations: this.conversationContexts.size,
      totalMessages: Array.from(this.conversationContexts.values())
        .reduce((total, context) => total + context.messages.length, 0),
      models: {
        primary: this.defaultModel,
        fallback: this.fallbackModel
      },
      capabilities: this.capabilities
    };
  }
}

// Initialize service
const aiService = new AIService();

// Cleanup contexts every hour
setInterval(() => {
  aiService.cleanupContexts();
}, 60 * 60 * 1000);

module.exports = aiService;
