import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';

export const merchantPay = async (req, res) => {
  try {
    const { merchantPhone, amount, note } = req.body;
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    await Wallet.findOneAndUpdate({ userId: req.user._id }, { $inc: { balance: -amount } });
    const tx = await Transaction.create({
      senderId: req.user._id,
      type: 'payment',
      amount,
      fee: 0,
      note,
      metadata: { merchantPhone },
    });
    await Notification.create({ userId: req.user._id, title: 'Payment Successful', body: `৳${amount} paid to merchant.` });
    res.json({ transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getReceipt = async (req, res) => {
  const tx = await Transaction.findById(req.params.id)
    .populate('senderId', 'name phone')
    .populate('receiverId', 'name phone');
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  res.json(tx);
};
