const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  hostId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('waiting', 'playing', 'finished'),
    defaultValue: 'waiting'
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Umum'
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  currentQuestion: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  }
});

module.exports = Room;