// server/routes/auctionRoutes.js
const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auction');
const authMiddleware = require('../middleware/auth');

// Публичный список аукционов
// GET /api/auctions?search=&theme=&type=&status=&sort=&page=&limit=
router.get('/', auctionController.list);

// Создание аукциона — только авторизованный пользователь
// POST /api/auctions
router.post('/', authMiddleware, auctionController.create);

module.exports = router;