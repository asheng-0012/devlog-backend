const Submission = require('../models/submission');

// Save a new submission (called right after the Gemini AI assessment on the frontend)
const createSubmission = async (req, res) => {
    try {
        const { problemId, title, language, code, correctness, points, timeComplexity, spaceComplexity, feedback, improvements } = req.body;

        if (!problemId || !title || !language || !code || correctness === undefined) {
            return res.status(400).json({ message: 'Missing required submission fields' });
        }

        const submission = await Submission.create({
            userId: req.user._id,
            problemId,
            title,
            language,
            code,
            correctness,
            points: points || 0,
            timeComplexity: timeComplexity || '—',
            spaceComplexity: spaceComplexity || '—',
            feedback: feedback || '',
            improvements: Array.isArray(improvements) ? improvements : []
        });

        res.status(201).json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all submissions for the logged-in user, newest first
const getUserSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createSubmission, getUserSubmissions };

