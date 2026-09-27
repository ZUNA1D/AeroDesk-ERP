import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Settings } from '../models/Settings.js';
import { Supplier } from '../models/Supplier.js';
import { env } from '../config/env.js';

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

/**
 * Check if initial setup is needed
 */
export async function getSetupStatus(req, res, next) {
  try {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    res.json({ setupRequired: adminCount === 0 });
  } catch (err) {
    next(err);
  }
}

/**
 * Initial one-time admin setup
 */
export async function setupInitialAdmin(req, res, next) {
  try {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    if (adminCount > 0) {
      return res.status(403).json({ message: 'Setup is closed. An administrator already exists.' });
    }

    const { name, email, password, companyName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'ADMIN',
      active: true
    });

    // Seed or update Settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        companyName: companyName?.trim() || 'AeroDesk',
        email: email.trim().toLowerCase()
      });
    } else if (companyName) {
      settings.companyName = companyName.trim();
      await settings.save();
    }

    // Seed the DIRECT / IN-HOUSE supplier if not present
    let directSupplier = await Supplier.findOne({ isSelf: true });
    if (!directSupplier) {
      await Supplier.create({
        name: 'IN-HOUSE / OWN STOCK',
        type: 'DIRECT',
        isSelf: true,
        contactPerson: 'Internal Staff',
        balance: 0,
        active: true
      });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'System successfully initialized.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
}

/**
 * User login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
}

/**
 * User logout
 */
export async function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
}

/**
 * Get current user profile
 */
export async function getMe(req, res) {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      active: req.user.active,
      createdAt: req.user.createdAt
    }
  });
}
