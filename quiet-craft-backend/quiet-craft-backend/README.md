# Quiet Craft Solutions - AI-Powered Logistics Backend

A comprehensive Node.js backend system providing AI-powered logistics services, real-time pricing, and enterprise-grade operations management.

## 🚀 Features

### Core Capabilities
- **AI-Powered Chat System** - Advanced conversational AI using OpenRouter
- **Dynamic Pricing Engine** - Real-time quote generation with Google Maps integration
- **Enterprise Authentication** - Clerk-based user management with role-based access
- **Real-time Analytics** - Comprehensive business intelligence and reporting
- **Admin Dashboard** - Complete system management and configuration
- **Webhook Integration** - Support for external service integrations

### Technical Features
- **Production-Ready Architecture** - Scalable, secure, and maintainable
- **PostgreSQL Database** - Robust data persistence with Sequelize ORM
- **Comprehensive Logging** - Winston-based logging with multiple transports
- **Security Hardened** - Helmet, CORS, rate limiting, and input validation
- **API Documentation** - RESTful APIs with comprehensive error handling
- **Health Monitoring** - Built-in health checks and system diagnostics

## 📋 Requirements

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 12.0
- **npm** >= 9.0.0

### External Services
- **Clerk** - Authentication provider
- **OpenRouter** - AI model access
- **Google Maps API** - Distance and geocoding services

## 🛠 Installation

### 1. Clone and Setup
```bash
git clone <repository-url>
cd quiet-craft-backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration values
```

### 3. Database Setup
```bash
# Create database
createdb quiet_craft_development

# Run migrations (when implemented)
npm run migrate

# Seed initial data (when implemented)
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 🔧 Configuration

### Required Environment Variables

#### Database
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/quiet_craft_db
```

#### Authentication (Clerk)
```env
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_KEY=your_jwt_key
```

#### AI Integration (OpenRouter)
```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_FALLBACK_MODEL=openai/gpt-3.5-turbo
```

#### Maps Integration (Google)
```env
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Optional Configuration

#### Pricing
```env
BASE_DELIVERY_FEE=75.00
DISTANCE_TIER_1_MAX=20
DISTANCE_TIER_2_MAX=50
DISTANCE_TIER_1_RATE=0.00
DISTANCE_TIER_2_RATE=1.50
DISTANCE_TIER_3_RATE=2.00
```

#### Admin Access
```env
SUPER_ADMIN_IDS=user_id_1,user_id_2
```

## 📡 API Endpoints

### Public Endpoints
- `GET /health` - System health check
- `POST /api/chat` - AI chat interactions
- `POST /api/quote` - Generate pricing quotes
- `POST /api/quote/estimate` - Quick price estimates
- `GET /api/quote/distance` - Distance calculations
- `GET /api/analytics/public` - Public metrics

### Authenticated Endpoints
- `GET /api/analytics/business` - Business metrics
- `POST /api/chat/feedback` - Chat feedback
- `GET /api/quote/pricing` - Pricing configuration

### Admin Endpoints
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/config` - System configuration
- `PUT /api/admin/config/pricing` - Update pricing
- `GET /api/admin/analytics` - Admin analytics
- `POST /api/admin/cache/clear` - Clear caches

### Webhook Endpoints
- `POST /api/webhooks/clerk` - Clerk authentication events
- `POST /api/webhooks/payment` - Payment processing events
- `POST /api/webhooks/generic/:provider` - Generic webhooks

## 🗄 Database Schema

### Core Models
- **Users** - User profiles and authentication data
- **Quotes** - Quote requests and pricing information
- **ChatSessions** - AI conversation tracking
- **Analytics** - Event tracking and business intelligence
- **Configurations** - System configuration storage

### Key Relationships
- Users → Quotes (One-to-Many)
- Users → ChatSessions (One-to-Many)
- Users → Analytics (One-to-Many)

## 🚀 Deployment

### Render.com (Recommended)

1. **Connect Repository**
   - Link your GitHub repository to Render
   - Use the included `render.yaml` configuration

2. **Set Environment Variables**
   - Configure all required environment variables in Render dashboard
   - Ensure database is connected

3. **Deploy**
   - Render will automatically build and deploy
   - Database migrations will run automatically

### Manual Deployment

1. **Build for Production**
```bash
npm run build
```

2. **Start Production Server**
```bash
NODE_ENV=production npm start
```

3. **Database Migration**
```bash
npm run migrate
```

## 🔍 Monitoring & Debugging

### Health Checks
- `GET /health` - Basic system health
- `GET /api/admin/health` - Detailed diagnostics
- `GET /api/chat/health` - Chat service status
- `GET /api/quote/health` - Quote service status

### Logging
- **File Logs**: `logs/combined.log`, `logs/error.log`
- **Console Output**: Structured JSON in production
- **Log Levels**: error, warn, info, debug

### Analytics
- **Real-time Metrics**: Available via admin dashboard
- **Business Intelligence**: User journeys, conversion funnels
- **Performance Monitoring**: Response times, error rates

## 🛡 Security Features

### Authentication & Authorization
- **Clerk Integration** - Enterprise-grade authentication
- **Role-Based Access** - User, admin, super admin roles
- **JWT Validation** - Secure token verification
- **Session Management** - Automatic session validation

### Security Middleware
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **Input Validation** - Data sanitization
- **SQL Injection Protection** - Parameterized queries

### Data Protection
- **Encrypted Storage** - Sensitive configuration encryption
- **Audit Trails** - All admin actions logged
- **IP Tracking** - Security event monitoring
- **Webhook Verification** - Signature validation

## 📊 Performance

### Caching Strategy
- **Distance Calculations** - 24-hour cache
- **AI Conversations** - Context memory management
- **Database Queries** - Connection pooling

### Optimization
- **Async Processing** - Non-blocking operations
- **Connection Pooling** - Database optimization
- **Compression** - Response compression
- **Memory Management** - Automatic cleanup

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### API Testing
Use the included Postman collection or:
```bash
curl -X GET http://localhost:3000/health
```

## 📝 Development

### Code Structure
```
src/
├── config/         # Configuration files
├── controllers/    # Business logic controllers
├── middleware/     # Express middleware
├── models/         # Database models
├── routes/         # API route definitions
├── services/       # Business services
├── utils/          # Utility functions
└── server.js       # Main application entry
```

### Adding New Features

1. **Create Model** (if needed)
```bash
# Add to models/ directory
# Update models/index.js associations
```

2. **Create Service**
```bash
# Add business logic to services/
```

3. **Create Routes**
```bash
# Add API endpoints to routes/
# Include validation and error handling
```

4. **Update Documentation**
```bash
# Update README.md
# Add API documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- **Documentation**: This README and inline code comments
- **Issues**: GitHub Issues for bug reports and feature requests
- **Email**: admin@quietcrafting.com

## 🎯 Roadmap

### Short Term
- [ ] Enhanced AI conversation flows
- [ ] Additional payment gateway integrations
- [ ] Mobile app API support
- [ ] Advanced analytics dashboards

### Long Term
- [ ] Multi-language support
- [ ] Machine learning optimization
- [ ] IoT device integrations
- [ ] Blockchain logistics tracking

---

**Built with ❤️ by MiniMax Agent for Quiet Craft Solutions**
