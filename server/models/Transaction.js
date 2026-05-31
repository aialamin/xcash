import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['send_money', 'request_money', 'cash_in', 'cash_out', 'add_money',
      'payment', 'recharge', 'bill_pay', 'loan', 'savings', 'reward'],
    required: true,
  },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
  ref: { type: String, unique: true },
  note: { type: String },
  metadata: { type: Object },
}, { timestamps: true });

transactionSchema.pre('save', function () {
  if (!this.ref) {
    this.ref = 'XC' + Date.now() + Math.floor(Math.random() * 1000);
  }
});

export default mongoose.model('Transaction', transactionSchema);
