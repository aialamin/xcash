import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  tenure: { type: Number, required: true },
  emiAmount: { type: Number },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'active', 'closed', 'rejected'], default: 'pending' },
  dueDate: { type: Date },
}, { timestamps: true });

export default mongoose.model('Loan', loanSchema);
