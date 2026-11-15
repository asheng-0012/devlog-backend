const mongoose = require('mongoose');
const Question = require('../models/question');

// makes special characters in the search text safe (so "c++" does not break the query)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get questions (filters + search + pagination)
const getQuestions = async (req, res) => {
    try {

        const { difficulty, tag, source, search } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 15, 50);

        const filter = {};
        if (difficulty) {
            filter.difficulty = difficulty;
        }
        if (tag) {
            filter.tags = tag;
        }
        if (source) {
            // the database stores sources in lowercase
            filter.source = source.toLowerCase();
        }
        if (search) {
            // find the text anywhere in the statement, ignoring upper/lower case
            filter.statement = { $regex: escapeRegex(search), $options: 'i' };
        }

        const total = await Question.countDocuments(filter);
        const questions = await Question.find(filter)
            .sort({ _id: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            questions,
            total,
            page,
            pages: Math.ceil(total / limit)
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Get one question by id
const getQuestionById = async (req, res) => {
    try {

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid question id' });
        }

        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.status(200).json(question);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Count of questions per source (for the source chips)
const getSources = async (req, res) => {
    try {

        const sources = await Question.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json(sources);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// All different tags (for the Topic dropdown)
const getTags = async (req, res) => {
    try {

        const tags = await Question.distinct('tags');
        res.status(200).json(tags.sort());

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { getQuestions, getQuestionById, getSources, getTags };