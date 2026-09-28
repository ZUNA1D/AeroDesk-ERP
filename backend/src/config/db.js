import mongoose from 'mongoose';
import { env } from './env.js';

let mongodInstance = null;

async function ensureCleanIndexes() {
  try {
    const txCollection = mongoose.connection.collection('transactions');
    const indexes = await txCollection.indexes();
    const legacyRefIndex = indexes.find(i => i.name === 'ref_1');
    if (legacyRefIndex) {
      await txCollection.dropIndex('ref_1');
      console.log('[DB] Dropped legacy single-field unique index ref_1 on transactions');
    }
  } catch (_) {
    // collection might not exist yet on a fresh DB, safe to ignore
  }
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = env.MONGODB_URI;

  if (uri && uri !== 'memory') {
    try {
      console.log(`[DB] Connecting to MongoDB at ${uri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}...`);
      const conn = await mongoose.connect(uri);
      console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
      await ensureCleanIndexes();
      return conn;
    } catch (err) {
      console.warn(`[DB] Connection to provided MONGODB_URI failed: ${err.message}. Falling back to in-memory replica set for dev...`);
    }
  }

  // In-memory replica set fallback (supports MongoDB multi-document transactions out of the box)
  try {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    console.log('[DB] Initializing embedded MongoDB Memory Replica Set (with transaction support)...');
    mongodInstance = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await mongodInstance.waitUntilRunning();
    const memoryUri = mongodInstance.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`[DB] Connected to embedded MongoDB Memory Replica Set: ${memoryUri}`);
    return conn;
  } catch (err) {
    console.error(`[DB] Failed to start embedded MongoDB Memory Server: ${err.message}`);
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
}
