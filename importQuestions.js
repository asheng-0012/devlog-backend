require('dotenv').config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Question = require('./models/question');

// "['Data structures', 'Sorting']"  ->  ["Data structures", "Sorting"]
const cleanTags = (tags) => {
    // in the json file tags can be a plain string or an array
    const list = Array.isArray(tags) ? tags : [tags];

    const result = [];
    for (const item of list) {
        const parts = String(item).replace(/[\[\]'"]/g, '').split(',');
        for (const part of parts) {
            const tag = part.trim();
            if (tag) {
                result.push(tag);
            }
        }
    }
    return result;
};

const importQuestions = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB connected');

        // Read questions.json
        const filePath = path.join(__dirname, 'data', 'questions.json');

        const questions = JSON.parse(
            fs.readFileSync(filePath, 'utf-8')
        );

        // Fix the tags of every question
        for (const q of questions) {
            q.tags = cleanTags(q.tags || []);
        }

        // Clear existing questions
        await Question.deleteMany({});

        // Insert new questions
        await Question.insertMany(questions);

        console.log('Questions imported successfully!');
        console.log('Total questions:', questions.length);

        await mongoose.connection.close();

    } catch (error) {
        console.log('Import failed:', error.message);
        await mongoose.connection.close();
    }
};

importQuestions();