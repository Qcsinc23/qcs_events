# Quiet Craft Solutions Inc. - AI-Powered Event Logistics Platform

A comprehensive event logistics management system featuring AI-powered chat support, dynamic pricing, real-time tracking, and enterprise-grade operations management.

## 🚀 Overview

Quiet Craft Solutions Inc. is a premier event logistics courier service specializing in time-critical deliveries for conferences, trade shows, festivals, and corporate events. This repository contains both the modern frontend website and the Node.js backend system that powers our AI-enhanced logistics platform.

## 📁 Project Structure

```
qcs_events/
├── quiet-craft-website-redesigned/    # Frontend application
│   ├── index.html                     # Main website
│   ├── test-quote.html               # Quote calculator testing
│   ├── css/                          # Stylesheets
│   ├── js/                           # JavaScript files
│   ├── images/                       # Image assets
│   └── chatbot/                      # AI chatbot system
├── quiet-craft-backend/              # Backend API server
│   └── quiet-craft-backend/
│       ├── server.js                 # Main server file
│       ├── config/                   # Configuration
│       ├── models/                   # Database models
│       ├── routes/                   # API routes
│       ├── services/                 # Business logic
│       └── middleware/               # Express middleware
├── imgs/                             # Additional image assets
├── render.yaml                       # Render.com deployment config
└── APPLICATION_REVIEW_REPORT.md      # Code review findings
```

## 🛠 Technology Stack

### Frontend
- **HTML5/CSS3**: Modern responsive design
- **JavaScript (ES6+)**: Interactive functionality
- **AI Chatbot**: OpenAI-powered customer support
- **Quote Calculator**: Dynamic pricing engine

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **PostgreSQL**: Database
- **Sequelize**: ORM
- **OpenRouter API**: AI integration
- **Google Maps API**: Distance calculations
- **Clerk**: Authentication

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 12.0
- npm >= 9.0.0

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/Qcsinc23/qcs_events.git
cd qcs_events
```

2. **Frontend Setup**
```bash
# The frontend is static and can be served with any web server
# For development, you can use Python's built-in server:
cd quiet-craft-website-redesigned
python -m http.server 8000
# Visit http://localhost:8000
```

3. **Backend Setup**
```bash
cd quiet-craft-backend/quiet-craft-backend
npm install

# Create .env file with required environment variables (see below)
# Set up PostgreSQL database
createdb quiet_craft_development

# Start the server
npm run dev
# API will be available at http://localhost:3000
```

## 🔑 Environment Variables

Create a `.env` file in the backend directory with:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/quiet_craft_db

# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_KEY=your_jwt_key

# AI Integration (OpenRouter)
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_FALLBACK_MODEL=openai/gpt-3.5-turbo

# Maps Integration (Google)
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Pricing Configuration
BASE_DELIVERY_FEE=75.00
TAX_RATE=0.085
COORDINATION_STANDARD_FEE=80.00
COORDINATION_COMPLEX_FEE=120.00

# System Configuration
PORT=3000
NODE_ENV=development
```

## 🌐 Deployment

### Render.com Deployment

This project is configured for easy deployment on Render.com:

1. Fork this repository
2. Connect your GitHub account to Render
3. Create a new Web Service
4. Select this repository
5. Render will automatically use the `render.yaml` configuration
6. Add environment variables in the Render dashboard
7. Deploy!

The `render.yaml` file includes:
- PostgreSQL database setup
- Backend Node.js service configuration
- Frontend static site configuration
- Environment variable templates

## 📝 Features

### Customer-Facing Features
- **AI-Powered Chat Assistant**: 24/7 customer support
- **Instant Quote Calculator**: Real-time pricing with tax calculation
- **Service Showcase**: Interactive service cards with animations
- **Mobile Responsive**: Optimized for all devices
- **Modern UI/UX**: Clean, professional design

### Business Features
- **Dynamic Pricing Engine**: Configurable pricing rules
- **Real-time Analytics**: Business intelligence dashboard
- **Quote Management**: Track and manage customer quotes
- **API Integration**: RESTful APIs for third-party integration
- **Security**: Enterprise-grade authentication and data protection

## 🔒 Security

- JWT-based authentication
- Input validation and sanitization
- SQL injection protection
- CORS configuration
- Rate limiting
- Encrypted sensitive data storage

## 📊 API Documentation

Key API endpoints:

- `POST /api/chat` - AI chat interactions
- `POST /api/quote` - Generate pricing quotes
- `GET /api/quote/distance` - Calculate distances
- `GET /api/analytics/public` - Public metrics
- `GET /api/admin/*` - Admin endpoints (authenticated)

For detailed API documentation, see the backend README.

## 🧪 Testing

### Frontend Testing
Open `test-quote.html` to test the quote calculator functionality.

### Backend Testing
```bash
cd quiet-craft-backend/quiet-craft-backend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by Quiet Craft Solutions Inc.

## 📞 Support

- **Business Inquiries**: (973) 415-9532
- **Technical Support**: See documentation
- **Emergency Support**: Available 24/7

## 🎯 Roadmap

- [ ] Mobile application development
- [ ] Advanced route optimization
- [ ] IoT tracking integration
- [ ] Multi-language support
- [ ] Enhanced analytics dashboard

---

**Quiet Craft Solutions Inc.** - *Precision Event Logistics Powered by AI*

165 Passaic Ave #203, Fairfield, NJ 07004
