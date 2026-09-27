import { AuditLog } from '../models/AuditLog.js';

export async function writeAuditLog({
  entityType,
  entityId,
  action,
  performedBy = null,
  details = '',
  before = null,
  after = null,
  session = null
}) {
  try {
    const logData = {
      entityType,
      entityId,
      action,
      performedBy,
      details,
      before: before ? JSON.parse(JSON.stringify(before)) : null,
      after: after ? JSON.parse(JSON.stringify(after)) : null,
      timestamp: new Date()
    };

    if (session) {
      await AuditLog.create([logData], { session });
    } else {
      await AuditLog.create(logData);
    }
  } catch (err) {
    console.error(`[AuditLog] Failed to write audit log: ${err.message}`);
  }
}
