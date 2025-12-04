// server/ws.js
const WebSocket = require('ws');
const { updateAuctionsStatusByTime } = require('./services/auctionTime');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // Функция, которую передаём в updateAuctionsStatusByTime
  function broadcastStatusChange(auction) {
    const payload = JSON.stringify({
      type: 'auction_status_changed',
      auction: {
        id: auction.id,
        status: auction.status,
        startsAt: auction.startsAt,
        endsAt: auction.endsAt
      }
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // Периодически проверяем время всех аукционов
  const interval = setInterval(() => {
    updateAuctionsStatusByTime(broadcastStatusChange)
      .catch((err) => console.error('updateAuctionsStatusByTime error:', err));
  }, 5000); // каждые 5 секунд; можешь увеличить/уменьшить

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'connected', message: 'WS connected' }));
  });

  return wss;
}

module.exports = { setupWebSocket };