// src/models/Column.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Column = sequelize.define('Column', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  position: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  board_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'boards',
      key: 'id'
    }
  }
}, {
  tableName: 'columns'
});

module.exports = Column;