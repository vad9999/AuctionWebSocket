module.exports = (sequelize, DataTypes) => {
  const AuctionStatus = sequelize.define(
    'AuctionStatus',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      }
    },
    {
      tableName: 'auction_statuses',
      timestamps: true,
      paranoid: true
    }
  );

  return AuctionStatus;
};