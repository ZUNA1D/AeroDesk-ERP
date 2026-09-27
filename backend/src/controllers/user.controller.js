import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { writeAuditLog } from '../services/audit.service.js';

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, password, role = 'STAFF', active = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      active
    });

    await writeAuditLog({
      entityType: 'User',
      entityId: user._id,
      action: 'CREATE',
      performedBy: req.user._id,
      details: `Created new user ${user.name} (${user.email}) with role ${user.role}`
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role, active, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const before = user.toObject();

    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (role) user.role = role;
    if (active !== undefined) user.active = active;
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    await user.save();

    await writeAuditLog({
      entityType: 'User',
      entityId: user._id,
      action: 'UPDATE',
      performedBy: req.user._id,
      details: `Updated user profile for ${user.email}`,
      before,
      after: user
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    user.active = !user.active;
    await user.save();

    await writeAuditLog({
      entityType: 'User',
      entityId: user._id,
      action: 'UPDATE',
      performedBy: req.user._id,
      details: `${user.active ? 'Activated' : 'Deactivated'} user account ${user.email}`
    });

    res.json({ message: `User account ${user.active ? 'activated' : 'deactivated'}.`, user });
  } catch (err) {
    next(err);
  }
}
