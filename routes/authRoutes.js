const express = require('express');
const router = express.Router();

const { signup, login, getMe, changePassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);

// these need a token, so protect runs first
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
router.put('/profile', protect, updateProfile);

module.exports = router;