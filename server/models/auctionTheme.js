module.exports = (sequelize, DataTypes) => {
  const AuctionTheme = sequelize.define(
    'AuctionTheme',
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
      tableName: 'auction_thems',
      timestamps: true,
      paranoid: true
    }
  );

  return AuctionTheme;
};