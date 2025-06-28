/**
 * Analytics Model - System Analytics and Event Tracking
 */

module.exports = (sequelize, DataTypes) => {
  const Analytics = sequelize.define('Analytics', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    event_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of analytics event (page_view, quote_request, chat_interaction, etc.)'
    },
    
    event_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Event data and metadata'
    },
    
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    session_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Session identifier for tracking user journeys'
    },
    
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    referrer: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    page_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'analytics',
    indexes: [
      {
        fields: ['event_type']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['session_id']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['event_type', 'timestamp']
      }
    ]
  });
  
  // Associations
  Analytics.associate = (models) => {
    Analytics.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };
  
  // Class methods
  Analytics.trackEvent = async function(eventType, eventData, context = {}) {
    return await this.create({
      event_type: eventType,
      event_data: eventData,
      user_id: context.userId || null,
      session_id: context.sessionId || null,
      ip_address: context.ip || null,
      user_agent: context.userAgent || null,
      referrer: context.referrer || null,
      page_url: context.pageUrl || null
    });
  };
  
  Analytics.getEventCounts = async function(period = 'day', eventTypes = []) {
    let whereClause = {};
    const dateFrom = new Date();
    
    switch (period) {
      case 'hour':
        dateFrom.setHours(dateFrom.getHours() - 1);
        break;
      case 'day':
        dateFrom.setDate(dateFrom.getDate() - 1);
        break;
      case 'week':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
    }
    
    whereClause.timestamp = { [sequelize.Op.gte]: dateFrom };
    
    if (eventTypes.length > 0) {
      whereClause.event_type = { [sequelize.Op.in]: eventTypes };
    }
    
    const results = await this.findAll({
      attributes: [
        'event_type',
        [sequelize.fn('COUNT', '*'), 'count'],
        [sequelize.fn('DATE_TRUNC', period === 'hour' ? 'hour' : 'day', sequelize.col('timestamp')), 'period']
      ],
      where: whereClause,
      group: ['event_type', 'period'],
      order: [['period', 'DESC']],
      raw: true
    });
    
    return results;
  };
  
  Analytics.getUserJourney = async function(userId, sessionId = null) {
    const whereClause = { user_id: userId };
    if (sessionId) {
      whereClause.session_id = sessionId;
    }
    
    return await this.findAll({
      where: whereClause,
      order: [['timestamp', 'ASC']],
      limit: 100
    });
  };
  
  Analytics.getTopPages = async function(period = 'day', limit = 10) {
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
    }
    
    const results = await this.findAll({
      attributes: [
        'page_url',
        [sequelize.fn('COUNT', '*'), 'views']
      ],
      where: {
        event_type: 'page_view',
        timestamp: { [sequelize.Op.gte]: dateFrom },
        page_url: { [sequelize.Op.ne]: null }
      },
      group: ['page_url'],
      order: [[sequelize.literal('views'), 'DESC']],
      limit: limit,
      raw: true
    });
    
    return results;
  };
  
  Analytics.getConversionFunnel = async function(period = 'month') {
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
    }
    
    const [results] = await sequelize.query(`
      WITH funnel_data AS (
        SELECT 
          session_id,
          MAX(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as visited,
          MAX(CASE WHEN event_type = 'chat_interaction' THEN 1 ELSE 0 END) as chatted,
          MAX(CASE WHEN event_type = 'quote_request' THEN 1 ELSE 0 END) as requested_quote,
          MAX(CASE WHEN event_type = 'quote_accepted' THEN 1 ELSE 0 END) as accepted_quote
        FROM analytics 
        WHERE timestamp >= :dateFrom AND session_id IS NOT NULL
        GROUP BY session_id
      )
      SELECT 
        SUM(visited) as total_visitors,
        SUM(chatted) as total_chat_interactions,
        SUM(requested_quote) as total_quote_requests,
        SUM(accepted_quote) as total_accepted_quotes,
        ROUND(SUM(chatted)::numeric / NULLIF(SUM(visited), 0) * 100, 2) as chat_conversion_rate,
        ROUND(SUM(requested_quote)::numeric / NULLIF(SUM(visited), 0) * 100, 2) as quote_conversion_rate,
        ROUND(SUM(accepted_quote)::numeric / NULLIF(SUM(requested_quote), 0) * 100, 2) as acceptance_rate
      FROM funnel_data
    `, {
      replacements: { dateFrom },
      type: sequelize.QueryTypes.SELECT
    });
    
    return results[0] || {};
  };
  
  return Analytics;
};
