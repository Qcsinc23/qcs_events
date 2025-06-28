/**
 * Quiet Craft Solutions - AI-Powered Logistics Backend
 * Main server entry point with Express.js
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import middleware and routes
const { clerkMiddleware, requireAuth } = require('@clerk/express');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');

// Import route modules
const chatRoutes = require('./routes/chat');
const quoteRoutes = require('./routes/quote');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const webhookRoutes = require('./routes/webhooks');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for deployment platforms like Render
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});\n\n// Chat-specific rate limiting\nconst chatLimiter = rateLimit({\n  windowMs: 1 * 60 * 1000, // 1 minute\n  max: 20, // 20 chat messages per minute\n  message: 'Too many chat requests, please slow down.',\n});\n\n// Core middleware\napp.use(helmet({\n  contentSecurityPolicy: {\n    directives: {\n      defaultSrc: [\"'self'\"],\n      styleSrc: [\"'self'\", \"'unsafe-inline'\", 'https://fonts.googleapis.com'],\n      fontSrc: [\"'self'\", 'https://fonts.gstatic.com'],\n      scriptSrc: [\"'self'\", \"'unsafe-inline'\"],\n      imgSrc: [\"'self'\", 'data:', 'https:'],\n      connectSrc: [\"'self'\", 'https://api.openrouter.ai', 'https://maps.googleapis.com']\n    }\n  }\n}));\n\napp.use(compression());\napp.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));\napp.use(cors({\n  origin: process.env.NODE_ENV === 'production' \n    ? [process.env.FRONTEND_URL, 'https://rtzv3gryvb.space.minimax.io']\n    : ['http://localhost:3000', 'http://127.0.0.1:3000'],\n  credentials: true,\n  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],\n  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']\n}));\n\napp.use(express.json({ limit: '10mb' }));\napp.use(express.urlencoded({ extended: true, limit: '10mb' }));\napp.use(cookieParser());\napp.use(limiter);\n\n// Clerk authentication middleware\napp.use(clerkMiddleware());\n\n// Security middleware\napp.use(securityMiddleware);\n\n// Health check endpoint\napp.get('/health', (req, res) => {\n  res.status(200).json({\n    status: 'healthy',\n    timestamp: new Date().toISOString(),\n    uptime: process.uptime(),\n    environment: process.env.NODE_ENV || 'development',\n    version: require('./package.json').version\n  });\n});\n\n// API Routes\napp.use('/api/chat', chatLimiter, chatRoutes);\napp.use('/api/quote', quoteRoutes);\napp.use('/api/admin', requireAuth(), adminRoutes);\napp.use('/api/analytics', analyticsRoutes);\napp.use('/api/webhooks', webhookRoutes);\n\n// Serve static files in production\nif (process.env.NODE_ENV === 'production') {\n  app.use(express.static(path.join(__dirname, '../quiet-craft-website-enhanced')));\n  \n  app.get('*', (req, res) => {\n    res.sendFile(path.join(__dirname, '../quiet-craft-website-enhanced/index.html'));\n  });\n}\n\n// 404 handler\napp.use('*', (req, res) => {\n  res.status(404).json({\n    error: 'Endpoint not found',\n    message: `Cannot ${req.method} ${req.originalUrl}`,\n    timestamp: new Date().toISOString()\n  });\n});\n\n// Global error handler\napp.use(errorHandler);\n\n// Graceful shutdown\nprocess.on('SIGTERM', () => {\n  logger.info('SIGTERM received, shutting down gracefully');\n  process.exit(0);\n});\n\nprocess.on('SIGINT', () => {\n  logger.info('SIGINT received, shutting down gracefully');\n  process.exit(0);\n});\n\n// Start server\napp.listen(PORT, '0.0.0.0', () => {\n  logger.info(`🚀 Quiet Craft Backend running on port ${PORT}`);\n  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);\n  logger.info(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);\n  logger.info(`🤖 AI: OpenRouter integration ready`);\n  logger.info(`🗺️  Maps: Google Maps API integration ready`);\n  logger.info(`👤 Auth: Clerk authentication enabled`);\n});\n\n// Export for testing\nmodule.exports = app;\n"