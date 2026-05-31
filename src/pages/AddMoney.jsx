import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import { Landmark, CreditCard, Users, CheckCircle, AlertCircle, Check } from 'lucide-react';

const sources = [
  { id: 'bank',  icon: Landmark,    label: 'Bank Transfer' },
  { id: 'card',  icon: CreditCard,  label: 'Debit/Credit Card' },
  { id: 'agent', icon: Users,       label: 'Agent (Cash In)' },
];

export default function AddMoney() {
  const [source, setSource] = useState('bank');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { fetchWallet } = useWallet();
  const nav = useNavigate();

  const submit = async () => {
    try {
      await api.post('/wallet/add-money', { amount: Number(amount), source });
      await fetchWallet();
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <PageHeader title="Add Money" />
      <div className="p-4 flex flex-col gap-4">
        {!done ? (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-600">Select source</p>
              {sources.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setSource(id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${source === id ? 'border-violet-500 bg-violet-50' : 'border-gray-100'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${source === id ? 'bg-violet-100' : 'bg-gray-100'}`}>
                    <Icon size={18} className={source === id ? 'text-violet-600' : 'text-gray-500'} strokeWidth={1.8} />
                  </div>
                  <span className={`font-medium flex-1 text-left ${source === id ? 'text-violet-700' : 'text-gray-700'}`}>{label}</span>
                  {source === id && <Check size={16} className="text-violet-600" />}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                <span className="text-gray-500 font-bold text-lg">৳</span>
                <input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)}
                  className="py-3 flex-1 focus:outline-none text-lg" />
              </div>
            </div>
            {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} /> {error}</div>}
            <button onClick={submit} className="bg-violet-600 text-white rounded-2xl py-3 font-bold text-lg active:bg-violet-700">Add Money</button>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-green-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Money Added!</h2>
            <p className="text-gray-500">৳{amount} added to your wallet</p>
            <button onClick={() => nav('/')} className="bg-violet-600 text-white rounded-2xl py-3 px-8 font-bold active:bg-violet-700 w-full">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}
