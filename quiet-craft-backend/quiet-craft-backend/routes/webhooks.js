/**
 * Webhooks Routes - External Integration Handlers
 * Handles webhooks from Clerk, payment providers, and other external services
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

// Webhook signature verification middleware
const verifyWebhookSignature = (secretEnvVar) => {
  return (req, res, next) => {
    const signature = req.headers['x-webhook-signature'] || req.headers['stripe-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const secret = process.env[secretEnvVar];

    if (!secret) {
      logger.warn(`Webhook secret not configured: ${secretEnvVar}`);
      return res.status(500).json({
        error: 'Webhook not configured',
        timestamp: new Date().toISOString()
      });
    }

    if (!signature) {
      logger.logSecurity('WEBHOOK_MISSING_SIGNATURE', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });

      return res.status(400).json({
        error: 'Missing webhook signature',
        timestamp: new Date().toISOString()
      });
    }

    try {
      // Verify signature (implementation depends on the webhook provider)
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        logger.logSecurity('WEBHOOK_INVALID_SIGNATURE', {
          ip: req.ip,
          endpoint: req.originalUrl,
          providedSignature: signature.substring(0, 10) + '...'
        });

        return res.status(401).json({
          error: 'Invalid webhook signature',
          timestamp: new Date().toISOString()
        });
      }

      next();

    } catch (error) {
      logger.logError(error, {
        service: 'webhook signature verification',
        endpoint: req.originalUrl,
        ip: req.ip
      });

      res.status(400).json({
        error: 'Signature verification failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Clerk authentication webhooks
router.post('/clerk', express.raw({ type: 'application/json' }), catchAsync(async (req, res) => {
  try {
    const payload = JSON.parse(req.body);
    const { type, data } = payload;

    logger.info('Clerk webhook received', {
      type,
      userId: data?.id,
      timestamp: new Date().toISOString()
    });

    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;

      case 'user.updated':
        await handleUserUpdated(data);
        break;

      case 'user.deleted':
        await handleUserDeleted(data);
        break;

      case 'session.created':
        await handleSessionCreated(data);
        break;

      case 'session.ended':
        await handleSessionEnded(data);
        break;

      case 'organization.created':
        await handleOrganizationCreated(data);
        break;

      case 'organizationMembership.created':
        await handleOrganizationMembershipCreated(data);
        break;

      default:
        logger.warn('Unknown Clerk webhook type', { type, data });
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'clerk webhook',
      payload: req.body?.toString().substring(0, 200)
    });

    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// Payment webhooks (placeholder for Stripe, PayPal, etc.)
router.post('/payment', express.raw({ type: 'application/json' }), verifyWebhookSignature('PAYMENT_WEBHOOK_SECRET'), catchAsync(async (req, res) => {
  try {
    const payload = JSON.parse(req.body);
    const { type, data } = payload;

    logger.info('Payment webhook received', {
      type,
      paymentId: data?.id,
      amount: data?.amount,
      timestamp: new Date().toISOString()
    });

    switch (type) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(data);
        break;

      case 'payment.failed':
        await handlePaymentFailed(data);
        break;

      case 'payment.refunded':
        await handlePaymentRefunded(data);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(data);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(data);
        break;

      default:
        logger.warn('Unknown payment webhook type', { type, data });
    }

    res.json({
      success: true,
      message: 'Payment webhook processed',
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'payment webhook',
      payload: req.body?.toString().substring(0, 200)
    });

    res.status(500).json({
      success: false,
      error: 'Payment webhook processing failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// Generic webhook endpoint for other integrations
router.post('/generic/:provider', [
  body('type').notEmpty().withMessage('Webhook type is required'),
  body('data').isObject().withMessage('Webhook data must be an object')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { provider } = req.params;
  const { type, data } = req.body;

  try {
    logger.info('Generic webhook received', {
      provider,
      type,
      dataKeys: Object.keys(data),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Route to appropriate handler based on provider
    switch (provider) {
      case 'calendar':
        await handleCalendarWebhook(type, data);
        break;

      case 'crm':
        await handleCRMWebhook(type, data);
        break;

      case 'notification':
        await handleNotificationWebhook(type, data);
        break;

      default:
        logger.warn('Unknown webhook provider', { provider, type });
    }

    res.json({
      success: true,
      message: `${provider} webhook processed`,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'generic webhook',
      provider,
      type,
      data
    });

    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// Webhook event log (admin only)
router.get('/logs', catchAsync(async (req, res) => {
  // This would require admin authentication in a real implementation
  const webhookLogs = [
    {
      id: '1',
      provider: 'clerk',
      type: 'user.created',
      timestamp: new Date().toISOString(),
      status: 'success',
      processingTime: '45ms'
    }
    // More webhook logs would be retrieved from database
  ];

  res.json({
    success: true,
    logs: webhookLogs,
    timestamp: new Date().toISOString()
  });
}));

// Webhook handler functions
async function handleUserCreated(userData) {
  try {
    // Store user information in local database
    logger.info('New user created', {
      userId: userData.id,
      email: userData.email_addresses?.[0]?.email_address,
      createdAt: userData.created_at
    });

    // TODO: Create user record in local database
    // TODO: Send welcome email
    // TODO: Set up default preferences

  } catch (error) {
    logger.logError(error, { handler: 'handleUserCreated', userData });
    throw error;
  }
}

async function handleUserUpdated(userData) {
  try {
    logger.info('User updated', {
      userId: userData.id,
      updatedAt: userData.updated_at
    });

    // TODO: Update user record in local database

  } catch (error) {
    logger.logError(error, { handler: 'handleUserUpdated', userData });
    throw error;
  }
}

async function handleUserDeleted(userData) {
  try {
    logger.info('User deleted', {
      userId: userData.id,
      deletedAt: new Date().toISOString()
    });

    // TODO: Handle user deletion
    // TODO: Anonymize user data
    // TODO: Cancel any active services

  } catch (error) {
    logger.logError(error, { handler: 'handleUserDeleted', userData });
    throw error;
  }
}

async function handleSessionCreated(sessionData) {
  try {
    logger.info('Session created', {
      sessionId: sessionData.id,
      userId: sessionData.user_id,
      createdAt: sessionData.created_at
    });

    // TODO: Track user session analytics

  } catch (error) {
    logger.logError(error, { handler: 'handleSessionCreated', sessionData });
    throw error;
  }
}

async function handleSessionEnded(sessionData) {
  try {
    logger.info('Session ended', {
      sessionId: sessionData.id,
      userId: sessionData.user_id,
      endedAt: new Date().toISOString()
    });

    // TODO: Update session analytics

  } catch (error) {
    logger.logError(error, { handler: 'handleSessionEnded', sessionData });
    throw error;
  }
}

async function handleOrganizationCreated(orgData) {
  try {
    logger.info('Organization created', {
      orgId: orgData.id,
      name: orgData.name,
      createdAt: orgData.created_at
    });

    // TODO: Set up organization in local database
    // TODO: Configure organization settings

  } catch (error) {
    logger.logError(error, { handler: 'handleOrganizationCreated', orgData });
    throw error;
  }
}

async function handleOrganizationMembershipCreated(membershipData) {
  try {
    logger.info('Organization membership created', {
      membershipId: membershipData.id,
      userId: membershipData.user_id,
      orgId: membershipData.organization_id,
      role: membershipData.role
    });

    // TODO: Update user permissions based on organization role

  } catch (error) {
    logger.logError(error, { handler: 'handleOrganizationMembershipCreated', membershipData });
    throw error;
  }
}

async function handlePaymentSucceeded(paymentData) {
  try {
    logger.info('Payment succeeded', {
      paymentId: paymentData.id,
      amount: paymentData.amount,
      currency: paymentData.currency
    });

    // TODO: Update order status
    // TODO: Send confirmation email
    // TODO: Activate services

  } catch (error) {
    logger.logError(error, { handler: 'handlePaymentSucceeded', paymentData });
    throw error;
  }
}

async function handlePaymentFailed(paymentData) {
  try {
    logger.info('Payment failed', {
      paymentId: paymentData.id,
      amount: paymentData.amount,
      reason: paymentData.failure_reason
    });

    // TODO: Handle failed payment
    // TODO: Send notification to user
    // TODO: Retry logic if appropriate

  } catch (error) {
    logger.logError(error, { handler: 'handlePaymentFailed', paymentData });
    throw error;
  }
}

async function handlePaymentRefunded(paymentData) {
  try {
    logger.info('Payment refunded', {
      paymentId: paymentData.id,
      refundAmount: paymentData.refund_amount
    });

    // TODO: Process refund
    // TODO: Update order status
    // TODO: Send refund confirmation

  } catch (error) {
    logger.logError(error, { handler: 'handlePaymentRefunded', paymentData });
    throw error;
  }
}

async function handleSubscriptionCreated(subscriptionData) {
  try {
    logger.info('Subscription created', {
      subscriptionId: subscriptionData.id,
      customerId: subscriptionData.customer_id,
      plan: subscriptionData.plan
    });

    // TODO: Activate subscription features
    // TODO: Update user permissions

  } catch (error) {
    logger.logError(error, { handler: 'handleSubscriptionCreated', subscriptionData });
    throw error;
  }
}

async function handleSubscriptionCancelled(subscriptionData) {
  try {
    logger.info('Subscription cancelled', {
      subscriptionId: subscriptionData.id,
      customerId: subscriptionData.customer_id,
      cancelledAt: subscriptionData.cancelled_at
    });

    // TODO: Deactivate subscription features
    // TODO: Update user permissions
    // TODO: Send cancellation confirmation

  } catch (error) {
    logger.logError(error, { handler: 'handleSubscriptionCancelled', subscriptionData });
    throw error;
  }
}

async function handleCalendarWebhook(type, data) {
  logger.info('Calendar webhook', { type, data });
  // TODO: Implement calendar integration logic
}

async function handleCRMWebhook(type, data) {
  logger.info('CRM webhook', { type, data });
  // TODO: Implement CRM integration logic
}

async function handleNotificationWebhook(type, data) {
  logger.info('Notification webhook', { type, data });
  // TODO: Implement notification logic
}

module.exports = router;
