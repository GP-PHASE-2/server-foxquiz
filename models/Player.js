const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Room = require('./Room');

const Player = sequelize.define('Player', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  roomId: {
    type: DataTypes.UUID,
    references: {
      model: Room,
      key: 'id'
    }
  },
  isHost: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

Room.hasMany(Player, { foreignKey: 'roomId' });
Player.belongsTo(Room, { foreignKey: 'roomId' });

module.exports = Player;