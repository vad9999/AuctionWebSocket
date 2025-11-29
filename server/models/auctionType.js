module.exports = (sequelize, DataTypes) => {
  const AuctionType = sequelize.define(
    'AuctionType',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      priceDirection: {
        type: DataTypes.STRING(25),
        allowNull: false,
        unique: true
      }
    },
    {
      tableName: 'auction_types',
      timestamps: true,
      paranoid: true
    }
  );

  return AuctionType;
};