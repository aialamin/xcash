import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';

export const recharge = async (req, res) => {
  try {
    const { msisdn, operator, type, amount } = req.body;
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    await Wallet.findOneAndUpdate({ userId: req.user._id }, { $inc: { balance: -amount } });
    const tx = await Transaction.create({
      senderId: req.user._id,
      type: 'recharge',
      amount,
      metadata: { msisdn, operator, rechargeType: type },
    });
    await Notification.create({ userId: req.user._id, title: 'Recharge Successful', body: `৳${amount} recharged to ${msisdn}` });
    res.json({ transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
