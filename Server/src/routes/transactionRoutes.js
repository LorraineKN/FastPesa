const express = require('express');
const { authMiddleware } = require('../controllers/authMiddleware');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

router.get('/', authMiddleware, transactionController.getTransactions);
router.get('/:id', authMiddleware, transactionController.getTransactionById);

module.exports = router;
