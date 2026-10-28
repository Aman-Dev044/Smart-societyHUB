import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI or MONGODB_URI not set");
  return mongoose.connect(uri);
}
