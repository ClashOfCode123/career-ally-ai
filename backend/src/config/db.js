import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    console.log("🔍 Attempting to connect to MongoDB...");
    
    // We add specific options to handle connection stability
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000, // Wait 15s before giving up
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // This will print the specific error (Auth, DNS, or Timeout)
    console.error("❌ MongoDB Connection Error details:", error.message);
    
    // Suggest specific common fixes based on the error
    if (error.message.includes("bad auth")) {
      console.error("💡 Hint: Check your username/password in .env file.");
    } else if (error.message.includes("timed out")) {
      console.error("💡 Hint: Check if your network blocks MongoDB (try mobile hotspot).");
    }
    
    process.exit(1);
  }
};