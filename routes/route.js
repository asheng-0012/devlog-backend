const express = require('express');
const router = express.Router();

const {
    getQuestions,
    getQuestionById,
    getSources,
    getTags
} = require('../controllers/questionController');

// Question routes
router.get('/questions', getQuestions);

// these two must come BEFORE '/questions/:id'
// otherwise Express reads "sources" and "tags" as an id
router.get('/questions/sources', getSources);
router.get('/questions/tags', getTags);

router.get('/questions/:id', getQuestionById);

module.exports = router;