const express = require('express');
const router = express.Router();

const { assessCode } = require('../controllers/assessmentController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/assess — only logged-in users can get an assessment
router.post('/', protect, assessCode);

module.exports = router;

