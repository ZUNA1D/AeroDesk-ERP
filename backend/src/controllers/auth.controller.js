import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Agency } from '../models/Agency.js';
import { provisionAgency } from '../services/agency.service.js';
import { env } from '../config/env.js';

function generateToken(user) {
  const agencyId = user.agency?._id || user.agency;
  return jwt.sign(
    {
      id: user._id,
      agencyId: agencyId ? agencyId.toString() : null,
      role: user.role,
      email: user.email,
      name: user.name
    },
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
 * Check if initial setup is needed (i.e. zero agencies registered)
 */
export async function getSetupStatus(req, res, next) {
  try {
    const agencyCount = await Agency.countDocuments();
    res.json({ setupRequired: agencyCount === 0 });
  } catch (err) {
    next(err);
  }
}

/**
 * Register a new Agency workspace (Self-service SaaS onboarding)
 */
export async function registerAgency(req, res, next) {
  try {
    const {
      agencyName,
      name,
      email,
      password,
      phone,
      address,
      currency = 'BDT'
    } = req.body;

    if (!agencyName || !agencyName.trim()) {
      return res.status(400).json({ message: 'Agency name is required.' });
    }
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Administrator name, email, and password are required.' });
    }

    const { agency, adminUser } = await provisionAgency({
      name: agencyName,
      adminName: name,
      adminEmail: email,
      adminPassword: password,
      phone,
      address,
      currency
    });

    const token = generateToken(adminUser);
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Agency workspace registered and initialized successfully.',
      agency: {
        id: agency._id,
        name: agency.name,
        slug: agency.slug,
        status: agency.status
      },
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Initial one-time admin setup (creates first agency)
 */
export async function setupInitialAdmin(req, res, next) {
  try {
    const agencyCount = await Agency.countDocuments();
    if (agencyCount > 0) {
      return res.status(403).json({ message: 'System is already initialized. Please register or log in.' });
    }

    const { name, email, password, companyName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const { agency, adminUser } = await provisionAgency({
      name: companyName?.trim() || 'AeroDesk Agency',
      adminName: name,
      adminEmail: email,
      adminPassword: password
    });

    const token = generateToken(adminUser);
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'System successfully initialized.',
      agency: {
        id: agency._id,
        name: agency.name,
        slug: agency.slug
      },
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
}

/**
 * User login (multi-tenant aware)
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).populate('agency');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Your account is deactivated. Please contact your agency administrator.' });
    }

    if (user.role !== 'SUPER_ADMIN') {
      if (!user.agency) {
        return res.status(403).json({ message: 'Account is not associated with any active agency workspace.' });
      }
      if (user.agency.status === 'SUSPENDED') {
        return res.status(403).json({ message: 'Your agency workspace is currently suspended. Please contact platform support.' });
      }
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
        role: user.role,
        agencyId: user.agency?._id || null
      },
      agency: user.agency ? {
        id: user.agency._id,
        name: user.agency.name,
        slug: user.agency.slug,
        status: user.agency.status,
        subscriptionPlan: user.agency.subscriptionPlan
      } : null,
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
 * Get current user profile & agency workspace
 */
export async function getMe(req, res) {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      active: req.user.active,
      createdAt: req.user.createdAt,
      agency: req.user.agency ? {
        id: req.user.agency._id,
        name: req.user.agency.name,
        slug: req.user.agency.slug,
        phone: req.user.agency.phone,
        email: req.user.agency.email,
        address: req.user.agency.address,
        status: req.user.agency.status,
        subscriptionPlan: req.user.agency.subscriptionPlan
      } : null
    }
  });
}

