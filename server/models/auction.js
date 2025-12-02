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
        allowNull: false
      },
      startingPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      currentPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('appointed', 'active', 'finished'),
        allowNull: false,
        defaultValue: 'appointed'
      },
      type: {
        type: DataTypes.ENUM('classic', 'dutch'),
        allowNull: false,
        defaultValue: 'classic'
      },
      theme: {
        type: DataTypes.ENUM(
          'cars',
          'real_estate_residential',
          'electronics',
          'furniture',
          'clothes',
          'sports',
          'kids_toys',
          'books',
          'services_it',
          'services_repair',
          'game_items',
          'business_equipment',
          'charity'
        ),
        allowNull: false
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      endsAt: {
        type: DataTypes.DATE,
        allowNull: false
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
      paranoid: true
    }
  );

  return Auction;
};