const express = require('express');
const router = express.Router();

const { createSubmission, getUserSubmissions } = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createSubmission);
router.get('/', protect, getUserSubmissions);

module.exports = router;

