const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const connectToDatabase = require('./config/db');
const morgan = require('morgan');
const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require("./routes/vendorRoutes")
const productRoutes = require("./routes/productRoutes");
const superAdminRoutes   = require("./routes/superAdminRoutes");
// Load environment variables from .env


// Connect to MongoDB
connectToDatabase();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Serve static files
app.use(express.static('uploads')); // Serve static files

app.use(morgan('dev')); // Logging
app.use('/api/user', userRoutes); // Routes
app.use('/api/vendor',vendorRoutes)
app.use('/api/product',productRoutes)
app.use('/api/admin', superAdminRoutes); // Routes
module.exports = app;
