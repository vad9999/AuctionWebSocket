module.exports = (sequelize, DataTypes) => {
  const Bid = sequelize.define(
    'Bid',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      auctionId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      }
    },
    {
      tableName: 'bids',
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          name: 'idx_bids_auction_created_at',
          fields: ['auctionId', 'createdAt']
        }
      ]
    }
  );

  return Bid;
};