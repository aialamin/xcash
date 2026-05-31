import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Notification from '../models/Notification.js';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

export const register = async (req, res) => {
  try {
    const { name, phone, pin, nid, email } = req.body;
    if (await User.findOne({ phone }))
      return res.status(400).json({ message: 'Phone already registered' });

    const user = await User.create({ name, phone, pin, nid, email });
    await Wallet.create({ userId: user._id, balance: 0 });
    await Notification.create({
      userId: user._id,
      title: 'Welcome to XCash!',
      body: `Hi ${name}, your account is ready.`,
    });

    res.status(201).json({ token: generateToken(user._id), user: { _id: user._id, name, phone, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, pin } = req.body;
    const user = await User.findOne({ phone });
    if (!user || !(await user.matchPin(pin)))
      return res.status(401).json({ message: 'Invalid phone or PIN' });
    if (user.status === 'blocked')
      return res.status(403).json({ message: 'Account blocked' });

    res.json({ token: generateToken(user._id), user: { _id: user._id, name: user.name, phone, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-pin');
  res.json(user);
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true }).select('-pin');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
