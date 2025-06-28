/**
 * Chat Routes - AI-Powered Conversation API
 * Handles all chat interactions for Quiet Craft Solutions
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Message must be between 1 and 4000 characters'),
  body('conversationId')
    .optional()
    .isUUID()
    .withMessage('Conversation ID must be a valid UUID'),
  body('userId')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('User ID must be a string with max 100 characters'),
  body('sessionId')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Session ID must be a string with max 100 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
];

const validateChatHistory = [
  query('conversationId')
    .isUUID()
    .withMessage('Conversation ID must be a valid UUID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a positive integer')
];

// Main chat endpoint
router.post('/', validateChatMessage, catchAsync(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }

  const { message, conversationId, userId, sessionId, context = {} } = req.body;

  // Enhanced context with request metadata
  const enrichedContext = {
    ...context,
    conversationId: conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: userId || req.auth?.userId || `anon_${req.ip.replace(/\./g, '_')}`,
    sessionId: sessionId || req.sessionID || `sess_${Date.now()}`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: req.id
  };

  logger.info('Chat request', {
    userId: enrichedContext.userId,
    messageLength: message.length,
    conversationId: enrichedContext.conversationId,
    ip: req.ip
  });

  try {
    // Generate AI response
    const aiResponse = await aiService.generateResponse(message, enrichedContext);

    if (aiResponse.success) {
      res.json({
        success: true,
        message: aiResponse.content,
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        suggestions: aiResponse.suggestions,
        actions: aiResponse.actions,
        conversationId: enrichedContext.conversationId,
        metadata: {
          ...aiResponse.metadata,
          requestId: req.id
        }
      });
    } else {
      res.status(503).json({
        success: false,
        message: aiResponse.content,
        error: aiResponse.error,
        conversationId: enrichedContext.conversationId,
        metadata: {
          ...aiResponse.metadata,
          requestId: req.id
        }
      });
    }

  } catch (error) {
    logger.logError(error, {
      service: 'chat',
      userId: enrichedContext.userId,
      conversationId: enrichedContext.conversationId
    });

    res.status(500).json({
      success: false,
      message: "I apologize, but I'm experiencing technical difficulties. Our team has been notified and will resolve this quickly. How can I help you in the meantime?",
      error: 'Internal server error',
      conversationId: enrichedContext.conversationId,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
}));

// Get conversation history
router.get('/history', validateChatHistory, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }

  const { conversationId, limit = 20, offset = 0 } = req.query;

  // Get conversation history from AI service
  const conversation = aiService.conversationContexts.get(conversationId);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found',
      message: 'The requested conversation does not exist or has expired',
      timestamp: new Date().toISOString()
    });
  }

  const messages = conversation.messages
    .slice(offset, offset + parseInt(limit))
    .map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      intent: msg.intent
    }));

  res.json({
    success: true,
    conversationId,
    messages,
    totalMessages: conversation.messages.length,
    hasMore: offset + parseInt(limit) < conversation.messages.length,
    metadata: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      timestamp: new Date().toISOString()
    }
  });
}));

// Get AI service statistics (admin only)
router.get('/stats', catchAsync(async (req, res) => {
  // Check if user is admin (basic implementation)
  const isAdmin = req.auth?.userId && process.env.SUPER_ADMIN_IDS?.includes(req.auth.userId);
  
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Admin access required',
      timestamp: new Date().toISOString()
    });
  }

  const stats = aiService.getStats();
  
  res.json({
    success: true,
    stats,
    timestamp: new Date().toISOString()
  });
}));

// Health check for chat service
router.get('/health', catchAsync(async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'chat',
    aiService: {
      configured: !!process.env.OPENROUTER_API_KEY,
      model: aiService.defaultModel,
      fallbackModel: aiService.fallbackModel
    },
    activeConversations: aiService.conversationContexts.size,
    timestamp: new Date().toISOString()
  };

  res.json(health);
}));

// Intent analysis endpoint (for testing)
router.post('/analyze-intent', [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { message } = req.body;
  const intentAnalysis = await aiService.analyzeIntent(message);

  res.json({
    success: true,
    message,
    intent: intentAnalysis.intent,
    confidence: intentAnalysis.confidence,
    availableIntents: Object.keys(aiService.intentClassifiers),
    timestamp: new Date().toISOString()
  });
}));

// Clear conversation context (user action)
router.delete('/conversation/:conversationId', catchAsync(async (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid conversation ID',
      timestamp: new Date().toISOString()
    });
  }

  const existed = aiService.conversationContexts.has(conversationId);
  aiService.conversationContexts.delete(conversationId);

  res.json({
    success: true,
    message: existed ? 'Conversation cleared successfully' : 'Conversation not found',
    conversationId,
    timestamp: new Date().toISOString()
  });
}));

// Feedback endpoint for improving AI responses
router.post('/feedback', [
  body('conversationId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Conversation ID is required'),
  body('messageIndex')
    .isInt({ min: 0 })
    .withMessage('Message index must be a positive integer'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be a string with max 1000 characters')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { conversationId, messageIndex, rating, feedback } = req.body;

  // Log feedback for analysis
  logger.info('Chat feedback received', {
    conversationId,
    messageIndex,
    rating,
    feedback: feedback?.substring(0, 100),
    userId: req.auth?.userId || 'anonymous',
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Thank you for your feedback! It helps us improve our service.',
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
