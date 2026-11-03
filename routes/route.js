const express = require('express');
const router = express.Router();

const { getQuestions } = require('../controllers/questionController');

// Question routes
router.get('/questions', getQuestions);

module.exports = router;
