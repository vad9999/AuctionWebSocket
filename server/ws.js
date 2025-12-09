const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Auction } = require('./models');
const { getAuctionWithBids, placeBid } = require('./services/bid');
const { syncAuctionStatusByTime } = require('./services/auctionTime');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('subscribe', async ({ auctionId }) => {
      try {
        const { auction, bids, bestBid } = await getAuctionWithBids(auctionId);

        socket.join(`auction:${auction.id}`);

        socket.emit('auction_state', {
          auction,
          bids,
          bestBid
        });
      } catch (e) {
        socket.emit('error', {
          message: e.message || 'Ошибка загрузки аукциона'
        });
      }
    });

    socket.on('place_bid', async ({ auctionId, amount, token }) => {
      try {
        if (!token) {
          socket.emit('bid_error', { message: 'Не передан токен' });
          return;
        }

        let payload;
        try {
          payload = jwt.verify(token, JWT_SECRET);
        } catch {
          socket.emit('bid_error', { message: 'Неверный или просроченный токен' });
          return;
        }

        const userId = payload.userId;
        if (!userId) {
          socket.emit('bid_error', { message: 'Некорректный токен' });
          return;
        }

        const { auction, bids, bestBid } = await placeBid({
          auctionId,
          userId,
          amount
        });

        socket.emit('bid_success');

        io.to(`auction:${auction.id}`).emit('bids_update', {
          auction,
          bids,
          bestBid
        });
      } catch (e) {
        socket.emit('bid_error', {
          message: e.message || 'Ошибка при создании ставки'
        });
      }
    });
  });

  setInterval(async () => {
    try {
      const now = new Date();

      const auctions = await Auction.findAll({
        where: {
          status: { [Op.in]: ['appointed', 'active'] }
        }
      });

      for (const auction of auctions) {
        const oldStatus = auction.status;
        await syncAuctionStatusByTime(auction);
        if (auction.status !== oldStatus) {
          io.emit('auction_status_changed', {
            id: auction.id,
            status: auction.status,
            startsAt: auction.startsAt,
            endsAt: auction.endsAt,
            currentPrice: auction.currentPrice
          });
        }
      }
    } catch (e) {
      console.error('Timer status update error:', e);
    }
  }, 5000);

  return io;
}

module.exports = { setupSocketIO };