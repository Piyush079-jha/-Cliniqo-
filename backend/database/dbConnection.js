import mongoose from "mongoose";

export const dbConnection = async (uri) => {
  if (!uri) throw new Error("MONGO_URI is not defined in config.env");

  await mongoose.connect(uri, {
    dbName: "HSM",
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  });

  console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
};