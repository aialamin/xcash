import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { Phone, DollarSign, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function RequestMoney() {
  const [form, setForm] = useState({ phone: '', amount: '', note: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    try {
      await api.post('/transfer/request', { ...form, amount: Number(form.amount) });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <PageHeader title="Request Money" />
      <div className="p-4 flex flex-col gap-4">
        {!done ? (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              {[
                { key: 'phone',  icon: Phone,      placeholder: 'From phone (01XXXXXXXXX)', type: 'tel' },
                { key: 'amount', icon: DollarSign, placeholder: 'Amount (৳)',               type: 'number' },
                { key: 'note',   icon: FileText,   placeholder: 'Note (optional)',           type: 'text' },
              ].map(({ key, icon: Icon, placeholder, type }) => (
                <div key={key} className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                  <Icon size={16} className="text-gray-400 shrink-0" />
                  <input type={type} placeholder={placeholder} value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })} className="py-3 flex-1 focus:outline-none" />
                </div>
              ))}
            </div>
            {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} /> {error}</div>}
            <button onClick={submit}
              className="flex items-center justify-center gap-2 bg-violet-600 text-white rounded-2xl py-3 font-bold text-lg active:bg-violet-700">
              <Send size={18} /> Send Request
            </button>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-blue-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Request Sent!</h2>
            <p className="text-gray-500">৳{form.amount} requested from {form.phone}</p>
            <button onClick={() => nav('/')} className="bg-violet-600 text-white rounded-2xl py-3 px-8 font-bold active:bg-violet-700 w-full">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}
