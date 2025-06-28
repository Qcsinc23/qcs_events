/**
 * Quote Routes - Pricing and Quote Generation API
 * Handles quote requests, pricing calculations, and quote management
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const pricingService = require('../services/pricingService');
const mapsService = require('../services/mapsService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation schemas
const validateQuoteRequest = [
  body('pickup')
    .notEmpty()
    .isString()
    .isLength({ min: 5, max: 200 })
    .withMessage('Pickup location is required and must be 5-200 characters'),
  body('delivery')
    .notEmpty()
    .isString()
    .isLength({ min: 5, max: 200 })
    .withMessage('Delivery location is required and must be 5-200 characters'),
  body('eventType')
    .optional()
    .isIn(['conference', 'tradeShow', 'festival', 'corporateEvent', 'wedding', 'exhibition', 'concert', 'sportingEvent'])
    .withMessage('Invalid event type'),
  body('serviceLevel')
    .optional()
    .isIn(['standard', 'nextDay', 'sameDay', 'emergency'])
    .withMessage('Invalid service level'),
  body('eventDate')
    .optional()
    .isISO8601()
    .withMessage('Event date must be a valid ISO 8601 date'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  body('items.*.description')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Item description must be a string with max 200 characters'),
  body('items.*.size')
    .optional()
    .isIn(['small', 'medium', 'large', 'extraLarge'])
    .withMessage('Invalid item size'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Item quantity must be between 1 and 1000'),
  body('additionalServices')
    .optional()
    .isArray()
    .withMessage('Additional services must be an array'),
  body('declaredValue')
    .optional()
    .isFloat({ min: 0, max: 10000000 })
    .withMessage('Declared value must be between 0 and 10,000,000'),
  body('contactInfo.name')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Contact name must be a string with max 100 characters'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be valid'),
  body('contactInfo.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Contact phone must be valid')
];

const validateDistanceRequest = [
  query('origin')
    .notEmpty()
    .isString()
    .isLength({ min: 3, max: 200 })
    .withMessage('Origin is required and must be 3-200 characters'),
  query('destination')
    .notEmpty()
    .isString()
    .isLength({ min: 3, max: 200 })
    .withMessage('Destination is required and must be 3-200 characters'),
  query('mode')
    .optional()
    .isIn(['driving', 'walking', 'bicycling', 'transit'])
    .withMessage('Invalid travel mode')
];

// Generate comprehensive quote
router.post('/', validateQuoteRequest, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }

  const startTime = Date.now();
  
  try {
    // Generate the quote
    const quote = await pricingService.generateQuote(req.body);

    // Log quote generation
    logger.info('Quote generated successfully', {
      quoteId: quote.quoteId,
      total: quote.total,
      pickup: req.body.pickup,
      delivery: req.body.delivery,
      eventType: req.body.eventType,
      processingTime: Date.now() - startTime
    });

    res.json({
      success: true,
      quote,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'quote generation',
      request: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Quote generation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// Quick pricing estimate (simplified)
router.post('/estimate', [
  body('pickup').notEmpty().withMessage('Pickup location required'),
  body('delivery').notEmpty().withMessage('Delivery location required'),
  body('serviceLevel').optional().isIn(['standard', 'nextDay', 'sameDay', 'emergency'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  try {
    // Calculate distance
    const distanceInfo = await mapsService.calculateDistance(
      req.body.pickup,
      req.body.delivery
    );

    // Generate simplified estimate
    const baseFee = 75.00;
    const distanceFee = pricingService.calculateDistanceFee(distanceInfo.distance.miles);
    const serviceFee = pricingService.pricing.serviceLevels[req.body.serviceLevel || 'standard'];
    
    const estimate = baseFee + distanceFee + serviceFee;

    res.json({
      success: true,
      estimate: {
        basePrice: Math.round(estimate * 100) / 100,
        priceRange: {
          min: Math.round(estimate * 0.9 * 100) / 100,
          max: Math.round(estimate * 1.3 * 100) / 100
        },
        distance: distanceInfo.distance,
        estimatedTime: distanceInfo.duration,
        serviceLevel: req.body.serviceLevel || 'standard'
      },
      note: 'This is a preliminary estimate. Request a detailed quote for accurate pricing.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'price estimation',
      pickup: req.body.pickup,
      delivery: req.body.delivery
    });

    res.status(500).json({
      success: false,
      error: 'Estimation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// Calculate distance between locations
router.get('/distance', validateDistanceRequest, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { origin, destination, mode = 'driving' } = req.query;

  try {
    const distanceInfo = await mapsService.calculateDistance(origin, destination, mode);

    res.json({
      success: true,
      distance: distanceInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'distance calculation',
      origin,
      destination,
      mode
    });

    res.status(500).json({
      success: false,
      error: 'Distance calculation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// Geocode address
router.get('/geocode', [
  query('address')
    .notEmpty()
    .isString()
    .isLength({ min: 3, max: 200 })
    .withMessage('Address is required and must be 3-200 characters')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { address } = req.query;

  try {
    const geocodeResult = await mapsService.geocodeAddress(address);

    res.json({
      success: true,
      geocoding: geocodeResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'geocoding',
      address
    });

    res.status(500).json({
      success: false,
      error: 'Geocoding failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// Get pricing configuration (public rates)
router.get('/pricing', catchAsync(async (req, res) => {
  const pricingInfo = {
    baseFee: pricingService.pricing.baseFee,
    distanceTiers: pricingService.pricing.distanceTiers,
    serviceLevels: pricingService.pricing.serviceLevels,
    itemFees: {
      small: pricingService.pricing.itemFees.small,
      medium: pricingService.pricing.itemFees.medium,
      large: pricingService.pricing.itemFees.large,
      extraLarge: pricingService.pricing.itemFees.extraLarge
    },
    additionalServices: pricingService.pricing.additionalServices,
    eventTypes: Object.keys(pricingService.pricing.eventTypes),
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    pricing: pricingInfo,
    note: 'Base pricing rates. Final quotes may include additional fees and multipliers.',
    timestamp: new Date().toISOString()
  });
}));

// AI-powered quote assistance
router.post('/ai-quote', [
  body('message')
    .notEmpty()
    .isString()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { message, context = {} } = req.body;

  try {
    // Enhanced context for quote-focused AI response
    const quoteContext = {
      ...context,
      mode: 'quote_assistance',
      userId: req.auth?.userId || `anon_${req.ip.replace(/\./g, '_')}`,
      timestamp: new Date().toISOString()
    };

    // Get AI response focused on quote generation
    const aiResponse = await aiService.generateResponse(message, quoteContext);

    // Extract potential quote parameters from AI analysis
    const extractedParams = this.extractQuoteParams(message);

    res.json({
      success: true,
      aiResponse: {
        message: aiResponse.content,
        intent: aiResponse.intent,
        suggestions: aiResponse.suggestions,
        actions: aiResponse.actions
      },
      extractedParams,
      nextSteps: this.getNextSteps(aiResponse.intent, extractedParams),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'AI quote assistance',
      message: message.substring(0, 100)
    });

    res.status(500).json({
      success: false,
      error: 'AI assistance failed',
      message: 'Unable to process quote assistance request',
      timestamp: new Date().toISOString()
    });
  }
}));

// Get quote analytics (admin only)
router.get('/analytics', catchAsync(async (req, res) => {
  // Basic admin check
  const isAdmin = req.auth?.userId && process.env.SUPER_ADMIN_IDS?.includes(req.auth.userId);
  
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Admin access required',
      timestamp: new Date().toISOString()
    });
  }

  const analytics = pricingService.getAnalytics();
  const mapsStats = mapsService.getCacheStats();

  res.json({
    success: true,
    analytics: {
      quotes: analytics,
      maps: mapsStats,
      timestamp: new Date().toISOString()
    }
  });
}));

// Health check for quote service
router.get('/health', catchAsync(async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'quote',
    components: {
      pricing: 'operational',
      maps: {
        status: mapsService.apiKey ? 'operational' : 'limited',
        configured: !!process.env.GOOGLE_MAPS_API_KEY
      },
      ai: {
        status: 'operational',
        configured: !!process.env.OPENROUTER_API_KEY
      }
    },
    timestamp: new Date().toISOString()
  };

  res.json(health);
}));

// Helper function to extract quote parameters from natural language
function extractQuoteParams(message) {
  const params = {};
  const lowerMessage = message.toLowerCase();

  // Extract event types
  const eventTypes = ['conference', 'trade show', 'festival', 'corporate', 'wedding', 'exhibition', 'concert'];
  for (const type of eventTypes) {
    if (lowerMessage.includes(type)) {
      params.eventType = type === 'trade show' ? 'tradeShow' : type === 'corporate' ? 'corporateEvent' : type;
      break;
    }
  }

  // Extract urgency
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
    params.serviceLevel = 'emergency';
  } else if (lowerMessage.includes('same day')) {
    params.serviceLevel = 'sameDay';
  } else if (lowerMessage.includes('next day')) {
    params.serviceLevel = 'nextDay';
  }

  // Extract locations (basic pattern matching)
  const fromMatch = message.match(/from\s+([^,\n]+)/i);
  const toMatch = message.match(/to\s+([^,\n]+)/i);
  
  if (fromMatch) params.pickup = fromMatch[1].trim();
  if (toMatch) params.delivery = toMatch[1].trim();

  return params;
}

// Helper function to determine next steps
function getNextSteps(intent, extractedParams) {
  const steps = [];

  if (intent === 'get_quote' || intent === 'schedule_delivery') {
    if (!extractedParams.pickup) {
      steps.push('Specify pickup location');
    }
    if (!extractedParams.delivery) {
      steps.push('Specify delivery location');
    }
    if (!extractedParams.eventType) {
      steps.push('Indicate event type');
    }
    
    if (steps.length === 0) {
      steps.push('Generate detailed quote');
    }
  }

  return steps;
}

module.exports = router;
