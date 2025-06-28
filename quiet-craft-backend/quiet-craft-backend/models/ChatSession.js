/**
 * ChatSession Model - AI Chat Session Tracking
 */

module.exports = (sequelize, DataTypes) => {
  const ChatSession = sequelize.define('ChatSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    session_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'External session identifier'
    },
    
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    total_messages: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    total_tokens: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    ai_model_used: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    primary_intent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Most common intent in this session'
    },
    
    satisfaction_rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    conversation_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Conversation metadata and context'
    },
    
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'chat_sessions',
    indexes: [
      {
        fields: ['session_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['started_at']
      },
      {
        fields: ['primary_intent']
      },
      {
        fields: ['satisfaction_rating']
      }
    ]
  });
  
  // Associations
  ChatSession.associate = (models) => {
    ChatSession.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };
  
  // Instance methods
  ChatSession.prototype.endSession = async function() {
    this.ended_at = new Date();
    this.duration_seconds = Math.floor((this.ended_at - this.started_at) / 1000);
    return await this.save();
  };
  
  ChatSession.prototype.addMessage = async function(intent = null, tokens = 0) {
    this.total_messages += 1;
    this.total_tokens += tokens;
    
    if (intent) {
      // Update primary intent based on frequency
      const intentCounts = this.conversation_data.intent_counts || {};
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      
      // Find most common intent
      let maxCount = 0;
      let primaryIntent = null;
      for (const [intentType, count] of Object.entries(intentCounts)) {
        if (count > maxCount) {
          maxCount = count;
          primaryIntent = intentType;
        }
      }
      
      this.primary_intent = primaryIntent;
      this.conversation_data = {
        ...this.conversation_data,
        intent_counts: intentCounts
      };
    }
    
    return await this.save();
  };
  
  ChatSession.prototype.setRating = async function(rating, feedback = null) {
    this.satisfaction_rating = rating;
    if (feedback) {
      this.feedback = feedback;
    }
    return await this.save();
  };
  
  // Class methods
  ChatSession.findBySessionId = async function(sessionId) {
    return await this.findOne({ where: { session_id: sessionId } });
  };
  
  ChatSession.getAnalytics = async function(period = 'month') {
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
        COUNT(*) as total_sessions,
        AVG(total_messages) as avg_messages_per_session,
        AVG(duration_seconds) as avg_duration_seconds,
        AVG(satisfaction_rating) as avg_satisfaction,
        COUNT(CASE WHEN satisfaction_rating >= 4 THEN 1 END) as positive_ratings,
        primary_intent,
        COUNT(*) as intent_count
      FROM chat_sessions 
      WHERE started_at >= :dateFrom
      GROUP BY primary_intent
      ORDER BY intent_count DESC
    `, {
      replacements: { dateFrom },
      type: sequelize.QueryTypes.SELECT
    });
    
    return results;
  };
  
  return ChatSession;
};

// Analytics Model
module.exports.Analytics = (sequelize, DataTypes) => {
  const Analytics = sequelize.define('Analytics', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    event_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of analytics event'
    },
    
    event_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Event data and metadata'
    },
    
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    
    session_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    ip_address: {
      type: DataTypes.INET,
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
        fields: ['timestamp']
      },
      {
        fields: ['session_id']
      }
    ]
  });
  
  return Analytics;
};
