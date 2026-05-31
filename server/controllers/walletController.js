import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';

export const getBalance = async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user._id });
  res.json(wallet);
};

export const addMoney = async (req, res) => {
  try {
    const { amount, source } = req.body;
    if (amount < 10) return res.status(400).json({ message: 'Minimum add amount is ৳10' });

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { balance: amount } },
      { new: true }
    );
    const tx = await Transaction.create({
      receiverId: req.user._id,
      type: 'add_money',
      amount,
      metadata: { source },
    });
    await Notification.create({
      userId: req.user._id,
      title: 'Money Added',
      body: `৳${amount} added to your wallet from ${source}.`,
    });
    res.json({ wallet, transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const cashOut = async (req, res) => {
  try {
    const { amount, agentPhone } = req.body;
    const fee = Math.ceil(amount * 0.018);
    const total = amount + fee;

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet.balance < total) return res.status(400).json({ message: 'Insufficient balance' });

    await Wallet.findOneAndUpdate({ userId: req.user._id }, { $inc: { balance: -total } });
    const tx = await Transaction.create({
      senderId: req.user._id,
      type: 'cash_out',
      amount,
      fee,
      metadata: { agentPhone },
    });
    await Notification.create({
      userId: req.user._id,
      title: 'Cash Out Successful',
      body: `৳${amount} cash out. Fee: ৳${fee}`,
    });
    res.json({ transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
