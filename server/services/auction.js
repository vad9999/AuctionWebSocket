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
    where.theme = theme; // ENUM theme
  }
  if (type) {
    where.type = type;   // ENUM type ('classic' | 'dutch')
  }
  if (status) {
    where.status = status; // ENUM status ('appointed' | 'active' | 'finished')
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

// общая валидация полей
function validateAuctionPayload({ title, description, theme, type, startingPrice, startsAt, endsAt }) {
  if (!title || !description || !theme || !type || !startingPrice || !startsAt || !endsAt) {
    throw new Error('Название, описание, тема, тип, стартовая цена и время начала/окончания обязательны');
  }

  const priceNum = Number(startingPrice);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    throw new Error('Некорректная стартовая цена');
  }

  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  if (isNaN(startDate.getTime())) {
    throw new Error('Некорректное время начала аукциона');
  }
  if (isNaN(endDate.getTime())) {
    throw new Error('Некорректное время окончания аукциона');
  }
  if (endDate <= startDate) {
    throw new Error('Время окончания должно быть позже времени начала');
  }

  return { priceNum, startDate, endDate };
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
  const { priceNum, startDate, endDate } = validateAuctionPayload({
    title,
    description,
    theme,
    type,
    startingPrice,
    startsAt,
    endsAt
  });

  const auction = await Auction.create({
    title,
    description,
    theme,
    type,
    status: 'appointed',    // начальный статус
    startingPrice: priceNum,
    currentPrice: priceNum,
    startsAt: startDate,
    endsAt: endDate,
    createdBy: creatorId
  });

  return auction;
}

// обновление аукциона
async function updateAuction({
  auctionId,
  userId,
  title,
  description,
  theme,
  type,
  startingPrice,
  startsAt,
  endsAt
}) {
  const auction = await Auction.findByPk(auctionId);
  if (!auction) {
    throw new Error('Аукцион не найден');
  }

  // проверка, что текущий пользователь — организатор
  if (auction.createdBy !== userId) {
    throw new Error('У вас нет прав на редактирование этого аукциона');
  }

  const now = new Date();

  // НЕЛЬЗЯ редактировать после начала
  if (auction.startsAt && now >= auction.startsAt) {
    throw new Error('Нельзя редактировать аукцион после начала');
  }
  // на всякий случай — завершённый тоже нельзя
  if (auction.status === 'finished') {
    throw new Error('Нельзя редактировать завершённый аукцион');
  }

  const { priceNum, startDate, endDate } = validateAuctionPayload({
    title,
    description,
    theme,
    type,
    startingPrice,
    startsAt,
    endsAt
  });

  auction.title = title;
  auction.description = description;
  auction.theme = theme;
  auction.type = type;
  auction.startsAt = startDate;
  auction.endsAt = endDate;
  auction.startingPrice = priceNum;
  auction.currentPrice = priceNum; // до начала можем перезадать

  await auction.save();
  return auction;
}

// удаление аукциона (soft delete, paranoid)
async function deleteAuction({ auctionId, userId }) {
  const auction = await Auction.findByPk(auctionId);
  if (!auction) {
    throw new Error('Аукцион не найден');
  }

  if (auction.createdBy !== userId) {
    throw new Error('У вас нет прав на удаление этого аукциона');
  }

  const now = new Date();

  // НЕЛЬЗЯ удалять после начала
  if (auction.startsAt && now >= auction.startsAt) {
    throw new Error('Нельзя удалить аукцион после его начала');
  }

  await auction.destroy(); // paranoid: true => soft delete (deletedAt)
}

module.exports = {
  listAuctions,
  createAuction,
  updateAuction,
  deleteAuction
};