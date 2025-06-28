/**
 * Models Index - Database Models Registration
 * Central hub for all Sequelize models
 */

const { sequelize, Sequelize } = require('../config/database');
const logger = require('../utils/logger');

// Import model definitions
const User = require('./User');
const Quote = require('./Quote');
const Configuration = require('./Configuration');
const ChatSession = require('./ChatSession');
const Analytics = require('./Analytics');

// Initialize models
const models = {
  User: User(sequelize, Sequelize.DataTypes),
  Quote: Quote(sequelize, Sequelize.DataTypes),
  Configuration: Configuration(sequelize, Sequelize.DataTypes),
  ChatSession: ChatSession(sequelize, Sequelize.DataTypes),
  Analytics: Analytics(sequelize, Sequelize.DataTypes)
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Sync database (create tables if they don't exist)
const syncDatabase = async (force = false) => {
  try {
    if (force) {
      logger.warn('Force syncing database - all data will be lost!');
    }
    
    await sequelize.sync({ force });
    logger.info('Database synchronized successfully');
    
    // Create default configurations if they don't exist
    await createDefaultConfigurations();
    
  } catch (error) {
    logger.logError(error, { service: 'database sync' });
    throw error;
  }
};

// Create default configuration entries
const createDefaultConfigurations = async () => {
  try {
    const defaultConfigs = [
      {
        key: 'pricing_base_fee',
        value: '75.00',
        type: 'decimal',
        description: 'Base delivery fee'
      },
      {
        key: 'ai_model_primary',
        value: 'anthropic/claude-3-haiku',
        type: 'string',
        description: 'Primary AI model for chat'
      },
      {
        key: 'system_version',
        value: require('../package.json').version,
        type: 'string',
        description: 'Current system version'
      },
      {
        key: 'features_analytics_enabled',
        value: 'true',
        type: 'boolean',
        description: 'Enable analytics collection'
      }
    ];

    for (const config of defaultConfigs) {
      await models.Configuration.findOrCreate({
        where: { key: config.key },
        defaults: config
      });
    }

    logger.info('Default configurations created/verified');

  } catch (error) {
    logger.logError(error, { service: 'default configurations' });
  }
};

// Database health check
const healthCheck = async () => {
  try {
    await sequelize.authenticate();
    
    // Test a simple query
    const result = await sequelize.query('SELECT 1+1 AS result');
    
    return {
      status: 'healthy',
      connection: 'active',
      result: result[0][0].result,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.logError(error, { service: 'database health check' });
    
    return {
      status: 'unhealthy',
      connection: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Get database statistics
const getStats = async () => {
  try {
    const stats = {};
    
    // Get record counts for each model
    for (const [modelName, model] of Object.entries(models)) {
      try {
        stats[modelName] = await model.count();
      } catch (error) {
        stats[modelName] = 'error';
      }
    }
    
    // Get database size (PostgreSQL specific)
    try {
      const sizeQuery = `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size,
          current_database() as database_name
      `;
      const sizeResult = await sequelize.query(sizeQuery, {
        type: sequelize.QueryTypes.SELECT
      });
      
      stats.database = sizeResult[0];
    } catch (error) {
      stats.database = { error: error.message };
    }
    
    return stats;
    
  } catch (error) {
    logger.logError(error, { service: 'database stats' });
    return { error: error.message };
  }
};

// Export everything
module.exports = {
  sequelize,
  Sequelize,
  models,
  syncDatabase,
  healthCheck,
  getStats
};
