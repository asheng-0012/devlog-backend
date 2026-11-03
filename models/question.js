
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    statement: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    source: {
        type: String
    },
    sourceUrl: {
        type: String
    }
});

const question = mongoose.model('Question', questionSchema);

module.exports = question;
