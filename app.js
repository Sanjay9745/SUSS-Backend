const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const connectToDatabase = require('./config/db');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require("./routes/vendorRoutes")
const productRoutes = require("./routes/productRoutes");
const superAdmin    = require("./routes/superAdmin");
// Load environment variables from .env


// Connect to MongoDB
connectToDatabase();

// Middleware
app.use(bodyParser.json()); // JSON parsing
app.use(bodyParser.urlencoded({ extended: false })); // URL-encoded parsing
app.use(express.static('public')); // Serve static files
app.use(express.static('uploads')); // Serve static files

app.use(morgan('dev')); // Logging
app.use('/api/user', userRoutes); // Routes
app.use('/api/vendor',vendorRoutes)
app.use('/api/product',productRoutes)
app.use('/api/admin', superAdmin); // Routes
module.exports = app;
