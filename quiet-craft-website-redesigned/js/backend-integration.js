/**
 * Backend Integration - Frontend to Backend API Communication
 * Connects the enhanced frontend with the Node.js backend system
 */

class BackendIntegration {
  constructor() {
    this.baseURL = this.getBaseURL();
    this.apiKey = null;
    this.authToken = null;
    this.userId = null;
    this.sessionId = this.generateSessionId();
    
    // Initialize configuration
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    };
    
    // Track request metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
    
    this.init();
  }

  getBaseURL() {
    // Use environment-specific backend URL
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    } else if (window.location.hostname.includes('minimax.io')) {
      return 'https://quiet-craft-backend.onrender.com'; // Production backend
    } else {
      return 'https://quiet-craft-backend.onrender.com'; // Default to production
    }
  }

  init() {
    // Set up authentication if available
    this.checkAuthentication();
    
    // Set up error tracking
    this.setupErrorTracking();
    
    // Initialize health monitoring
    this.startHealthMonitoring();
    
    console.log('🔗 Backend Integration initialized:', {
      baseURL: this.baseURL,
      sessionId: this.sessionId,
      authenticated: !!this.authToken
    });
  }

  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  checkAuthentication() {
    // Check for stored authentication
    this.authToken = localStorage.getItem('auth_token');
    this.userId = localStorage.getItem('user_id');
    
    if (this.authToken) {
      this.validateToken();
    }
  }

  async validateToken() {
    try {
      const response = await this.makeRequest('/api/admin/health', 'GET', null, true);
      if (!response.success) {
        this.clearAuthentication();
      }
    } catch (error) {
      console.warn('Token validation failed:', error.message);
      this.clearAuthentication();
    }
  }

  clearAuthentication() {
    this.authToken = null;
    this.userId = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
  }

  setupErrorTracking() {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.source === 'backend-integration') {
        console.error('Backend Integration Error:', event.reason);
        this.trackError(event.reason);
      }
    });
  }

  startHealthMonitoring() {
    // Check backend health every 5 minutes
    setInterval(() => {
      this.checkBackendHealth();
    }, 5 * 60 * 1000);
    
    // Initial health check
    this.checkBackendHealth();
  }

  async checkBackendHealth() {
    try {
      const response = await this.makeRequest('/health', 'GET');
      console.log('🟢 Backend health check:', response.status);
      return response;
    } catch (error) {
      console.warn('🔴 Backend health check failed:', error.message);
      return { status: 'unhealthy', error: error.message };
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null, requireAuth = false, retryCount = 0) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId
      };

      if (requireAuth && this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const options = {
        method,
        headers,
        credentials: 'include'
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      options.signal = controller.signal;

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);

      // Retry logic
      if (retryCount < this.config.retryAttempts && this.shouldRetry(error)) {
        console.warn(`Request failed, retrying (${retryCount + 1}/${this.config.retryAttempts}):`, error.message);
        await this.sleep(this.config.retryDelay * (retryCount + 1));
        return this.makeRequest(endpoint, method, data, requireAuth, retryCount + 1);
      }

      // Enhanced error information
      const enhancedError = new Error(error.message);
      enhancedError.source = 'backend-integration';
      enhancedError.endpoint = endpoint;
      enhancedError.method = method;
      enhancedError.responseTime = responseTime;
      enhancedError.retryCount = retryCount;

      throw enhancedError;
    }
  }

  shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return error.name === 'AbortError' || 
           error.message.includes('Failed to fetch') ||
           error.message.includes('5');
  }

  updateMetrics(success, responseTime) {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime = (
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests
    );
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  trackError(error) {
    // Send error tracking to analytics (if enabled)
    this.sendAnalytics('error', {
      message: error.message,
      endpoint: error.endpoint,
      method: error.method,
      responseTime: error.responseTime,
      retryCount: error.retryCount,
      timestamp: new Date().toISOString()
    });
  }

  // AI Chat Methods
  async sendChatMessage(message, context = {}) {
    return await this.makeRequest('/api/chat', 'POST', {
      message,
      conversationId: context.conversationId,
      userId: this.userId,
      sessionId: this.sessionId,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      }
    });
  }

  async getChatHistory(conversationId, limit = 20, offset = 0) {
    return await this.makeRequest(
      `/api/chat/history?conversationId=${conversationId}&limit=${limit}&offset=${offset}`,
      'GET'
    );
  }

  async analyzeChatIntent(message) {
    return await this.makeRequest('/api/chat/analyze-intent', 'POST', { message });
  }

  async sendChatFeedback(conversationId, messageIndex, rating, feedback = '') {
    return await this.makeRequest('/api/chat/feedback', 'POST', {
      conversationId,
      messageIndex,
      rating,
      feedback
    });
  }

  // Quote and Pricing Methods
  async generateQuote(quoteData) {
    return await this.makeRequest('/api/quote', 'POST', {
      ...quoteData,
      contactInfo: {
        ...quoteData.contactInfo,
        sessionId: this.sessionId
      }
    });
  }

  async getQuickEstimate(pickup, delivery, serviceLevel = 'standard') {
    return await this.makeRequest('/api/quote/estimate', 'POST', {
      pickup,
      delivery,
      serviceLevel
    });
  }

  async calculateDistance(origin, destination, mode = 'driving') {
    return await this.makeRequest(
      `/api/quote/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}`,
      'GET'
    );
  }

  async geocodeAddress(address) {
    return await this.makeRequest(
      `/api/quote/geocode?address=${encodeURIComponent(address)}`,
      'GET'
    );
  }

  async getPricingInfo() {
    return await this.makeRequest('/api/quote/pricing', 'GET');
  }

  async getAIQuoteAssistance(message, context = {}) {
    return await this.makeRequest('/api/quote/ai-quote', 'POST', { message, context });
  }

  // Analytics Methods
  async getPublicAnalytics() {
    return await this.makeRequest('/api/analytics/public', 'GET');
  }

  async getBusinessAnalytics(period = 'month', metric = null) {
    const params = new URLSearchParams({ period });
    if (metric) params.append('metric', metric);
    
    return await this.makeRequest(`/api/analytics/business?${params}`, 'GET');
  }

  async sendAnalytics(eventType, eventData) {
    // Send analytics data to backend
    try {
      return await this.makeRequest('/api/analytics/track', 'POST', {
        event_type: eventType,
        event_data: eventData,
        session_id: this.sessionId,
        page_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error.message);
    }
  }

  // Admin Methods (require authentication)
  async getAdminDashboard() {
    return await this.makeRequest('/api/admin/dashboard', 'GET', null, true);
  }

  async getSystemConfiguration() {
    return await this.makeRequest('/api/admin/config', 'GET', null, true);
  }

  async updatePricingConfiguration(pricingData) {
    return await this.makeRequest('/api/admin/config/pricing', 'PUT', pricingData, true);
  }

  async clearCache(services = ['all']) {
    return await this.makeRequest('/api/admin/cache/clear', 'POST', { services }, true);
  }

  async getSystemHealth() {
    return await this.makeRequest('/api/admin/health', 'GET', null, true);
  }

  // Utility Methods
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
        : 0,
      timestamp: new Date().toISOString()
    };
  }

  getConnectionStatus() {
    return {
      baseURL: this.baseURL,
      authenticated: !!this.authToken,
      sessionId: this.sessionId,
      metrics: this.getMetrics()
    };
  }

  // Event tracking for enhanced analytics
  trackPageView() {
    this.sendAnalytics('page_view', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    });
  }

  trackUserInteraction(action, element, data = {}) {
    this.sendAnalytics('user_interaction', {
      action,
      element,
      data,
      timestamp: new Date().toISOString()
    });
  }

  trackConversion(type, value = null) {
    this.sendAnalytics('conversion', {
      type,
      value,
      timestamp: new Date().toISOString()
    });
  }
}

// Initialize backend integration
const backendAPI = new BackendIntegration();

// Track initial page view
document.addEventListener('DOMContentLoaded', () => {
  backendAPI.trackPageView();
});

// Export for global access
window.backendAPI = backendAPI;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackendIntegration;
}
