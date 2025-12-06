// server/routes/auction.js
const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auction');
const authMiddleware = require('../middleware/auth');

router.get('/', auctionController.list);
router.get('/:id', auctionController.getOne);
router.post('/', authMiddleware, auctionController.create);
router.put('/:id', authMiddleware, auctionController.update);
router.delete('/:id', authMiddleware, auctionController.remove);

module.exports = router;