/**
 * User Model - User Profile and Authentication Data
 * Stores additional user information beyond Clerk
 */

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    clerk_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Clerk user ID for authentication'
    },
    
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    
    first_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    last_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    company_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    role: {
      type: DataTypes.ENUM('user', 'admin', 'super_admin'),
      defaultValue: 'user'
    },
    
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'User preferences and settings'
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional user metadata'
    },
    
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'users',
    indexes: [
      {
        fields: ['clerk_id']
      },
      {
        fields: ['email']
      },
      {
        fields: ['role']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['created_at']
      }
    ]
  });
  
  // Associations
  User.associate = (models) => {
    User.hasMany(models.Quote, {
      foreignKey: 'user_id',
      as: 'quotes'
    });
    
    User.hasMany(models.ChatSession, {
      foreignKey: 'user_id',
      as: 'chatSessions'
    });
  };
  
  // Instance methods
  User.prototype.getFullName = function() {
    return `${this.first_name || ''} ${this.last_name || ''}`.trim() || this.email;
  };
  
  User.prototype.isAdmin = function() {
    return ['admin', 'super_admin'].includes(this.role);
  };
  
  User.prototype.updateLastLogin = async function() {
    this.last_login_at = new Date();
    return await this.save();
  };
  
  // Class methods
  User.findByClerkId = async function(clerkId) {
    return await this.findOne({ where: { clerk_id: clerkId } });
  };
  
  User.createFromClerk = async function(clerkUserData) {
    return await this.create({
      clerk_id: clerkUserData.id,
      email: clerkUserData.email_addresses[0]?.email_address,
      first_name: clerkUserData.first_name,
      last_name: clerkUserData.last_name,
      email_verified: clerkUserData.email_addresses[0]?.verification?.status === 'verified'
    });
  };
  
  return User;
};
