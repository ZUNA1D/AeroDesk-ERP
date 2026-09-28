import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

/**
 * Middleware to require authentication via httpOnly cookie or Authorization header
 * Resolves agency context and attaches req.user and req.agencyId
 */
export async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash').populate('agency');

    if (!user || !user.active) {
      return res.status(401).json({ message: 'User account is inactive or no longer exists.' });
    }

    // Unless SUPER_ADMIN, user must belong to an active agency
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.agency) {
        return res.status(403).json({ message: 'Access denied. User is not assigned to any agency workspace.' });
      }
      if (user.agency.status === 'SUSPENDED') {
        return res.status(403).json({ message: 'Agency workspace has been suspended. Please contact platform support.' });
      }
    }

    req.user = user;
    req.agencyId = user.agency?._id || user.agency;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
}

/**
 * Middleware to restrict access based on minimum role
 * Role hierarchy: SUPER_ADMIN > ADMIN > MANAGER > STAFF
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const userRole = req.user.role;

    if (userRole === 'SUPER_ADMIN' || allowedRoles.includes(userRole) || userRole === 'ADMIN') {
      return next();
    }

    return res.status(403).json({
      message: `Forbidden. This action requires one of the following roles: ${allowedRoles.join(', ')}.`
    });
  };
}

/**
 * Middleware ensuring request is made within a tenant agency context
 */
export function requireAgency(req, res, next) {
  if (!req.agencyId) {
    return res.status(400).json({ message: 'Agency context is required for this operation.' });
  }
  next();
}

/**
 * Optional authentication: if token is present, resolves user and agency; otherwise proceeds
 */
export async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token && req.query?.token) {
      token = req.query.token;
    }

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash').populate('agency');
      if (user && user.active) {
        req.user = user;
        req.agencyId = user.agency?._id || user.agency;
      }
    }
  } catch (_) {
    // Ignore invalid or expired token in optional auth
  }
  next();
}


