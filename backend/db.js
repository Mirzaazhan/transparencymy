import dotenv from 'dotenv';
dotenv.config(); // Add this line to load environment variables

import mongoose from 'mongoose';

// Replace with your MongoDB connection string
const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected successfully.');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

export default connectDB;
