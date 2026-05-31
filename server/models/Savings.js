import mongoose from 'mongoose';

const savingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['general', 'dps', 'goal'], default: 'general' },
  targetAmount: { type: Number },
  currentAmount: { type: Number, default: 0 },
  monthlyDeposit: { type: Number },
  dueDate: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'withdrawn'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('Savings', savingsSchema);
