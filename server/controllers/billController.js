import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';

export const payBill = async (req, res) => {
  try {
    const { category, accountNo, amount } = req.body;
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    await Wallet.findOneAndUpdate({ userId: req.user._id }, { $inc: { balance: -amount } });
    const tx = await Transaction.create({
      senderId: req.user._id,
      type: 'bill_pay',
      amount,
      metadata: { category, accountNo },
    });
    await Notification.create({ userId: req.user._id, title: 'Bill Paid', body: `৳${amount} paid for ${category} (${accountNo})` });
    res.json({ transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
