const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_schemes';
  
  // Attempt to connect to specified MongoDB URI first
  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
      autoIndex: true
    });
    console.log(`[Database] MongoDB successfully connected via primary URI: ${mongoose.connection.host}`);
    return;
  } catch (err) {
    console.warn(`[Database] Standard MongoDB connection failed: ${err.message}`);
    console.log('[Database] Starting built-in embedded MongoMemoryServer for immediate zero-config persistence...');
  }

  // Graceful fallback to embedded MongoMemoryServer
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        dbName: 'student_schemes'
      }
    });
    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri, {
      autoIndex: true
    });
    console.log(`[Database] Connected successfully to embedded MongoMemoryServer at: ${memoryUri}`);
  } catch (memErr) {
    console.error('[Database] Failed to initialize embedded MongoMemoryServer:', memErr.message);
    throw memErr;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[Database] Error disconnecting database:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
