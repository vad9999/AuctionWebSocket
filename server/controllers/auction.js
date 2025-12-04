// server/controllers/auction.js
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

    res.json(result);
  } catch (e) {
    console.error('Auctions list error:', e);
    res.status(500).json({ error: 'Ошибка загрузки аукционов' });
  }
}

async function create(req, res) {
  try {
    const userId = req.user?.id;

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

async function update(req, res) {
  try {
    const userId = req.user?.id;
    const auctionId = req.params.id;

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

    const auction = await auctionService.updateAuction({
      auctionId,
      userId,
      title,
      description,
      theme,
      type,
      startingPrice,
      startsAt,
      endsAt
    });

    res.json(auction);
  } catch (e) {
    console.error('Update auction error:', e);
    res.status(400).json({ error: e.message || 'Ошибка обновления аукциона' });
  }
}

async function remove(req, res) {
  try {
    const userId = req.user?.id;
    const auctionId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    await auctionService.deleteAuction({ auctionId, userId });

    res.status(204).send(); // No Content
  } catch (e) {
    console.error('Delete auction error:', e);
    res.status(400).json({ error: e.message || 'Ошибка удаления аукциона' });
  }
}

module.exports = {
  list,
  create,
  update,
  remove
};