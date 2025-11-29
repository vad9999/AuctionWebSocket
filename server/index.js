require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const {
  sequelize,
  User,
  Auction,
  Bid,
  AuctionStatus,
  AuctionType,
  AuctionTopic
} = require('./models'); 

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // подключение к Postgres
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // создание/обновление таблиц (для разработки)
    await sequelize.sync({ alter: true }); // или await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`HTTP сервер запущен на http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('DB error:', err);
    process.exit(1);
  }
}

start();