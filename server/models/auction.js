module.exports = (sequelize, DataTypes) => {
  const Auction = sequelize.define(
    'Auction',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      startPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      currentPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      statusId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      typeId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      themeId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      endsAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdBy: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      winnerId: {
        type: DataTypes.BIGINT,
        allowNull: true
      }
    },
    {
      tableName: 'auctions',
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          name: 'idx_auctions_statusId_startsAt',
          fields: ['statusId', 'startsAt']
        },
        {
          name: 'idx_auctions_typeId',
          fields: ['typeId']
        },
        {
          name: 'idx_auctions_themeId',
          fields: ['themeId']
        }
      ]
    }
  );

  return Auction;
};