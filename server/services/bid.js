const { Auction, Bid, User } = require('../models');
const { ensureAuctionAvailableForBid } = require('./auctionTime');

function getBestBidForAuction(auction, bids) {
  if (!bids.length) return null;
  
  if (auction.type === 'classic') {
    return bids.reduce((max, b) =>
      Number(b.amount) > Number(max.amount) ? b : max
    );
  }
  if (auction.type === 'dutch') {
    return bids.reduce((min, b) =>
      Number(b.amount) < Number(min.amount) ? b : min
    );
  }
  return null;
}

async function getAuctionWithBids(auctionId) {
  const auction = await Auction.findByPk(auctionId, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'firstName', 'lastName', 'surname']
      }
    ]
  });
  if (!auction) {
    throw new Error('Аукцион не найден');
  }

  const bids = await Bid.findAll({
    where: { auctionId },
    include: [
      {
        model: User,
        attributes: ['id', 'email', 'firstName', 'lastName', 'surname']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const bestBid = getBestBidForAuction(auction, bids);
  return { auction, bids, bestBid };
}

async function placeBid({ auctionId, userId, amount }) {

  const auctionForCheck = await ensureAuctionAvailableForBid(auctionId);

  if (auctionForCheck.createdBy === userId) {
    throw new Error('Организатор не может делать ставки в своём аукционе');
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Некорректная сумма ставки');
  }

  if (auctionForCheck.type === 'classic') {
    if (numericAmount <= Number(auctionForCheck.currentPrice)) {
      throw new Error('Ставка должна быть выше текущей цены');
    }
  } else if (auctionForCheck.type === 'dutch') {
    if (numericAmount >= Number(auctionForCheck.currentPrice)) {
      throw new Error('Ставка должна быть ниже текущей цены');
    }
  }

  const bid = await Bid.create({
    auctionId: auctionForCheck.id,
    userId,
    amount: numericAmount
  });

  auctionForCheck.currentPrice = numericAmount;
  await auctionForCheck.save();

  const { auction, bids, bestBid } = await getAuctionWithBids(auctionId);

  return { auction, bid, bids, bestBid };
}

module.exports = {
  getAuctionWithBids,
  placeBid
};