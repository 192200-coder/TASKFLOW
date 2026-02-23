// src/models/TaskHistory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskHistory = sequelize.define('TaskHistory', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  task_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  field_changed: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  old_value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  new_value: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'task_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = TaskHistory;