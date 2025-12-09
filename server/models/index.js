const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: false
});

const User          = require('./user')(sequelize, DataTypes);
const Auction       = require('./auction')(sequelize, DataTypes);
const Bid           = require('./bid')(sequelize, DataTypes);

User.hasMany(Auction, { foreignKey: 'createdBy', as: 'createdAuctions' });
Auction.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Auction, { foreignKey: 'winnerId', as: 'wonAuctions' });
Auction.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });

User.hasMany(Bid, { foreignKey: 'userId' });
Bid.belongsTo(User, { foreignKey: 'userId' });

Auction.hasMany(Bid, { foreignKey: 'auctionId' });
Bid.belongsTo(Auction, { foreignKey: 'auctionId' });

module.exports = {
  sequelize,
  User,
  Auction,
  Bid
};