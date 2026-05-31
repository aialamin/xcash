import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import { Phone, Wifi, CheckCircle, AlertCircle } from 'lucide-react';

const operators = ['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel'];
const packages = [50, 100, 149, 199, 299, 399, 499];

export default function Recharge() {
  const [form, setForm] = useState({ msisdn: '', operator: 'Grameenphone', type: 'prepaid', amount: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { fetchWallet } = useWallet();
  const nav = useNavigate();

  const submit = async () => {
    try {
      await api.post('/recharge', { ...form, amount: Number(form.amount) });
      await fetchWallet();
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <PageHeader title="Mobile Recharge" />
      <div className="p-4 flex flex-col gap-4">
        {!done ? (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <input type="tel" placeholder="Phone number to recharge" value={form.msisdn}
                  onChange={e => setForm({ ...form, msisdn: e.target.value })} className="py-3 flex-1 focus:outline-none" />
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                <Wifi size={16} className="text-gray-400 shrink-0" />
                <select value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}
                  className="py-3 flex-1 focus:outline-none bg-white">
                  {operators.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                {['prepaid', 'postpaid'].map(t => (
                  <button key={t} onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors capitalize ${form.type === t ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-100 text-gray-500'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-600 mb-3">Quick Amount</p>
              <div className="grid grid-cols-4 gap-2">
                {packages.map(p => (
                  <button key={p} onClick={() => setForm({ ...form, amount: String(p) })}
                    className={`py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${form.amount === String(p) ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-100 text-gray-600'}`}>
                    ৳{p}
                  </button>
                ))}
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500 mt-3">
                <span className="text-gray-500 font-bold">৳</span>
                <input type="number" placeholder="Custom amount" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} className="py-3 flex-1 focus:outline-none" />
              </div>
            </div>

            {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} /> {error}</div>}
            <button onClick={submit} className="bg-violet-600 text-white rounded-2xl py-3 font-bold text-lg active:bg-violet-700">Recharge Now</button>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-green-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Recharge Successful!</h2>
            <p className="text-gray-500">৳{form.amount} to {form.msisdn}</p>
            <button onClick={() => nav('/')} className="bg-violet-600 text-white rounded-2xl py-3 px-8 font-bold active:bg-violet-700 w-full">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}
