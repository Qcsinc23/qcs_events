/**
 * Authentication Middleware - Clerk Integration
 * Handles user authentication and authorization for Quiet Craft Solutions
 */

const { clerkClient } = require('@clerk/clerk-sdk-node');
const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

/**
 * Enhanced authentication middleware with role-based access
 */
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid authentication token',
        timestamp: new Date().toISOString()
      });
    }

    // Verify the token with Clerk
    const session = await clerkClient.sessions.verifySession(token);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
        message: 'Session has expired or is invalid',
        timestamp: new Date().toISOString()
      });
    }

    // Get user information
    const user = await clerkClient.users.getUser(session.userId);
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      lastSignInAt: user.lastSignInAt,
      createdAt: user.createdAt,
      metadata: user.publicMetadata || {}
    };

    req.session = session;

    // Log successful authentication
    logger.info('User authenticated', {
      userId: user.id,
      email: req.user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();

  } catch (error) {
    logger.logError(error, {
      service: 'authentication',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Unable to verify authentication',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // No token provided, continue as anonymous user
      req.user = null;
      req.session = null;
      return next();
    }

    // Try to authenticate
    const session = await clerkClient.sessions.verifySession(token);
    
    if (session) {
      const user = await clerkClient.users.getUser(session.userId);
      
      req.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        lastSignInAt: user.lastSignInAt,
        createdAt: user.createdAt,
        metadata: user.publicMetadata || {}
      };

      req.session = session;
    } else {
      req.user = null;
      req.session = null;
    }

    next();

  } catch (error) {
    // Don't fail on optional auth errors
    logger.warn('Optional authentication failed', {
      error: error.message,
      ip: req.ip
    });
    
    req.user = null;
    req.session = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (requiredRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        timestamp: new Date().toISOString()
      });
    }

    // Convert single role to array
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Check if user has any of the required roles
    const userRoles = req.user.metadata.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (roles.length > 0 && !hasRequiredRole) {
      logger.logSecurity('UNAUTHORIZED_ACCESS_ATTEMPT', {
        userId: req.user.id,
        email: req.user.email,
        requiredRoles: roles,
        userRoles: userRoles,
        resource: req.originalUrl,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have the required permissions to access this resource',
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Admin authorization middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please log in to access admin features',
      timestamp: new Date().toISOString()
    });
  }

  // Check if user is admin
  const isAdmin = req.user.metadata.roles?.includes('admin') ||
                  req.user.metadata.roles?.includes('super_admin') ||
                  process.env.SUPER_ADMIN_IDS?.split(',').includes(req.user.id);

  if (!isAdmin) {
    logger.logSecurity('ADMIN_ACCESS_DENIED', {
      userId: req.user.id,
      email: req.user.email,
      resource: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      message: 'This resource requires administrator privileges',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Rate limiting per user
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId).filter(time => time > windowStart);
      userRequests.set(userId, requests);
    } else {
      userRequests.set(userId, []);
    }

    const userRequestCount = userRequests.get(userId).length;

    if (userRequestCount >= maxRequests) {
      logger.logSecurity('RATE_LIMIT_EXCEEDED', {
        userId: req.user?.id,
        ip: req.ip,
        requestCount: userRequestCount,
        limit: maxRequests,
        window: windowMs
      });

      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds`,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }

    // Add current request
    userRequests.get(userId).push(now);
    next();
  };
};

/**
 * Session validation middleware
 */
const validateSession = async (req, res, next) => {
  if (!req.session) {
    return next();
  }

  try {
    // Check if session is still valid
    const currentSession = await clerkClient.sessions.getSession(req.session.id);
    
    if (currentSession.status !== 'active') {
      logger.warn('Inactive session detected', {
        sessionId: req.session.id,
        userId: req.user?.id,
        status: currentSession.status
      });

      return res.status(401).json({
        success: false,
        error: 'Session expired',
        message: 'Your session has expired. Please log in again.',
        timestamp: new Date().toISOString()
      });
    }

    next();

  } catch (error) {
    logger.logError(error, {
      service: 'session validation',
      sessionId: req.session?.id,
      userId: req.user?.id
    });

    res.status(401).json({
      success: false,
      error: 'Session validation failed',
      message: 'Unable to validate session',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * User profile enrichment middleware
 */
const enrichUserProfile = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  try {
    // Get additional user data from Clerk
    const user = await clerkClient.users.getUser(req.user.id);
    
    // Enrich user profile with latest data
    req.user = {
      ...req.user,
      emailAddresses: user.emailAddresses,
      phoneNumbers: user.phoneNumbers,
      externalAccounts: user.externalAccounts,
      organizationMemberships: user.organizationMemberships,
      lastActiveAt: user.lastActiveAt,
      banned: user.banned,
      locked: user.locked,
      profileImageUrl: user.profileImageUrl,
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
      unsafeMetadata: user.unsafeMetadata
    };

    next();

  } catch (error) {
    logger.warn('User profile enrichment failed', {
      userId: req.user.id,
      error: error.message
    });

    // Continue without enrichment
    next();
  }
};

/**
 * Organization-based authorization
 */
const requireOrganization = (orgRole = null) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    try {
      const organizationMemberships = await clerkClient.users.getOrganizationMembershipList({
        userId: req.user.id
      });

      if (organizationMemberships.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Organization membership required',
          message: 'You must be a member of an organization to access this resource',
          timestamp: new Date().toISOString()
        });
      }

      // Check specific role if required
      if (orgRole) {
        const hasRole = organizationMemberships.some(membership => 
          membership.role === orgRole
        );

        if (!hasRole) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient organization permissions',
            message: `Organization role '${orgRole}' required`,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Attach organization info to request
      req.userOrganizations = organizationMemberships;
      next();

    } catch (error) {
      logger.logError(error, {
        service: 'organization authorization',
        userId: req.user.id
      });

      res.status(500).json({
        success: false,
        error: 'Organization verification failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

module.exports = {
  authenticateUser,
  optionalAuth,
  requireRole,
  requireAdmin,
  userRateLimit,
  validateSession,
  enrichUserProfile,
  requireOrganization
};
