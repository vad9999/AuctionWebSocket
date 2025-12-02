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
// const AuctionStatus = require('./auctionStatus')(sequelize, DataTypes);
// const AuctionType   = require('./auctionType')(sequelize, DataTypes);
// const AuctionTheme  = require('./auctionTheme')(sequelize, DataTypes);

// пользователь создаёт аукционы
User.hasMany(Auction, { foreignKey: 'createdBy', as: 'createdAuctions' });
Auction.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// пользователь выигрывает аукционы
User.hasMany(Auction, { foreignKey: 'winnerId', as: 'wonAuctions' });
Auction.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });

// пользователь делает ставки
User.hasMany(Bid, { foreignKey: 'userId' });
Bid.belongsTo(User, { foreignKey: 'userId' });

// ставки к аукциону
Auction.hasMany(Bid, { foreignKey: 'auctionId' });
Bid.belongsTo(Auction, { foreignKey: 'auctionId' });

// // статус аукциона
// AuctionStatus.hasMany(Auction, { foreignKey: 'statusId', as: 'auctions' });
// Auction.belongsTo(AuctionStatus, { foreignKey: 'statusId', as: 'status' });

// // тип аукциона
// AuctionType.hasMany(Auction, { foreignKey: 'typeId', as: 'auctions' });
// Auction.belongsTo(AuctionType, { foreignKey: 'typeId', as: 'type' });

// // ТЕМА аукциона
// AuctionTheme.hasMany(Auction, { foreignKey: 'themeId', as: 'auctions' });
// Auction.belongsTo(AuctionTheme, { foreignKey: 'themeId', as: 'theme' });

module.exports = {
  sequelize,
  User,
  Auction,
  Bid
  // AuctionStatus,
  // AuctionType,
  // AuctionTheme
};