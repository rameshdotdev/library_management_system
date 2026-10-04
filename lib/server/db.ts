import mongoose from "mongoose";

const globalForMongoose = globalThis as typeof globalThis & {
  __mongooseConnection?: Promise<typeof mongoose> | null;
};

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!globalForMongoose.__mongooseConnection) {
    globalForMongoose.__mongooseConnection = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    await globalForMongoose.__mongooseConnection;
    return mongoose;
  } catch (error) {
    globalForMongoose.__mongooseConnection = null;
    throw error;
  }
}
