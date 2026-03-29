const express = require('express');
const { register, login, refresh, logout } = require('../controllers/authController');
const { validate, schemas } = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../controllers/authMiddleware');

const router = express.Router();

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.post('/refresh', validate(schemas.refreshToken), refresh);
router.post('/logout', authMiddleware, logout);

module.exports = router;
