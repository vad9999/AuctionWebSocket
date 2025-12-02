// server/services/auction.js
const { Op } = require('sequelize');
const { Auction, User } = require('../models');

const DEFAULT_LIMIT = 12;

// сортировка
function buildOrder(sort) {
  switch (sort) {
    case 'end_asc':
      return [['endsAt', 'ASC']];   // скоро заканчиваются
    case 'end_desc':
      return [['endsAt', 'DESC']];  // позже заканчиваются
    default:
      return [['createdAt', 'DESC']]; // новые сначала
  }
}

// список аукционов с фильтрами и пагинацией
async function listAuctions({
  search,
  theme,
  type,
  status,
  sort,
  page = 1,
  limit = DEFAULT_LIMIT
}) {
  const where = {};

  if (search) {
    where.title = { [Op.iLike]: `%${search}%` };
  }
  if (theme) {
    where.theme = theme; // ENUM
  }
  if (type) {
    where.type = type;   // ENUM ('classic' | 'dutch')
  }
  if (status) {
    where.status = status; // ENUM ('appointed' | 'active' | 'finished')
  }

  const order = buildOrder(sort);
  const pageNum = Number(page) > 0 ? Number(page) : 1;
  const limitNum = Number(limit) > 0 ? Number(limit) : DEFAULT_LIMIT;
  const offset = (pageNum - 1) * limitNum;

  const { rows, count } = await Auction.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'firstName', 'lastName', 'surname']
      }
    ],
    order,
    offset,
    limit: limitNum
  });

  const hasMore = offset + rows.length < count;

  return {
    items: rows,
    total: count,
    page: pageNum,
    limit: limitNum,
    hasMore
  };
}

// создание аукциона
async function createAuction({
  title,
  description,
  theme,
  type,
  startingPrice,
  startsAt,
  endsAt,
  creatorId
}) {
  if (!title || !description || !theme || !type || !startingPrice || !startsAt || !endsAt) {
    throw new Error('Название, описание, тема, тип, стартовая цена и время начала/окончания обязательны');
  }

  const priceNum = Number(startingPrice);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    throw new Error('Некорректная стартовая цена');
  }

  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  if (!(startDate instanceof Date) || isNaN(startDate)) {
    throw new Error('Некорректное время начала аукциона');
  }
  if (!(endDate instanceof Date) || isNaN(endDate)) {
    throw new Error('Некорректное время окончания аукциона');
  }
  if (endDate <= startDate) {
    throw new Error('Время окончания должно быть позже времени начала');
  }

  const auction = await Auction.create({
    title,
    description,
    theme,                // один из ENUM: 'cars', 'real_estate_residential', ...
    type,                 // 'classic' | 'dutch'
    status: 'appointed',  // начальный статус
    startingPrice: priceNum,
    currentPrice: priceNum,
    startsAt: startDate,
    endsAt: endDate,
    createdBy: creatorId
  });

  return auction;
}

module.exports = {
  listAuctions,
  createAuction
};