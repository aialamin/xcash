import Savings from '../models/Savings.js';
import Loan from '../models/Loan.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';

export const openSavings = async (req, res) => {
  try {
    const { type, targetAmount, monthlyDeposit, dueDate } = req.body;
    const savings = await Savings.create({ userId: req.user._id, type, targetAmount, monthlyDeposit, dueDate });
    res.status(201).json(savings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSavings = async (req, res) => {
  const savings = await Savings.find({ userId: req.user._id });
  res.json(savings);
};

export const depositSavings = async (req, res) => {
  try {
    const { id, amount } = req.body;
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    await Wallet.findOneAndUpdate({ userId: req.user._id }, { $inc: { balance: -amount } });
    const savings = await Savings.findByIdAndUpdate(id, { $inc: { currentAmount: amount } }, { new: true });
    await Transaction.create({ senderId: req.user._id, type: 'savings', amount });
    res.json(savings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const applyLoan = async (req, res) => {
  try {
    const { amount, tenure } = req.body;
    const emiAmount = Math.ceil((amount * 1.12) / tenure);
    const loan = await Loan.create({ userId: req.user._id, amount, tenure, emiAmount });
    await Notification.create({ userId: req.user._id, title: 'Loan Application', body: `Your loan of ৳${amount} is under review.` });
    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLoan = async (req, res) => {
  const loans = await Loan.find({ userId: req.user._id });
  res.json(loans);
};
