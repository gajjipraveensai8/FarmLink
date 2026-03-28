import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

const connectDB = async (retries = 0) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    if (process.env.NODE_ENV !== "production") {
      console.log("MongoDB Connected");
    }
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    if (retries < MAX_RETRIES) {
      console.log(`Retrying MongoDB connection (${retries + 1}/${MAX_RETRIES}) in ${RETRY_DELAY / 1000}s...`);
      setTimeout(() => connectDB(retries + 1), RETRY_DELAY);
    } else {
      console.error("MongoDB connection failed after retries. Exiting.");
      process.exit(1);
    }
  }
};

export default connectDB;