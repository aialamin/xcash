import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const sendMoney = async (req, res) => {
  try {
    const { phone, amount, note } = req.body;
    if (amount < 10) return res.status(400).json({ message: 'Minimum send is ৳10' });

    const receiver = await User.findOne({ phone });
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });
    if (receiver._id.equals(req.user._id)) return res.status(400).json({ message: 'Cannot send to yourself' });

    const fee = amount > 100 ? 5 : 0;
    const total = amount + fee;
    const senderWallet = await Wallet.findOne({ userId: req.user._id });
    if (senderWallet.balance < total) return res.status(400).json({ message: 'Insufficient balance' });

    await Wallet.findOneAndUpdate({ userId: req.user._id }, { $inc: { balance: -total } });
    await Wallet.findOneAndUpdate({ userId: receiver._id }, { $inc: { balance: amount } });

    const tx = await Transaction.create({
      senderId: req.user._id,
      receiverId: receiver._id,
      type: 'send_money',
      amount,
      fee,
      note,
    });

    await Notification.create({ userId: req.user._id, title: 'Money Sent', body: `৳${amount} sent to ${receiver.name}` });
    await Notification.create({ userId: receiver._id, title: 'Money Received', body: `৳${amount} received from ${req.user.name}` });

    res.json({ transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const requestMoney = async (req, res) => {
  try {
    const { phone, amount, note } = req.body;
    const target = await User.findOne({ phone });
    if (!target) return res.status(404).json({ message: 'User not found' });

    await Notification.create({
      userId: target._id,
      title: 'Money Request',
      body: `${req.user.name} requested ৳${amount} from you. Note: ${note || 'N/A'}`,
    });

    const tx = await Transaction.create({
      senderId: target._id,
      receiverId: req.user._id,
      type: 'request_money',
      amount,
      status: 'pending',
      note,
    });

    res.json({ transaction: tx, message: 'Request sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const txs = await Transaction.find({
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('senderId', 'name phone')
      .populate('receiverId', 'name phone');
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
