import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Wallet from './models/Wallet.js';
import Transaction from './models/Transaction.js';
import Notification from './models/Notification.js';

dotenv.config();

const accounts = [
  { name: 'Alamin Hossain',  phone: '01711111111', pin: '123456', role: 'user',     balance: 5000  },
  { name: 'Rina Begum',      phone: '01722222222', pin: '123456', role: 'user',     balance: 2500  },
  { name: 'Karim Sheikh',    phone: '01733333333', pin: '123456', role: 'user',     balance: 750   },
  { name: 'Sonia Akter',     phone: '01744444444', pin: '123456', role: 'user',     balance: 12000 },
  { name: 'Agent Rafiq',     phone: '01755555555', pin: '123456', role: 'agent',    balance: 50000 },
  { name: 'Shopno Merchant', phone: '01766666666', pin: '123456', role: 'merchant', balance: 8000  },
  { name: 'Admin XCash',     phone: '01700000000', pin: '123456', role: 'admin',    balance: 99999 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Wallet.deleteMany({});
  await Transaction.deleteMany({});
  await Notification.deleteMany({});
  console.log('Cleared existing data');

  for (const acc of accounts) {
    const user = await User.create({
      name: acc.name,
      phone: acc.phone,
      pin: acc.pin,
      role: acc.role,
      nid: '19' + acc.phone.slice(-9),
      kycStatus: 'verified',
      status: 'active',
    });

    await Wallet.create({ userId: user._id, balance: acc.balance });

    await Notification.create({
      userId: user._id,
      title: 'Welcome to XCash!',
      body: `Hi ${acc.name}, your test account is ready. Balance: ৳${acc.balance}`,
    });

    console.log(`✅ Created: ${acc.name} (${acc.phone}) — ৳${acc.balance}`);
  }

  // Add some sample transactions between user1 and user2
  const user1 = await User.findOne({ phone: '01711111111' });
  const user2 = await User.findOne({ phone: '01722222222' });

  const sampleTxs = [
    { senderId: user1._id, receiverId: user2._id, type: 'send_money',  amount: 500,  fee: 5,  note: 'Lunch money' },
    { senderId: user2._id, receiverId: user1._id, type: 'send_money',  amount: 200,  fee: 0,  note: 'Thanks!' },
    { senderId: user1._id,                        type: 'recharge',    amount: 99,   fee: 0,  metadata: { msisdn: '01711111111', operator: 'Grameenphone' } },
    { senderId: user1._id,                        type: 'bill_pay',    amount: 450,  fee: 0,  metadata: { category: 'electricity', accountNo: 'DPDC-123456' } },
    {                       receiverId: user1._id, type: 'add_money',   amount: 1000, fee: 0,  metadata: { source: 'bank' } },
    { senderId: user1._id,                        type: 'cash_out',    amount: 300,  fee: 6,  metadata: { agentPhone: '01755555555' } },
    { senderId: user1._id,                        type: 'payment',     amount: 150,  fee: 0,  metadata: { merchantPhone: '01766666666' } },
  ];

  for (const tx of sampleTxs) {
    await Transaction.create(tx);
  }
  console.log('✅ Sample transactions created');

  console.log('\n🎉 Seed complete!\n');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
