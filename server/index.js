// server/index.js
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auction');
const { setupWebSocket } = require('./ws');

const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    await sequelize.sync({ alter: true });

    const server = http.createServer(app);
    setupWebSocket(server);

    server.listen(PORT, () => {
      console.log(`HTTP+WS сервер запущен на http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('DB error:', err);
    process.exit(1);
  }
}

start();