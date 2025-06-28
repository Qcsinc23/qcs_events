/**
 * Google Maps Service - Distance and Location Services
 * Handles geocoding and distance calculations for Quiet Craft Solutions
 */

const axios = require('axios');
const logger = require('../utils/logger');

class MapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
    this.cache = new Map(); // In-memory cache for distance calculations
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    if (!this.apiKey) {
      logger.warn('Google Maps API key not configured');
    }
  }

  /**
   * Calculate distance between two locations
   * @param {string} origin - Origin address or coordinates
   * @param {string} destination - Destination address or coordinates
   * @param {string} mode - Travel mode (driving, transit, walking, bicycling)
   * @returns {Object} Distance and duration information
   */
  async calculateDistance(origin, destination, mode = 'driving') {
    const cacheKey = `${origin}-${destination}-${mode}`.toLowerCase();
    
    // Check cache first
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < this.cacheTimeout) {
      logger.info('Distance calculation cache hit', { origin, destination, mode });
      return cachedResult.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: origin,
          destinations: destination,
          mode: mode,
          units: 'imperial', // Miles
          key: this.apiKey
        },
        timeout: 10000 // 10 second timeout
      });

      const data = response.data;
      
      if (data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      const element = data.rows[0]?.elements[0];
      
      if (!element || element.status !== 'OK') {
        throw new Error(`No route found between ${origin} and ${destination}`);
      }

      const result = {
        distance: {
          text: element.distance.text,
          value: element.distance.value, // meters
          miles: Math.round(element.distance.value * 0.000621371 * 100) / 100 // Convert to miles
        },
        duration: {
          text: element.duration.text,
          value: element.duration.value, // seconds
          minutes: Math.round(element.duration.value / 60)
        },
        origin: data.origin_addresses[0],
        destination: data.destination_addresses[0],
        mode: mode,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      logger.info('Distance calculated', {
        origin: result.origin,
        destination: result.destination,
        distance: result.distance.miles + ' miles',
        duration: result.duration.text,
        mode
      });

      return result;

    } catch (error) {
      logger.logError(error, {
        service: 'MapsService.calculateDistance',
        origin,
        destination,
        mode
      });

      // Return fallback data if available
      if (error.response?.status === 429) {
        throw new Error('Google Maps quota exceeded. Please try again later.');
      }

      throw new Error(`Unable to calculate distance: ${error.message}`);
    }
  }

  /**
   * Geocode an address to get coordinates
   * @param {string} address - Address to geocode
   * @returns {Object} Geocoding results with coordinates
   */
  async geocodeAddress(address) {
    const cacheKey = `geocode-${address}`.toLowerCase();
    
    // Check cache
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < this.cacheTimeout) {
      return cachedResult.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: this.apiKey
        },
        timeout: 10000
      });

      const data = response.data;

      if (data.status !== 'OK') {
        throw new Error(`Geocoding error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      if (!data.results || data.results.length === 0) {
        throw new Error(`No results found for address: ${address}`);
      }

      const result = data.results[0];
      const location = result.geometry.location;

      const geocodeResult = {
        formattedAddress: result.formatted_address,
        coordinates: {
          lat: location.lat,
          lng: location.lng
        },
        addressComponents: result.address_components,
        placeId: result.place_id,
        types: result.types,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: geocodeResult,
        timestamp: Date.now()
      });

      return geocodeResult;

    } catch (error) {
      logger.logError(error, {
        service: 'MapsService.geocodeAddress',
        address
      });

      throw new Error(`Unable to geocode address: ${error.message}`);
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Object} Address information
   */
  async reverseGeocode(lat, lng) {
    const cacheKey = `reverse-${lat}-${lng}`;
    
    // Check cache
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < this.cacheTimeout) {
      return cachedResult.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey
        },
        timeout: 10000
      });

      const data = response.data;

      if (data.status !== 'OK') {
        throw new Error(`Reverse geocoding error: ${data.status}`);
      }

      if (!data.results || data.results.length === 0) {
        throw new Error(`No address found for coordinates: ${lat}, ${lng}`);
      }

      const result = data.results[0];

      const reverseResult = {
        formattedAddress: result.formatted_address,
        coordinates: { lat, lng },
        addressComponents: result.address_components,
        placeId: result.place_id,
        types: result.types,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: reverseResult,
        timestamp: Date.now()
      });

      return reverseResult;

    } catch (error) {
      logger.logError(error, {
        service: 'MapsService.reverseGeocode',
        lat,
        lng
      });

      throw new Error(`Unable to reverse geocode: ${error.message}`);
    }
  }

  /**
   * Get nearby places
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} type - Place type (e.g., 'lodging', 'restaurant')
   * @param {number} radius - Search radius in meters
   * @returns {Array} Array of nearby places
   */
  async getNearbyPlaces(lat, lng, type = 'lodging', radius = 5000) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: {
          location: `${lat},${lng}`,
          radius: radius,
          type: type,
          key: this.apiKey
        },
        timeout: 10000
      });

      const data = response.data;

      if (data.status !== 'OK') {
        throw new Error(`Places API error: ${data.status}`);
      }

      return data.results.map(place => ({
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        priceLevel: place.price_level,
        types: place.types,
        placeId: place.place_id,
        coordinates: place.geometry.location,
        openNow: place.opening_hours?.open_now
      }));

    } catch (error) {
      logger.logError(error, {
        service: 'MapsService.getNearbyPlaces',
        lat,
        lng,
        type,
        radius
      });

      throw new Error(`Unable to find nearby places: ${error.message}`);
    }
  }

  /**
   * Validate address format
   * @param {string} address - Address to validate
   * @returns {boolean} Whether address appears valid
   */
  validateAddress(address) {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Basic validation - check for minimum components
    const trimmed = address.trim();
    if (trimmed.length < 5) {
      return false;
    }

    // Check for at least one number (street number) and one letter
    const hasNumber = /\d/.test(trimmed);
    const hasLetter = /[a-zA-Z]/.test(trimmed);

    return hasNumber && hasLetter;
  }

  /**
   * Extract ZIP code from address
   * @param {string} address - Address string
   * @returns {string|null} ZIP code if found
   */
  extractZipCode(address) {
    if (!address) return null;

    // US ZIP code patterns
    const zipPatterns = [
      /\b\d{5}(-\d{4})?\b/g, // 12345 or 12345-6789
      /\b[A-Z]\d[A-Z] ?\d[A-Z]\d\b/g // Canadian postal codes
    ];

    for (const pattern of zipPatterns) {
      const matches = address.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }

    return null;
  }

  /**
   * Calculate estimated travel time based on distance and traffic
   * @param {number} distanceMiles - Distance in miles
   * @param {string} timeOfDay - Time period (morning, afternoon, evening, night)
   * @returns {Object} Estimated travel time with traffic
   */
  estimateTravelTime(distanceMiles, timeOfDay = 'afternoon') {
    // Base speed assumptions (mph)
    const baseSpeeds = {
      highway: 65,
      urban: 35,
      suburban: 45
    };

    // Traffic multipliers
    const trafficMultipliers = {
      morning: 1.3,   // Rush hour
      afternoon: 1.1, // Moderate traffic
      evening: 1.4,   // Heavy rush hour
      night: 0.9      // Light traffic
    };

    // Estimate road type distribution based on distance
    let avgSpeed;
    if (distanceMiles < 10) {
      avgSpeed = baseSpeeds.urban; // Mostly urban
    } else if (distanceMiles < 50) {
      avgSpeed = baseSpeeds.suburban; // Mix of suburban/urban
    } else {
      avgSpeed = baseSpeeds.highway; // Mostly highway
    }

    // Apply traffic multiplier
    const multiplier = trafficMultipliers[timeOfDay] || 1.1;
    const adjustedSpeed = avgSpeed / multiplier;

    // Calculate time
    const baseHours = distanceMiles / adjustedSpeed;
    const minutes = Math.round(baseHours * 60);

    return {
      estimatedMinutes: minutes,
      estimatedHours: Math.round(baseHours * 10) / 10,
      averageSpeed: Math.round(adjustedSpeed),
      trafficCondition: timeOfDay,
      confidence: distanceMiles < 100 ? 'high' : 'medium'
    };
  }

  /**
   * Clear cache (for maintenance)
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Maps service cache cleared: ${size} entries removed`);
    return size;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxAge: this.cacheTimeout,
      apiConfigured: !!this.apiKey
    };
  }
}

// Initialize service
const mapsService = new MapsService();

// Cleanup cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of mapsService.cache.entries()) {
    if (now - value.timestamp > mapsService.cacheTimeout) {
      mapsService.cache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

module.exports = mapsService;
