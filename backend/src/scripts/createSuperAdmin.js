import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';

async function createOrUpdateSuperAdmin() {
  const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL || 'superadmin@aerodesk.com';
  const password = process.argv[3] || process.env.SUPER_ADMIN_PASSWORD || 'superadmin123';
  const name = process.argv[4] || 'Platform Super Admin';

  try {
    console.log('[SuperAdmin] Connecting to MongoDB...');
    await connectDB();

    const cleanEmail = email.trim().toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let superAdmin = await User.findOne({ email: cleanEmail });
    if (superAdmin) {
      superAdmin.role = 'SUPER_ADMIN';
      superAdmin.passwordHash = passwordHash;
      superAdmin.name = name;
      superAdmin.agency = null;
      superAdmin.active = true;
      await superAdmin.save();
      console.log(`\n👑 Super Admin updated successfully!`);
    } else {
      superAdmin = await User.create({
        name,
        email: cleanEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        active: true,
        agency: null
      });
      console.log(`\n👑 Super Admin created successfully!`);
    }

    console.log(`------------------------------------------`);
    console.log(`Email:    ${cleanEmail}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     SUPER_ADMIN`);
    console.log(`------------------------------------------\n`);
  } catch (err) {
    console.error('❌ Failed to create/update Super Admin:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

createOrUpdateSuperAdmin();
