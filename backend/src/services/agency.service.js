import bcrypt from 'bcryptjs';
import { Agency } from '../models/Agency.js';
import { User } from '../models/User.js';
import { Supplier } from '../models/Supplier.js';
import { Settings } from '../models/Settings.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import { writeAuditLog } from './audit.service.js';

/**
 * Generate a URL-friendly slug from agency name
 */
export function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Provision a completely isolated new Agency workspace
 */
export async function provisionAgency({
  name,
  slug,
  email,
  phone,
  address,
  adminName,
  adminEmail,
  adminPassword,
  currency = 'BDT',
  subscriptionPlan = 'GROWTH'
}) {
  if (!name || !name.trim()) {
    throw new Error('Agency name is required.');
  }
  if (!adminEmail || !adminPassword || !adminName) {
    throw new Error('Admin name, email, and password are required.');
  }

  const cleanAdminEmail = adminEmail.trim().toLowerCase();

  // Check if admin user email already registered
  const existingUser = await User.findOne({ email: cleanAdminEmail });
  if (existingUser) {
    throw new Error(`A user with email "${cleanAdminEmail}" already exists.`);
  }

  // Derive slug
  let cleanSlug = (slug || generateSlug(name)).toLowerCase().trim();
  let candidateSlug = cleanSlug;
  let counter = 1;
  while (await Agency.findOne({ slug: candidateSlug })) {
    candidateSlug = `${cleanSlug}-${counter++}`;
  }
  cleanSlug = candidateSlug;

  // 1. Create Agency
  const agency = await Agency.create({
    name: name.trim(),
    slug: cleanSlug,
    email: email ? email.trim().toLowerCase() : cleanAdminEmail,
    phone: phone ? phone.trim() : undefined,
    address: address ? address.trim() : undefined,
    subscriptionPlan,
    status: 'ACTIVE'
  });

  // 2. Hash password & Create Agency Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const adminUser = await User.create({
    agency: agency._id,
    name: adminName.trim(),
    email: cleanAdminEmail,
    passwordHash,
    role: 'ADMIN',
    active: true
  });

  // Update Agency owner
  agency.owner = adminUser._id;
  await agency.save();

  // 3. Create Agency's Dedicated IN-HOUSE DIRECT Supplier
  await Supplier.create({
    agency: agency._id,
    name: 'IN-HOUSE / OWN STOCK',
    type: 'DIRECT',
    isSelf: true,
    contactPerson: 'Internal Staff',
    phone: phone ? phone.trim() : '',
    email: cleanAdminEmail,
    balance: 0,
    active: true
  });

  // 4. Create Agency Settings
  const settings = await Settings.create({
    agency: agency._id,
    companyName: agency.name,
    tagline: 'Travel & Aviation Agency Management ERP',
    email: agency.email,
    phone: agency.phone || '',
    address: agency.address || 'Dhaka, Bangladesh',
    currency: currency.toUpperCase()
  });

  // 5. Seed Standard Expense Categories
  const standardCategories = [
    'Office Rent',
    'Utilities (Electricity / Water / Internet)',
    'Staff Salaries & Allowances',
    'Software & Subscriptions',
    'Office Supplies & Stationery',
    'Entertainment & Hospitality',
    'Bank & Merchant Charges',
    'Miscellaneous'
  ];

  await ExpenseCategory.insertMany(
    standardCategories.map(catName => ({
      agency: agency._id,
      name: catName,
      description: `Default category: ${catName}`
    }))
  );

  // 6. Write Audit Log
  await writeAuditLog({
    agency: agency._id,
    entityType: 'Agency',
    entityId: agency._id,
    action: 'CREATE',
    performedBy: adminUser._id,
    details: `Provisioned new agency workspace: ${agency.name} (${agency.slug})`
  });

  return { agency, adminUser, settings };
}
