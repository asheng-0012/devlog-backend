
require('dotenv').config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Question = require('./models/question');

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
