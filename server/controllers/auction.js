// server/controllers/auctionController.js
const auctionService = require('../services/auction');

async function list(req, res) {
  try {
    const {
      search,
      theme,
      type,
      status,
      sort,
      page,
      limit
    } = req.query;

    const result = await auctionService.listAuctions({
      search,
      theme,
      type,
      status,
      sort,
      page,
      limit
    });

    res.json(result); // { items, total, page, limit, hasMore }
  } catch (e) {
    console.error('Auctions list error:', e);
    res.status(500).json({ error: 'Ошибка загрузки аукционов' });
  }
}

async function create(req, res) {
  try {
    const userId = req.user?.id; // из authMiddleware

    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const {
      title,
      description,
      theme,
      type,
      startingPrice,
      startsAt,
      endsAt
    } = req.body;

    const auction = await auctionService.createAuction({
      title,
      description,
      theme,
      type,
      startingPrice,
      startsAt,
      endsAt,
      creatorId: userId
    });

    res.status(201).json(auction);
  } catch (e) {
    console.error('Create auction error:', e);
    res.status(400).json({ error: e.message || 'Ошибка создания аукциона' });
  }
}

module.exports = {
  list,
  create
};