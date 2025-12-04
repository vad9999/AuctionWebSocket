// server/services/auctionTime.js
const { Op } = require('sequelize');
const { Auction } = require('../models');

/**
 * Обновить статусы по времени:
 * - appointed -> active, если startsAt <= now
 * - active    -> finished, если endsAt <= now
 *
 * broadcastFn(auction) вызывается для каждого аукциона, у которого статус изменился.
 */
async function updateAuctionsStatusByTime(broadcastFn) {
  const now = new Date();

  // appointed -> active
  const toActivate = await Auction.findAll({
    where: {
      status: 'appointed',
      startsAt: { [Op.lte]: now }
    }
  });

  for (const auction of toActivate) {
    auction.status = 'active';
    await auction.save();
    if (broadcastFn) {
      broadcastFn(auction);
    }
  }

  // active -> finished
  const toFinish = await Auction.findAll({
    where: {
      status: 'active',
      endsAt: { [Op.lte]: now }
    }
  });

  for (const auction of toFinish) {
    auction.status = 'finished';
    await auction.save();
    if (broadcastFn) {
      broadcastFn(auction);
    }
  }
}

module.exports = {
  updateAuctionsStatusByTime
};