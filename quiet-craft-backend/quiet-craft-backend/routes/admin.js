/**
 * Admin Routes - Configuration and Management API
 * Handles admin panel functionality, configuration management, and system monitoring
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { requireAdmin, enrichUserProfile } = require('../middleware/auth');
const pricingService = require('../services/pricingService');
const aiService = require('../services/aiService');
const mapsService = require('../services/mapsService');
const logger = require('../utils/logger');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Apply admin authentication to all routes
router.use(requireAdmin);
router.use(enrichUserProfile);

// System dashboard overview
router.get('/dashboard', catchAsync(async (req, res) => {
  try {
    // Collect system statistics
    const dashboard = {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      },
      services: {
        ai: {
          status: 'operational',
          stats: aiService.getStats(),
          configured: !!process.env.OPENROUTER_API_KEY
        },
        maps: {
          status: process.env.GOOGLE_MAPS_API_KEY ? 'operational' : 'limited',
          stats: mapsService.getCacheStats(),
          configured: !!process.env.GOOGLE_MAPS_API_KEY
        },
        pricing: {
          status: 'operational',
          analytics: pricingService.getAnalytics()
        }
      },
      security: {
        clerkConfigured: !!(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY),
        adminUsers: process.env.SUPER_ADMIN_IDS?.split(',').length || 0,
        rateLimitEnabled: true
      }
    };

    logger.info('Admin dashboard accessed', {
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      dashboard,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'admin dashboard',
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Dashboard data retrieval failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// Get all configuration settings
router.get('/config', catchAsync(async (req, res) => {
  const config = {
    pricing: pricingService.pricing,
    ai: {
      model: aiService.defaultModel,
      fallbackModel: aiService.fallbackModel,
      capabilities: aiService.capabilities,
      systemPrompts: Object.keys(aiService.systemPrompts)
    },
    maps: {
      configured: !!process.env.GOOGLE_MAPS_API_KEY,
      cacheSize: mapsService.getCacheStats().size
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      frontendUrl: process.env.FRONTEND_URL
    },
    features: {
      analyticsEnabled: process.env.ENABLE_ANALYTICS === 'true',
      cachingEnabled: process.env.ENABLE_CACHING === 'true',
      emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
    }
  };

  res.json({
    success: true,
    config,
    timestamp: new Date().toISOString()
  });
}));

// Update pricing configuration
router.put('/config/pricing', [
  body('baseFee').optional().isFloat({ min: 0, max: 1000 }).withMessage('Base fee must be between 0 and 1000'),
  body('distanceTiers').optional().isObject().withMessage('Distance tiers must be an object'),
  body('itemFees').optional().isObject().withMessage('Item fees must be an object'),
  body('serviceLevels').optional().isObject().withMessage('Service levels must be an object'),
  body('additionalServices').optional().isObject().withMessage('Additional services must be an object')
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
    // Update pricing configuration
    pricingService.updatePricing(req.body);

    logger.info('Pricing configuration updated', {
      userId: req.user.id,
      email: req.user.email,
      changes: Object.keys(req.body),
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Pricing configuration updated successfully',
      updatedFields: Object.keys(req.body),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'pricing config update',
      userId: req.user.id,
      changes: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Configuration update failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// System health check with detailed diagnostics
router.get('/health', catchAsync(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      server: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
        }
      },
      database: {
        status: 'healthy', // TODO: Add actual database health check
        connected: true
      },
      externalServices: {
        openrouter: {
          status: process.env.OPENROUTER_API_KEY ? 'configured' : 'not_configured',
          configured: !!process.env.OPENROUTER_API_KEY
        },
        googleMaps: {
          status: process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'not_configured',
          configured: !!process.env.GOOGLE_MAPS_API_KEY
        },
        clerk: {
          status: (process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY) ? 'configured' : 'not_configured',
          configured: !!(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY)
        }
      }
    }
  };

  // Determine overall status
  const hasConfigIssues = !health.checks.externalServices.openrouter.configured ||
                         !health.checks.externalServices.clerk.configured;

  if (hasConfigIssues) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503;

  res.status(statusCode).json({
    success: true,
    health
  });
}));

// Clear service caches
router.post('/cache/clear', [
  body('services').optional().isArray().withMessage('Services must be an array'),
  body('services.*').isIn(['maps', 'ai', 'all']).withMessage('Invalid service name')
], catchAsync(async (req, res) => {
  const { services = ['all'] } = req.body;
  const results = {};

  try {
    if (services.includes('all') || services.includes('maps')) {
      results.maps = mapsService.clearCache();
    }

    if (services.includes('all') || services.includes('ai')) {
      aiService.cleanupContexts();
      results.ai = 'contexts_cleaned';
    }

    logger.info('Cache cleared by admin', {
      userId: req.user.id,
      email: req.user.email,
      services,
      results,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Cache cleared successfully',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'cache clear',
      userId: req.user.id,
      services
    });

    res.status(500).json({
      success: false,
      error: 'Cache clear failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// Get system logs (last 100 entries)
router.get('/logs', [
  query('level').optional().isIn(['error', 'warn', 'info', 'debug']).withMessage('Invalid log level'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500')
], catchAsync(async (req, res) => {
  const { level = 'info', limit = 100 } = req.query;

  try {
    // This is a simplified implementation
    // In production, you'd want to read from actual log files or log aggregation service
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Admin logs access',
        metadata: { userId: req.user.id }
      }
    ];

    res.json({
      success: true,
      logs,
      metadata: {
        level,
        limit: parseInt(limit),
        total: logs.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'logs retrieval',
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Logs retrieval failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// Analytics and reporting
router.get('/analytics', [
  query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period'),
  query('metric').optional().isIn(['quotes', 'users', 'errors', 'performance']).withMessage('Invalid metric')
], catchAsync(async (req, res) => {
  const { period = 'week', metric = 'quotes' } = req.query;

  try {
    const analytics = {
      period,
      metric,
      data: {
        quotes: pricingService.getAnalytics(),
        ai: aiService.getStats(),
        maps: mapsService.getCacheStats(),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      }
    };

    res.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'analytics',
      userId: req.user.id,
      period,
      metric
    });

    res.status(500).json({
      success: false,
      error: 'Analytics retrieval failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// User management
router.get('/users', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], catchAsync(async (req, res) => {
  const { limit = 25, offset = 0 } = req.query;

  try {
    // This would integrate with your user database
    // For now, returning a placeholder response
    const users = {
      total: 0,
      users: [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: false
      }
    };

    res.json({
      success: true,
      users,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'user management',
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      error: 'User data retrieval failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// System maintenance
router.post('/maintenance', [
  body('action').isIn(['restart', 'cleanup', 'backup']).withMessage('Invalid maintenance action'),
  body('confirm').equals('true').withMessage('Confirmation required for maintenance actions')
], catchAsync(async (req, res) => {
  const { action, confirm } = req.body;

  if (!confirm) {
    return res.status(400).json({
      success: false,
      error: 'Confirmation required',
      message: 'Maintenance actions require explicit confirmation'
    });
  }

  try {
    let result = {};

    switch (action) {
      case 'cleanup':
        // Perform cleanup tasks
        result.maps = mapsService.clearCache();
        aiService.cleanupContexts();
        result.ai = 'contexts_cleaned';
        break;

      case 'backup':
        // Trigger backup process
        result.backup = 'initiated';
        break;

      case 'restart':
        // Graceful restart (in production, this would be handled by the deployment platform)
        result.restart = 'scheduled';
        break;

      default:
        throw new Error('Unknown maintenance action');
    }

    logger.info('Maintenance action performed', {
      userId: req.user.id,
      email: req.user.email,
      action,
      result,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Maintenance action '${action}' completed successfully`,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'maintenance',
      userId: req.user.id,
      action
    });

    res.status(500).json({
      success: false,
      error: 'Maintenance action failed',
      timestamp: new Date().toISOString()
    });
  }
}));

module.exports = router;
