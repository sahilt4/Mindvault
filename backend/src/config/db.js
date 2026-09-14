import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindvault';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for initial connection
      heartbeatFrequencyMS: 10000,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      console.error('[MongoDB Error] Please ensure your MongoDB Atlas IP Access list includes 0.0.0.0/0 and credentials are correct.');
    }
    // In production web services, allow container to restart rather than silent hanging
    process.exit(1);
  }
};
