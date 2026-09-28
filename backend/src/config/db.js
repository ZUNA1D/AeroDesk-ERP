import mongoose from 'mongoose';
import { env } from './env.js';

let mongodInstance = null;

async function ensureCleanIndexes() {
  const drops = [
    { col: 'transactions', index: 'ref_1' },
    { col: 'airlines', index: 'name_1' },
    { col: 'sectors', index: 'name_1' }
  ];

  for (const { col, index } of drops) {
    try {
      const collection = mongoose.connection.collection(col);
      const indexes = await collection.indexes();
      if (indexes.some(i => i.name === index)) {
        await collection.dropIndex(index);
        console.log(`[DB] Dropped legacy index '${index}' on collection '${col}'`);
      }
    } catch (_) {
      // Collection or index might not exist on a fresh DB, safe to ignore
    }
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
