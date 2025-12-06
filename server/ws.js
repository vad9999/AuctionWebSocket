// server/ws.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { getAuctionWithBids, placeBid } = require('./services/bid');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // auctionId -> Set<WebSocket>
  const rooms = new Map();

  function addToRoom(auctionId, ws) {
    let set = rooms.get(auctionId);
    if (!set) {
      set = new Set();
      rooms.set(auctionId, set);
    }
    set.add(ws);
    ws._auctionId = auctionId;
  }

  function removeFromRoom(ws) {
    const auctionId = ws._auctionId;
    if (!auctionId) return;
    const set = rooms.get(auctionId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) {
      rooms.delete(auctionId);
    }
  }

  function broadcastToRoom(auctionId, payloadObj) {
    const set = rooms.get(auctionId);
    if (!set) return;
    const data = JSON.stringify(payloadObj);
    for (const client of set) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  wss.on('connection', (ws) => {
    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      // подписка на аукцион
      if (msg.type === 'subscribe' && msg.auctionId) {
        try {
          const { auction, bids, bestBid } =
            await getAuctionWithBids(msg.auctionId);

          addToRoom(auction.id, ws);

          ws.send(JSON.stringify({
            type: 'auction_state',
            auction,
            bids,
            bestBid
          }));
        } catch (e) {
          ws.send(JSON.stringify({
            type: 'error',
            message: e.message || 'Ошибка загрузки аукциона'
          }));
        }
      }

      // ставка через WebSocket
      if (msg.type === 'place_bid') {
        try {
          const { auctionId, amount, token } = msg;
          if (!token) {
            ws.send(JSON.stringify({
              type: 'bid_error',
              message: 'Не передан токен'
            }));
            return;
          }

          let payload;
          try {
            payload = jwt.verify(token, JWT_SECRET);
          } catch {
            ws.send(JSON.stringify({
              type: 'bid_error',
              message: 'Неверный или просроченный токен'
            }));
            return;
          }

          const userId = payload.userId;
          if (!userId) {
            ws.send(JSON.stringify({
              type: 'bid_error',
              message: 'Некорректный токен'
            }));
            return;
          }

          const { auction, bids, bestBid } = await placeBid({
            auctionId,
            userId,
            amount
          });

          // ответ инициатору
          ws.send(JSON.stringify({
            type: 'bid_success'
          }));

          // обновлённое состояние всем подписчикам
          broadcastToRoom(auction.id, {
            type: 'bids_update',
            auction,
            bids,
            bestBid
          });
        } catch (e) {
          ws.send(JSON.stringify({
            type: 'bid_error',
            message: e.message || 'Ошибка при создании ставки'
          }));
        }
      }
    });

    ws.on('close', () => {
      removeFromRoom(ws);
    });
  });

  return wss;
}

module.exports = { setupWebSocket };