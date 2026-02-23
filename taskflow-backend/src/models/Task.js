// src/models/Task.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: { notEmpty: true }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('Alta', 'Media', 'Baja'),
    allowNull: false,
    defaultValue: 'Media'
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  position: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  column_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'columns', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  assigned_to: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  },
  updated_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  // ← Declarados explícitamente para que Sequelize los incluya en el INSERT
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
}, {
  tableName: 'tasks',
  timestamps: false,
});

module.exports = Task;