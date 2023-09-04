const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const connectToDatabase = require('./config/db');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const userRoutes = require('./routes/userRoutes');
// Load environment variables from .env


// Connect to MongoDB
connectToDatabase();

// Middleware
app.use(bodyParser.json()); // JSON parsing
app.use(bodyParser.urlencoded({ extended: false })); // URL-encoded parsing
app.use(morgan('dev')); // Logging
app.use('/api/users', userRoutes); // Routes

module.exports = app;
