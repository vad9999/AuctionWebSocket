// server/routes/auction.js
const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auction');
const authMiddleware = require('../middleware/auth');
// Публичный список

router.get('/', auctionController.list);

// Создание — только авторизованный
router.post('/', authMiddleware, auctionController.create);

// Обновление — только авторизованный организатор, до начала
router.put('/:id', authMiddleware, auctionController.update);

// Удаление — только авторизованный организатор, до начала
router.delete('/:id', authMiddleware, auctionController.remove);

module.exports = router;