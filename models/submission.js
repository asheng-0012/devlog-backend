const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problemId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    correctness: {
        type: Number,
        required: true
    },
    points: {
        type: Number,
        default: 0
    },
    timeComplexity: {
        type: String,
        default: '—'
    },
    spaceComplexity: {
        type: String,
        default: '—'
    },
    feedback: {
        type: String,
        default: ''
    },
    improvements: {
        type: [String],
        default: []
    }
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;

