const express = require('express');
const router = express.Router();

const { signup, login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);

// these two need a token, so protect runs first
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);

module.exports = router;