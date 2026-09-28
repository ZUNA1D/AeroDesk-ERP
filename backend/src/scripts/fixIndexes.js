import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { Transaction } from '../models/transaction/Transaction.js';
import { Supplier } from '../models/Supplier.js';
import { Client } from '../models/Client.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import { Settings } from '../models/Settings.js';
import { User } from '../models/User.js';

async function fixIndexes() {
  try {
    console.log('[FixIndexes] Connecting to MongoDB...');
    await connectDB();

    const collections = [
      { name: 'transactions', model: Transaction },
      { name: 'suppliers', model: Supplier },
      { name: 'clients', model: Client },
      { name: 'expensecategories', model: ExpenseCategory },
      { name: 'settings', model: Settings },
      { name: 'users', model: User }
    ];

    for (const { name, model } of collections) {
      console.log(`\n--- Inspecting collection: ${name} ---`);
      try {
        const indexes = await model.collection.indexes();
        console.log(`Current indexes on ${name}:`, indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique })));

        // Check if legacy single-field unique index exists
        if (name === 'transactions') {
          const hasLegacyRef = indexes.find(i => i.name === 'ref_1');
          if (hasLegacyRef) {
            console.log(`⚠️ Found legacy single-field unique index 'ref_1' on transactions. Dropping it...`);
            await model.collection.dropIndex('ref_1');
            console.log(`✅ Successfully dropped 'ref_1' from transactions!`);
          }
        }

        if (name === 'suppliers') {
          const hasLegacyName = indexes.find(i => i.name === 'name_1');
          if (hasLegacyName) {
            console.log(`⚠️ Found legacy index 'name_1' on suppliers. Dropping it...`);
            await model.collection.dropIndex('name_1');
            console.log(`✅ Successfully dropped 'name_1' from suppliers!`);
          }
        }

        if (name === 'expensecategories') {
          const hasLegacyName = indexes.find(i => i.name === 'name_1');
          if (hasLegacyName) {
            console.log(`⚠️ Found legacy index 'name_1' on expensecategories. Dropping it...`);
            await model.collection.dropIndex('name_1');
            console.log(`✅ Successfully dropped 'name_1' from expensecategories!`);
          }
        }

        // Sync model indexes
        await model.syncIndexes();
        console.log(`✅ Synced indexes for ${name}`);
      } catch (colErr) {
        console.error(`Error on collection ${name}:`, colErr.message);
      }
    }

    console.log('\n🎉 Index cleanup and sync completed successfully!');
  } catch (err) {
    console.error('❌ Error fixing indexes:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

fixIndexes();
