
const Question = require('../models/question');

// Get all questions
const getQuestions = async (req, res) => {
    try {

        const { difficulty, tag } = req.query;
        const filter = {};
        if (difficulty) {
            filter.difficulty = difficulty;
        }
        if (tag) {
            filter.tags = tag;
        }
        const questions = await Question.find(filter);
        res.status(200).json(questions);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { getQuestions };
