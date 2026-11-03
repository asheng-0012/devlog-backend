require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes/route');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/', routes);

connectDB();

app.get('/', (req, res) => {
    res.send('DEVLOG API is running');
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});