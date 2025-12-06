// server/services/auctionTime.js
const { Auction } = require('../models');

// обновляем status по времени для одного аукциона
async function syncAuctionStatusByTime(auction) {
  const now = new Date();
  let newStatus = auction.status;

  if (
    auction.status === 'appointed' &&
    auction.startsAt &&
    auction.startsAt <= now
  ) {
    newStatus = 'active';
  }

  if (
    (auction.status === 'active' || newStatus === 'active') &&
    auction.endsAt &&
    auction.endsAt <= now
  ) {
    newStatus = 'finished';
  }

  if (newStatus !== auction.status) {
    auction.status = newStatus;
    await auction.save();
  }

  return auction;
}

// проверка: аукцион существует, начался, не завершён, статус active
async function ensureAuctionAvailableForBid(auctionId) {
  const auction = await Auction.findByPk(auctionId);
  if (!auction) {
    throw new Error('Аукцион не найден');
  }

  await syncAuctionStatusByTime(auction);

  const now = new Date();

  if (auction.startsAt && now < auction.startsAt) {
    throw new Error('Аукцион ещё не начался');
  }
  if (auction.endsAt && now >= auction.endsAt) {
    throw new Error('Аукцион уже завершён');
  }
  if (auction.status !== 'active') {
    throw new Error('По этому аукциону нельзя делать ставки');
  }

  return auction;
}

module.exports = {
  syncAuctionStatusByTime,
  ensureAuctionAvailableForBid
};