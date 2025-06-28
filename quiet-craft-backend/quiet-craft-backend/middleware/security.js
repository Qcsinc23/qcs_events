/**
 * Security Middleware
 * Additional security measures for the Quiet Craft Solutions backend
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Request ID middleware
const requestId = (req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
};

// IP whitelist for admin endpoints (if needed)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No IP filtering
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.includes(clientIP)) {
      next();
    } else {
      logger.logSecurity('IP_BLOCKED', { 
        ip: clientIP, 
        url: req.originalUrl,
        userAgent: req.get('User-Agent')
      });
      
      res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this resource',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Suspicious activity detection
const suspiciousActivityDetector = (req, res, next) => {
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/proc\/|\/dev\/)/i, // Path traversal
    /(script|javascript|vbscript):/i,   // Script injection
    /(<script|<iframe|<object)/i,       // HTML injection
    /(union|select|insert|delete|drop|create|alter)/i, // SQL injection
    /(eval|exec|system|shell_exec)/i,   // Code execution
  ];

  const userAgent = req.get('User-Agent') || '';
  const url = req.originalUrl;
  const body = JSON.stringify(req.body || {});
  const params = JSON.stringify(req.params || {});
  const query = JSON.stringify(req.query || {});

  const testData = `${url} ${body} ${params} ${query} ${userAgent}`;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(testData)) {
      logger.logSecurity('SUSPICIOUS_ACTIVITY', {
        pattern: pattern.toString(),
        ip: req.ip,
        userAgent,
        url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
      });

      // Don't block, just log for now
      break;
    }
  }

  next();
};

// Bot detection middleware
const botDetection = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /postman/i, /insomnia/i
  ];

  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  if (isBot) {
    // Log bot activity
    logger.info('Bot detected', {
      ip: req.ip,
      userAgent,
      url: req.originalUrl,
      method: req.method
    });

    // Add bot flag to request
    req.isBot = true;
  }

  next();
};

// API key validation for external integrations
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKeys = (process.env.VALID_API_KEYS || '').split(',').filter(Boolean);

  if (validApiKeys.length === 0) {
    return next(); // No API key validation configured
  }

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the X-API-Key header',
      timestamp: new Date().toISOString()
    });
  }

  if (!validApiKeys.includes(apiKey)) {
    logger.logSecurity('INVALID_API_KEY', {
      apiKey: apiKey.substring(0, 8) + '***',
      ip: req.ip,
      url: req.originalUrl
    });

    return res.status(403).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Honeypot middleware (trap for bots)
const honeypot = (req, res, next) => {
  // Check for honeypot field in POST requests
  if (req.method === 'POST' && req.body && req.body.website) {
    // If honeypot field is filled, it's likely a bot
    logger.logSecurity('HONEYPOT_TRIGGERED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      honeypotValue: req.body.website
    });

    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please try again',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Content type validation
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type');
      
      if (!contentType) {
        return res.status(400).json({
          error: 'Content-Type required',
          message: 'Please specify a Content-Type header',
          timestamp: new Date().toISOString()
        });
      }

      const isValidType = allowedTypes.some(type => 
        contentType.toLowerCase().includes(type.toLowerCase())
      );

      if (!isValidType) {
        return res.status(415).json({
          error: 'Unsupported Media Type',
          message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    next();
  };
};

// Comprehensive security middleware combination
const securityMiddleware = [
  requestId,
  suspiciousActivityDetector,
  botDetection,
  honeypot,
  validateContentType(['application/json', 'multipart/form-data'])
];

module.exports = {
  requestId,
  ipWhitelist,
  suspiciousActivityDetector,
  botDetection,
  validateApiKey,
  honeypot,
  validateContentType,
  securityMiddleware
};
