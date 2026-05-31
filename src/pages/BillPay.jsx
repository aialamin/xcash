import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import { Zap, Flame, Droplets, Wifi, Tv, GraduationCap, CreditCard, ReceiptText, Hash, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const categories = [
  { id: 'electricity', icon: Zap,         label: 'Electricity', bg: 'bg-yellow-50', color: 'text-yellow-600' },
  { id: 'gas',         icon: Flame,        label: 'Gas',         bg: 'bg-orange-50', color: 'text-orange-500' },
  { id: 'water',       icon: Droplets,     label: 'Water',       bg: 'bg-blue-50',   color: 'text-blue-500' },
  { id: 'internet',    icon: Wifi,         label: 'Internet',    bg: 'bg-sky-50',    color: 'text-sky-600' },
  { id: 'tv',          icon: Tv,           label: 'Cable TV',    bg: 'bg-purple-50', color: 'text-purple-600' },
  { id: 'education',   icon: GraduationCap,label: 'Education',   bg: 'bg-teal-50',   color: 'text-teal-600' },
  { id: 'loan_emi',    icon: CreditCard,   label: 'Loan EMI',    bg: 'bg-red-50',    color: 'text-red-500' },
  { id: 'other',       icon: ReceiptText,  label: 'Other',       bg: 'bg-gray-50',   color: 'text-gray-600' },
];

export default function BillPay() {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ accountNo: '', amount: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { fetchWallet } = useWallet();
  const nav = useNavigate();

  const cat = categories.find(c => c.id === selected);

  const submit = async () => {
    try {
      await api.post('/bills/pay', { category: selected, ...form, amount: Number(form.amount) });
      await fetchWallet();
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <PageHeader title="Bill Pay" />
      <div className="p-4 flex flex-col gap-4">
        {!done ? (
          <>
            {!selected ? (
              <div className="grid grid-cols-2 gap-3">
                {categories.map(({ id, icon: Icon, label, bg, color }) => (
                  <button key={id} onClick={() => setSelected(id)}
                    className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                      <Icon size={22} className={color} strokeWidth={1.8} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-violet-600 text-sm self-start">
                  ← Change category
                </button>
                {cat && (
                  <div className={`${cat.bg} rounded-2xl p-3 flex items-center gap-3`}>
                    <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center`}>
                      <cat.icon size={20} className={cat.color} strokeWidth={1.8} />
                    </div>
                    <span className="font-semibold text-gray-800">{cat.label}</span>
                  </div>
                )}
                <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                    <Hash size={16} className="text-gray-400 shrink-0" />
                    <input type="text" placeholder="Account / Bill number" value={form.accountNo}
                      onChange={e => setForm({ ...form, accountNo: e.target.value })} className="py-3 flex-1 focus:outline-none" />
                  </div>
                  <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                    <span className="text-gray-500 font-bold">৳</span>
                    <input type="number" placeholder="Amount" value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })} className="py-3 flex-1 focus:outline-none" />
                  </div>
                </div>
                {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} /> {error}</div>}
                <button onClick={submit} className="bg-violet-600 text-white rounded-2xl py-3 font-bold text-lg active:bg-violet-700">Pay Bill</button>
              </>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-green-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Bill Paid!</h2>
            <p className="text-gray-500">৳{form.amount} for {cat?.label}</p>
            <button onClick={() => nav('/')} className="bg-violet-600 text-white rounded-2xl py-3 px-8 font-bold active:bg-violet-700 w-full">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}
