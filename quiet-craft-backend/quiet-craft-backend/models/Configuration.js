/**
 * Configuration Model - System Configuration Storage
 */

module.exports = (sequelize, DataTypes) => {
  const Configuration = sequelize.define('Configuration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Configuration key'
    },
    
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Configuration value (stored as string)'
    },
    
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'decimal'),
      defaultValue: 'string',
      comment: 'Data type for proper parsing'
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description'
    },
    
    category: {
      type: DataTypes.STRING,
      defaultValue: 'general',
      comment: 'Configuration category for grouping'
    },
    
    is_sensitive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this config contains sensitive data'
    },
    
    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'System configs cannot be deleted'
    },
    
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID who last updated this config'
    }
  }, {
    tableName: 'configurations',
    indexes: [
      {
        fields: ['key'],
        unique: true
      },
      {
        fields: ['category']
      },
      {
        fields: ['type']
      }
    ]
  });
  
  // Instance methods
  Configuration.prototype.getParsedValue = function() {
    switch (this.type) {
      case 'number':
        return parseFloat(this.value);
      case 'decimal':
        return parseFloat(this.value);
      case 'boolean':
        return this.value.toLowerCase() === 'true';
      case 'json':
        try {
          return JSON.parse(this.value);
        } catch (error) {
          return null;
        }
      default:
        return this.value;
    }
  };
  
  Configuration.prototype.setValue = function(newValue) {
    switch (this.type) {
      case 'json':
        this.value = JSON.stringify(newValue);
        break;
      default:
        this.value = String(newValue);
    }
  };
  
  // Class methods
  Configuration.getValue = async function(key, defaultValue = null) {
    const config = await this.findOne({ where: { key } });
    return config ? config.getParsedValue() : defaultValue;
  };
  
  Configuration.setValue = async function(key, value, type = 'string', updatedBy = null) {
    const [config, created] = await this.findOrCreate({
      where: { key },
      defaults: { key, value: String(value), type, updated_by: updatedBy }
    });
    
    if (!created) {
      config.setValue(value);
      config.updated_by = updatedBy;
      config.type = type;
      await config.save();
    }
    
    return config;
  };
  
  Configuration.getByCategory = async function(category) {
    const configs = await this.findAll({ 
      where: { category },
      order: [['key', 'ASC']]
    });
    
    const result = {};
    configs.forEach(config => {
      result[config.key] = config.getParsedValue();
    });
    
    return result;
  };
  
  Configuration.getAllNonSensitive = async function() {
    const configs = await this.findAll({ 
      where: { is_sensitive: false },
      order: [['category', 'ASC'], ['key', 'ASC']]
    });
    
    const result = {};
    configs.forEach(config => {
      if (!result[config.category]) {
        result[config.category] = {};
      }
      result[config.category][config.key] = {
        value: config.getParsedValue(),
        type: config.type,
        description: config.description
      };
    });
    
    return result;
  };
  
  return Configuration;
};
