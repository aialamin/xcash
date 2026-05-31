import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PinPad from '../components/PinPad';
import api from '../services/api';
import { Phone, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function SendMoney() {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ phone: '', amount: '', note: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const nav = useNavigate();

  const handlePin = async (pin) => {
    try {
      const { data } = await api.post('/transfer/send', { ...form, amount: Number(form.amount) });
      setSuccess(data.transaction);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
      setStep('form');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <PageHeader title="Send Money" />
      <div className="p-4 flex flex-col gap-4">
        {step === 'form' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              {[
                { key: 'phone',  icon: Phone,      placeholder: 'Receiver phone (01XXXXXXXXX)', type: 'tel' },
                { key: 'amount', icon: DollarSign, placeholder: 'Amount (৳)',                   type: 'number' },
                { key: 'note',   icon: FileText,   placeholder: 'Note (optional)',               type: 'text' },
              ].map(({ key, icon: Icon, placeholder, type }) => (
                <div key={key} className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                  <Icon size={16} className="text-gray-400 shrink-0" />
                  <input type={type} placeholder={placeholder} value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="py-3 flex-1 focus:outline-none" />
                </div>
              ))}
            </div>
            {form.amount > 100 && <p className="text-xs text-gray-500 text-center bg-yellow-50 rounded-xl py-2">Service fee: ৳5 for amounts over ৳100</p>}
            {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} /> {error}</div>}
            <button onClick={() => { if (form.phone && form.amount) { setStep('pin'); setError(''); } }}
              className="bg-violet-600 text-white rounded-2xl py-3 font-bold text-lg active:bg-violet-700">
              Proceed
            </button>
          </>
        )}
        {step === 'pin' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-violet-700">৳{form.amount}</p>
              <p className="text-gray-500 text-sm mt-1">to {form.phone}</p>
            </div>
            <PinPad onComplete={handlePin} label="Enter PIN to confirm" />
          </div>
        )}
        {step === 'done' && success && (
          <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-green-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Sent Successfully!</h2>
            <p className="text-gray-500">৳{success.amount} sent to {form.phone}</p>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2">Ref: {success.ref}</p>
            <button onClick={() => nav('/')} className="bg-violet-600 text-white rounded-2xl py-3 px-8 font-bold active:bg-violet-700 w-full">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}
