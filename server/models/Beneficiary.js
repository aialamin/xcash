import mongoose from 'mongoose';

const beneficiarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  nickname: { type: String },
}, { timestamps: true });

export default mongoose.model('Beneficiary', beneficiarySchema);
