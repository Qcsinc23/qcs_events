/**
 * Quote Model - Quote Requests and Pricing Data
 */

module.exports = (sequelize, DataTypes) => {
  const Quote = sequelize.define('Quote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    quote_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Human-readable quote ID (e.g., QC-123ABC)'
    },
    
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    status: {
      type: DataTypes.ENUM('draft', 'active', 'accepted', 'expired', 'cancelled'),
      defaultValue: 'active'
    },
    
    pickup_location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
    delivery_location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
    event_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    event_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    service_level: {
      type: DataTypes.ENUM('standard', 'nextDay', 'sameDay', 'emergency'),
      defaultValue: 'standard'
    },
    
    items: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of items to be delivered'
    },
    
    additional_services: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Additional services requested'
    },
    
    distance_info: {
      type: DataTypes.JSONB,
      comment: 'Distance and route information from Google Maps'
    },
    
    pricing_breakdown: {
      type: DataTypes.JSONB,
      comment: 'Detailed pricing calculation breakdown'
    },
    
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    
    taxes: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    
    valid_until: {
      type: DataTypes.DATE,
      allowNull: false
    },
    
    contact_info: {
      type: DataTypes.JSONB,
      comment: 'Contact information for this quote'
    },
    
    special_requirements: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    expired_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'quotes',
    indexes: [
      {
        fields: ['quote_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['event_type']
      },
      {
        fields: ['service_level']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['valid_until']
      }
    ]
  });
  
  // Associations
  Quote.associate = (models) => {
    Quote.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };
  
  // Instance methods
  Quote.prototype.isExpired = function() {
    return new Date() > this.valid_until;
  };
  
  Quote.prototype.isActive = function() {
    return this.status === 'active' && !this.isExpired();
  };
  
  Quote.prototype.accept = async function() {
    this.status = 'accepted';
    this.accepted_at = new Date();
    return await this.save();
  };
  
  Quote.prototype.expire = async function() {
    this.status = 'expired';
    this.expired_at = new Date();
    return await this.save();
  };
  
  Quote.prototype.calculateTotal = function() {
    return parseFloat(this.subtotal) + parseFloat(this.taxes);
  };
  
  // Class methods
  Quote.findByQuoteId = async function(quoteId) {
    return await this.findOne({ where: { quote_id: quoteId } });
  };
  
  Quote.findActiveQuotes = async function() {
    return await this.findAll({
      where: {
        status: 'active',
        valid_until: {
          [sequelize.Op.gt]: new Date()
        }
      }
    });
  };
  
  Quote.getAnalytics = async function(period = 'month') {
    const dateFrom = new Date();
    switch (period) {
      case 'day':
        dateFrom.setDate(dateFrom.getDate() - 1);
        break;
      case 'week':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case 'year':
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
    }
    
    const [results] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_quotes,
        AVG(total) as average_total,
        SUM(total) as total_value,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_quotes,
        event_type,
        service_level
      FROM quotes 
      WHERE created_at >= :dateFrom
      GROUP BY event_type, service_level
      ORDER BY total_quotes DESC
    `, {
      replacements: { dateFrom },
      type: sequelize.QueryTypes.SELECT
    });
    
    return results;
  };
  
  return Quote;
};
