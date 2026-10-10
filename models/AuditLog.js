import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['ELECTION_CREATED', 'ELECTION_UPDATED', 'ELECTION_PUBLISHED', 'VOTE_CAST', 'USER_REGISTERED', 'USER_LOGIN', 'RESULT_PUBLISHED']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election'
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: { expires: 2592000 } // Auto-delete after 30 days
  }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
