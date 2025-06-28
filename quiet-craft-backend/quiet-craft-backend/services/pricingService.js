/**
 * Pricing Service - Advanced Quote Calculation Engine
 * Calculates accurate pricing for logistics services based on distance, complexity, and requirements
 */

const mapsService = require('./mapsService');
const logger = require('../utils/logger');

class PricingService {
  constructor() {
    // Base pricing configuration (can be overridden via environment variables)
    this.pricing = {
      baseFee: parseFloat(process.env.BASE_DELIVERY_FEE) || 75.00,
      
      // Distance tiers and rates
      distanceTiers: {
        tier1: {
          maxMiles: parseInt(process.env.DISTANCE_TIER_1_MAX) || 20,
          rate: parseFloat(process.env.DISTANCE_TIER_1_RATE) || 0.00
        },
        tier2: {
          maxMiles: parseInt(process.env.DISTANCE_TIER_2_MAX) || 50,
          rate: parseFloat(process.env.DISTANCE_TIER_2_RATE) || 1.50
        },
        tier3: {
          rate: parseFloat(process.env.DISTANCE_TIER_3_RATE) || 2.00
        }
      },
      
      // Item handling fees by size/complexity
      itemFees: {
        small: parseFloat(process.env.SMALL_ITEM_FEE) || 10.00,
        medium: parseFloat(process.env.MEDIUM_ITEM_FEE) || 25.00,
        large: parseFloat(process.env.LARGE_ITEM_FEE) || 50.00,
        extraLarge: 100.00,
        delicate: 35.00,
        highValue: 75.00
      },
      
      // Service level fees
      serviceLevels: {
        standard: parseFloat(process.env.STANDARD_FEE) || 0.00,
        nextDay: parseFloat(process.env.NEXT_DAY_FEE) || 25.00,
        sameDay: parseFloat(process.env.SAME_DAY_FEE) || 50.00,
        emergency: parseFloat(process.env.EMERGENCY_BASE_FEE) || 150.00
      },
      
      // Additional service fees
      additionalServices: {
        venueCoordination: 100.00,
        onSiteSupport: 75.00,
        setupAssistance: 125.00,
        storageDaily: 25.00,
        customsHandling: 150.00,
        insurancePremium: 0.02, // 2% of declared value
        weekendDelivery: 50.00,
        afterHoursDelivery: 75.00,
        multipleStops: 25.00 // per additional stop
      },
      
      // Event type multipliers
      eventTypes: {
        conference: 1.0,
        tradeShow: 1.2,
        festival: 1.3,
        corporateEvent: 1.1,
        wedding: 1.15,
        exhibition: 1.25,
        concert: 1.4,
        sportingEvent: 1.3
      },
      
      // Complexity multipliers
      complexityFactors: {
        multiVenue: 1.5,
        multiDay: 1.3,
        international: 2.0,
        hazardous: 1.8,
        timeRestricted: 1.4,
        specialEquipment: 1.6
      }
    };

    // Quote history for analytics
    this.quoteHistory = [];
  }

  /**
   * Generate comprehensive quote
   * @param {Object} quoteRequest - Quote request details
   * @returns {Object} Detailed pricing breakdown
   */
  async generateQuote(quoteRequest) {
    const startTime = Date.now();
    
    try {
      // Validate and normalize request
      const normalizedRequest = this.normalizeQuoteRequest(quoteRequest);
      
      // Calculate distance if locations provided
      let distanceInfo = null;
      if (normalizedRequest.pickup && normalizedRequest.delivery) {
        distanceInfo = await this.calculateDistance(
          normalizedRequest.pickup,
          normalizedRequest.delivery
        );
      }

      // Build quote components
      const quoteComponents = await this.buildQuoteComponents(normalizedRequest, distanceInfo);
      
      // Calculate final pricing
      const pricing = this.calculateFinalPricing(quoteComponents);
      
      // Generate quote ID and metadata
      const quoteId = this.generateQuoteId();
      const quote = {
        quoteId,
        ...pricing,
        request: normalizedRequest,
        distanceInfo,
        components: quoteComponents,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };

      // Store in history for analytics
      this.quoteHistory.push({
        quoteId,
        totalPrice: pricing.total,
        distance: distanceInfo?.distance?.miles || 0,
        eventType: normalizedRequest.eventType,
        serviceLevel: normalizedRequest.serviceLevel,
        timestamp: new Date().toISOString()
      });

      // Keep only recent quotes in memory
      if (this.quoteHistory.length > 1000) {
        this.quoteHistory = this.quoteHistory.slice(-500);
      }

      logger.info('Quote generated', {
        quoteId,
        totalPrice: pricing.total,
        distance: distanceInfo?.distance?.miles || 0,
        processingTime: quote.processingTime
      });

      return quote;

    } catch (error) {
      logger.logError(error, {
        service: 'PricingService.generateQuote',
        request: quoteRequest
      });

      throw new Error(`Quote generation failed: ${error.message}`);
    }
  }

  /**
   * Normalize and validate quote request
   * @param {Object} request - Raw quote request
   * @returns {Object} Normalized request
   */
  normalizeQuoteRequest(request) {
    const normalized = {
      eventType: request.eventType || 'corporateEvent',
      serviceLevel: request.serviceLevel || 'standard',
      pickup: request.pickup || request.origin,
      delivery: request.delivery || request.destination,
      eventDate: request.eventDate ? new Date(request.eventDate) : null,
      items: Array.isArray(request.items) ? request.items : [],
      additionalServices: Array.isArray(request.additionalServices) ? request.additionalServices : [],
      specialRequirements: request.specialRequirements || [],
      declaredValue: parseFloat(request.declaredValue) || 0,
      urgency: request.urgency || 'standard',
      contactInfo: request.contactInfo || {},
      notes: request.notes || ''
    };

    // Validate required fields
    if (!normalized.pickup || !normalized.delivery) {
      throw new Error('Pickup and delivery locations are required');
    }

    // Validate event date
    if (normalized.eventDate && normalized.eventDate < new Date()) {
      throw new Error('Event date cannot be in the past');
    }

    // Ensure items have required properties
    normalized.items = normalized.items.map(item => ({
      description: item.description || 'Item',
      size: item.size || 'medium',
      quantity: parseInt(item.quantity) || 1,
      weight: parseFloat(item.weight) || 0,
      dimensions: item.dimensions || {},
      special: Array.isArray(item.special) ? item.special : [],
      value: parseFloat(item.value) || 0
    }));

    return normalized;
  }

  /**
   * Calculate distance between pickup and delivery
   * @param {string} pickup - Pickup location
   * @param {string} delivery - Delivery location
   * @returns {Object} Distance information
   */
  async calculateDistance(pickup, delivery) {
    try {
      return await mapsService.calculateDistance(pickup, delivery, 'driving');
    } catch (error) {
      logger.warn('Distance calculation failed, using fallback', {
        pickup,
        delivery,
        error: error.message
      });

      // Return fallback distance estimate
      return {
        distance: { miles: 25, text: '25 miles (estimated)' },
        duration: { minutes: 45, text: '45 mins (estimated)' },
        estimated: true,
        error: error.message
      };
    }
  }

  /**
   * Build quote components
   * @param {Object} request - Normalized request
   * @param {Object} distanceInfo - Distance calculation results
   * @returns {Object} Quote components
   */
  async buildQuoteComponents(request, distanceInfo) {
    const components = {
      baseFee: this.pricing.baseFee,
      distanceFee: 0,
      itemFees: [],
      serviceLevelFee: 0,
      additionalServiceFees: [],
      eventTypeMultiplier: 1.0,
      complexityMultipliers: [],
      urgencyMultiplier: 1.0,
      subtotal: 0,
      taxes: 0,
      discounts: 0
    };

    // Calculate distance fee
    if (distanceInfo && distanceInfo.distance) {
      components.distanceFee = this.calculateDistanceFee(distanceInfo.distance.miles);
    }

    // Calculate item fees
    components.itemFees = this.calculateItemFees(request.items);

    // Service level fee
    components.serviceLevelFee = this.pricing.serviceLevels[request.serviceLevel] || 0;

    // Additional service fees
    components.additionalServiceFees = this.calculateAdditionalServiceFees(request.additionalServices);

    // Event type multiplier
    components.eventTypeMultiplier = this.pricing.eventTypes[request.eventType] || 1.0;

    // Complexity multipliers
    components.complexityMultipliers = this.calculateComplexityMultipliers(request);

    // Urgency multiplier
    components.urgencyMultiplier = this.calculateUrgencyMultiplier(request.eventDate, request.urgency);

    return components;
  }

  /**
   * Calculate distance-based fees
   * @param {number} miles - Distance in miles
   * @returns {number} Distance fee
   */
  calculateDistanceFee(miles) {
    const tiers = this.pricing.distanceTiers;
    
    if (miles <= tiers.tier1.maxMiles) {
      return miles * tiers.tier1.rate;
    } else if (miles <= tiers.tier2.maxMiles) {
      const tier1Fee = tiers.tier1.maxMiles * tiers.tier1.rate;
      const tier2Miles = miles - tiers.tier1.maxMiles;
      return tier1Fee + (tier2Miles * tiers.tier2.rate);
    } else {
      const tier1Fee = tiers.tier1.maxMiles * tiers.tier1.rate;
      const tier2Fee = (tiers.tier2.maxMiles - tiers.tier1.maxMiles) * tiers.tier2.rate;
      const tier3Miles = miles - tiers.tier2.maxMiles;
      return tier1Fee + tier2Fee + (tier3Miles * tiers.tier3.rate);
    }
  }

  /**
   * Calculate fees for all items
   * @param {Array} items - Array of items
   * @returns {Array} Item fee details
   */
  calculateItemFees(items) {
    return items.map(item => {
      let baseFee = this.pricing.itemFees[item.size] || this.pricing.itemFees.medium;
      let specialFees = 0;

      // Add special handling fees
      if (item.special && item.special.length > 0) {
        item.special.forEach(special => {
          switch (special) {
            case 'delicate':
              specialFees += this.pricing.itemFees.delicate;
              break;
            case 'highValue':
              specialFees += this.pricing.itemFees.highValue;
              break;
            case 'hazardous':
              specialFees += baseFee * 0.5; // 50% surcharge
              break;
            case 'oversized':
              specialFees += this.pricing.itemFees.extraLarge;
              break;
          }
        });
      }

      const totalFee = (baseFee + specialFees) * item.quantity;

      return {
        description: item.description,
        size: item.size,
        quantity: item.quantity,
        baseFee,
        specialFees,
        totalFee,
        details: item.special || []
      };
    });
  }

  /**
   * Calculate additional service fees
   * @param {Array} services - Additional services requested
   * @returns {Array} Service fee details
   */
  calculateAdditionalServiceFees(services) {
    return services.map(service => {
      const fee = this.pricing.additionalServices[service] || 0;
      return {
        service,
        fee,
        description: this.getServiceDescription(service)
      };
    });
  }

  /**
   * Calculate complexity multipliers
   * @param {Object} request - Quote request
   * @returns {Array} Complexity factors applied
   */
  calculateComplexityMultipliers(request) {
    const multipliers = [];

    // Check for various complexity factors
    if (request.specialRequirements.includes('multiVenue')) {
      multipliers.push({
        factor: 'multiVenue',
        multiplier: this.pricing.complexityFactors.multiVenue,
        description: 'Multiple venue coordination'
      });
    }

    if (request.specialRequirements.includes('multiDay')) {
      multipliers.push({
        factor: 'multiDay',
        multiplier: this.pricing.complexityFactors.multiDay,
        description: 'Multi-day event logistics'
      });
    }

    if (request.specialRequirements.includes('international')) {
      multipliers.push({
        factor: 'international',
        multiplier: this.pricing.complexityFactors.international,
        description: 'International shipping requirements'
      });
    }

    // Add more complexity checks as needed

    return multipliers;
  }

  /**
   * Calculate urgency multiplier based on notice period
   * @param {Date} eventDate - Event date
   * @param {string} urgency - Urgency level
   * @returns {number} Urgency multiplier
   */
  calculateUrgencyMultiplier(eventDate, urgency) {
    if (urgency === 'emergency') {
      return parseFloat(process.env.EMERGENCY_MULTIPLIER) || 2.0;
    }

    if (!eventDate) return 1.0;

    const daysUntilEvent = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));

    if (daysUntilEvent <= 1) {
      return 1.8; // Same day
    } else if (daysUntilEvent <= 2) {
      return 1.4; // Next day
    } else if (daysUntilEvent <= 7) {
      return 1.2; // Within a week
    }

    return 1.0; // Standard notice
  }

  /**
   * Calculate final pricing with all components
   * @param {Object} components - Quote components
   * @returns {Object} Final pricing breakdown
   */
  calculateFinalPricing(components) {
    // Calculate base subtotal
    let subtotal = components.baseFee + components.distanceFee + components.serviceLevelFee;

    // Add item fees
    const totalItemFees = components.itemFees.reduce((sum, item) => sum + item.totalFee, 0);
    subtotal += totalItemFees;

    // Add additional service fees
    const totalAdditionalFees = components.additionalServiceFees.reduce((sum, service) => sum + service.fee, 0);
    subtotal += totalAdditionalFees;

    // Apply event type multiplier
    subtotal *= components.eventTypeMultiplier;

    // Apply complexity multipliers
    components.complexityMultipliers.forEach(complexity => {
      subtotal *= complexity.multiplier;
    });

    // Apply urgency multiplier
    subtotal *= components.urgencyMultiplier;

    // Calculate taxes (example: 8.5% sales tax)
    const taxRate = parseFloat(process.env.TAX_RATE) || 0.085;
    const taxes = subtotal * taxRate;

    // Calculate total
    const total = subtotal + taxes - components.discounts;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxes: Math.round(taxes * 100) / 100,
      discounts: components.discounts,
      total: Math.round(total * 100) / 100,
      breakdown: {
        baseFee: components.baseFee,
        distanceFee: components.distanceFee,
        itemFees: totalItemFees,
        serviceLevelFee: components.serviceLevelFee,
        additionalServices: totalAdditionalFees,
        multipliers: {
          eventType: components.eventTypeMultiplier,
          complexity: components.complexityMultipliers,
          urgency: components.urgencyMultiplier
        }
      }
    };
  }

  /**
   * Generate unique quote ID
   * @returns {string} Quote ID
   */
  generateQuoteId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `QC-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Get service description
   * @param {string} service - Service key
   * @returns {string} Service description
   */
  getServiceDescription(service) {
    const descriptions = {
      venueCoordination: 'Venue coordination and liaison services',
      onSiteSupport: 'On-site support and supervision',
      setupAssistance: 'Setup and installation assistance',
      storageDaily: 'Temporary storage (per day)',
      customsHandling: 'Customs and documentation handling',
      insurancePremium: 'Premium insurance coverage',
      weekendDelivery: 'Weekend delivery service',
      afterHoursDelivery: 'After-hours delivery service',
      multipleStops: 'Multiple pickup/delivery locations'
    };

    return descriptions[service] || 'Additional service';
  }

  /**
   * Get pricing statistics
   * @returns {Object} Pricing analytics
   */
  getAnalytics() {
    if (this.quoteHistory.length === 0) {
      return { totalQuotes: 0, averageQuote: 0, analytics: null };
    }

    const totalQuotes = this.quoteHistory.length;
    const totalValue = this.quoteHistory.reduce((sum, quote) => sum + quote.totalPrice, 0);
    const averageQuote = totalValue / totalQuotes;

    const eventTypeBreakdown = {};
    const serviceLevelBreakdown = {};

    this.quoteHistory.forEach(quote => {
      eventTypeBreakdown[quote.eventType] = (eventTypeBreakdown[quote.eventType] || 0) + 1;
      serviceLevelBreakdown[quote.serviceLevel] = (serviceLevelBreakdown[quote.serviceLevel] || 0) + 1;
    });

    return {
      totalQuotes,
      averageQuote: Math.round(averageQuote * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      eventTypeBreakdown,
      serviceLevelBreakdown,
      pricing: this.pricing
    };
  }

  /**
   * Update pricing configuration
   * @param {Object} newPricing - Updated pricing rules
   */
  updatePricing(newPricing) {
    this.pricing = { ...this.pricing, ...newPricing };
    logger.info('Pricing configuration updated', { newPricing });
  }
}

// Initialize service
const pricingService = new PricingService();

module.exports = pricingService;
