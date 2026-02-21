import mongoose from "mongoose";
import config from "./index.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.url);
    console.log(`[Database] MongoDB connected........`);
    return conn;
  } catch (err) {
    console.error(`[Database] Connection error: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("[Database] MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error(`[Database] MongoDB error: ${err.message}`);
});

export default { connectDB };
