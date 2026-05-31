import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import rechargeRoutes from './routes/rechargeRoutes.js';
import billRoutes from './routes/billRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import beneficiaryRoutes from './routes/beneficiaryRoutes.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
