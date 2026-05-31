import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  nid: { type: String },
  pin: { type: String, required: true },
  role: { type: String, enum: ['user', 'agent', 'merchant', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
  kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  avatar: { type: String },
  deviceId: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('pin')) return;
  this.pin = await bcrypt.hash(this.pin, 10);
});

userSchema.methods.matchPin = function (pin) {
  return bcrypt.compare(pin, this.pin);
};

export default mongoose.model('User', userSchema);
