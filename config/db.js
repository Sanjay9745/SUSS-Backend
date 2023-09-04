const mongoose = require('mongoose');

// Function to connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // You may choose to handle the error here, such as terminating the application.
    // Example: process.exit(1);
  }
}

module.exports = connectToDatabase;
