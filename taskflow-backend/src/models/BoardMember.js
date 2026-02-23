// src/models/BoardMember.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BoardMember = sequelize.define('BoardMember', {
  board_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    references: {
      model: 'boards',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'member', 'viewer'),
    defaultValue: 'member'
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'board_members',
  timestamps: false
});

module.exports = BoardMember;