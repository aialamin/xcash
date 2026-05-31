import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import TransactionCard from '../components/TransactionCard';
import api from '../services/api';
import {
  Send, Download, PlusCircle, Building2,
  Smartphone, Receipt, ShoppingCart, Landmark,
  Eye, EyeOff, Bell, ChevronRight,
} from 'lucide-react';

const quickActions = [
  { icon: Send,         label: 'Send',     to: '/send',      bg: 'bg-violet-50', color: 'text-violet-600' },
  { icon: Download,     label: 'Request',  to: '/request',   bg: 'bg-blue-50',   color: 'text-blue-600' },
  { icon: PlusCircle,   label: 'Add',      to: '/add-money', bg: 'bg-green-50',  color: 'text-green-600' },
  { icon: Building2,    label: 'Cash Out', to: '/cash-out',  bg: 'bg-orange-50', color: 'text-orange-500' },
  { icon: Smartphone,   label: 'Recharge', to: '/recharge',  bg: 'bg-sky-50',    color: 'text-sky-600' },
  { icon: Receipt,      label: 'Bills',    to: '/bills',     bg: 'bg-yellow-50', color: 'text-yellow-600' },
  { icon: ShoppingCart, label: 'Pay',      to: '/payment',   bg: 'bg-pink-50',   color: 'text-pink-600' },
  { icon: Landmark,     label: 'Finance',  to: '/financial', bg: 'bg-teal-50',   color: 'text-teal-600' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { wallet, fetchWallet } = useWallet();
  const [txs, setTxs] = useState([]);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    fetchWallet();
    api.get('/transfer/history').then(r => setTxs(r.data.slice(0, 5))).catch(() => {});
  }, [fetchWallet]);

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#f5f3ff]">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-700 to-violet-900 px-5 pt-12 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-violet-200 text-sm">Good day,</p>
            <h2 className="text-white text-xl font-bold">{user?.name}</h2>
          </div>
          <button onClick={() => nav('/notifications')} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
            <Bell size={18} className="text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-white/15 backdrop-blur rounded-2xl p-4">
          <div className="flex justify-between items-center mb-1">
            <p className="text-violet-200 text-xs">Available Balance</p>
            <button onClick={() => setBalanceVisible(v => !v)} className="text-violet-200">
              {balanceVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-white text-3xl font-extrabold">
            {balanceVisible ? `৳${wallet?.balance?.toFixed(2) ?? '0.00'}` : '৳ ••••••'}
          </p>
          <p className="text-violet-200 text-xs mt-1">XCash Wallet · {user?.phone}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-5">
        <h3 className="text-gray-600 text-sm font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <button key={a.to} onClick={() => nav(a.to)}
              className="flex flex-col items-center gap-1.5 bg-white rounded-2xl py-3 shadow-sm active:scale-95 transition-transform">
              <div className={`w-10 h-10 ${a.bg} rounded-xl flex items-center justify-center`}>
                <a.icon size={18} className={a.color} strokeWidth={1.8} />
              </div>
              <span className="text-xs text-gray-600 font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 mt-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-gray-600 text-sm font-semibold">Recent Transactions</h3>
          <button onClick={() => nav('/history')} className="text-violet-600 text-xs font-semibold flex items-center gap-0.5">
            See all <ChevronRight size={14} />
          </button>
        </div>
        {txs.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">No transactions yet</div>
        ) : (
          <div className="flex flex-col gap-2">
            {txs.map((tx) => <TransactionCard key={tx._id} tx={tx} userId={user?._id} />)}
          </div>
        )}
      </div>
    </div>
  );
}
