import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Agency } from '../models/Agency.js';
import { writeAuditLog } from '../services/audit.service.js';

export async function listUsers(req, res, next) {
  try {
    const users = await User.find({ agency: req.agencyId })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
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

    // Check agency user limits
    const [agency, currentCount] = await Promise.all([
      Agency.findById(req.agencyId),
      User.countDocuments({ agency: req.agencyId, active: true })
    ]);

    if (agency && agency.maxUsers && currentCount >= agency.maxUsers) {
      return res.status(403).json({
        message: `Agency seat limit reached (${currentCount}/${agency.maxUsers} users). Please upgrade your subscription plan to add more staff.`
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      agency: req.agencyId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role === 'SUPER_ADMIN' ? 'ADMIN' : role, // Regular agency admins cannot create SUPER_ADMINs
      active
    });

    await writeAuditLog({
      agency: req.agencyId,
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

    const user = await User.findOne({ _id: id, agency: req.agencyId });
    if (!user) {
      return res.status(404).json({ message: 'User not found in this agency.' });
    }

    const before = user.toObject();

    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (role && role !== 'SUPER_ADMIN') user.role = role;
    if (active !== undefined) user.active = active;
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    await user.save();

    await writeAuditLog({
      agency: req.agencyId,
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
    const user = await User.findOne({ _id: id, agency: req.agencyId });
    if (!user) {
      return res.status(404).json({ message: 'User not found in this agency.' });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    user.active = !user.active;
    await user.save();

    await writeAuditLog({
      agency: req.agencyId,
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
