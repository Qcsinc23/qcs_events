/**
 * Database Configuration - PostgreSQL with Sequelize
 * Production-ready database setup for Quiet Craft Solutions
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Database configuration based on environment
const config = {
  development: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/quiet_craft_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'quiet_craft_dev',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  test: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/quiet_craft_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.TEST_DB_NAME || 'quiet_craft_test',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    }
  }
};

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

// Initialize Sequelize
let sequelize;

if (dbConfig.url) {
  // Use connection URL (preferred for production)
  sequelize = new Sequelize(dbConfig.url, {
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions,
    pool: dbConfig.pool,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });
} else {
  // Use individual connection parameters
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: dbConfig.pool,
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    }
  );
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Log connection details (without sensitive info)
    logger.info('Database configuration', {
      environment,
      dialect: dbConfig.dialect,
      host: dbConfig.host || 'from_url',
      database: dbConfig.database || 'from_url',
      pool: dbConfig.pool
    });
    
    return true;
  } catch (error) {
    logger.logError(error, {
      service: 'database connection',
      environment,
      config: {
        host: dbConfig.host,
        database: dbConfig.database,
        dialect: dbConfig.dialect
      }
    });
    
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.logError(error, { service: 'database shutdown' });
  }
};

// Handle application shutdown
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = {
  sequelize,
  testConnection,
  closeConnection,
  config: dbConfig,
  Sequelize
};
