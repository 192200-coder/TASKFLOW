// src/models/TaskAttachment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskAttachment = sequelize.define('TaskAttachment', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  task_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  uploaded_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'task_attachments',
  timestamps: true,
  createdAt: 'uploaded_at',
  updatedAt: false
});

module.exports = TaskAttachment;