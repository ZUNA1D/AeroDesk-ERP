import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Transaction', 'Client', 'Supplier', 'Airline', 'Sector', 'Settings', 'User', 'ExpenseCategory', 'Agency']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'VOID', 'DELETE']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: String
  },
  before: {
    type: mongoose.Schema.Types.Mixed
  },
  after: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

auditLogSchema.index({ agency: 1, timestamp: -1 });
auditLogSchema.index({ agency: 1, entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

