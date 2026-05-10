import mongoose from 'mongoose';
import { User } from '../models/User.js';
import 'dotenv/config';

const seedUser = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const testUser = await User.create({
    username: "test_dev",
    email: "test@example.com",
    passwordHash: "dummyhash" 
  });
  console.log("Test User Created! ID:", testUser._id);
  process.exit();
};

seedUser();