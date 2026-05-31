import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PinPad from '../components/PinPad';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import { Phone, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

export default function CashOut() {
  const [step, setStep] = useState('form');
  const [agentPhone, setAgentPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const { fetchWallet } = useWallet();
  const nav = useNavigate();

  const fee = amount ? Math.ceil(Number(amount) * 0.018) : 0;

  const handlePin = async () => {
    try {
      const { data } = await api.post('/wallet/cash-out', { amount: Number(amount), agentPhone });
      await fetchWallet();
      setSuccess(data.transaction);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
      setStep('form');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <PageHeader title="Cash Out" />
      <div className="p-4 flex flex-col gap-4">
        {step === 'form' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <input type="tel" placeholder="Agent phone number" value={agentPhone}
                  onChange={e => setAgentPhone(e.target.value)} className="py-3 flex-1 focus:outline-none" />
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                <span className="text-gray-500 font-bold">৳</span>
                <input type="number" placeholder="Amount" value={amount}
                  onChange={e => setAmount(e.target.value)} className="py-3 flex-1 focus:outline-none" />
              </div>
              {amount > 0 && (
                <div className="bg-violet-50 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between text-gray-600"><span>Amount</span><span>৳{amount}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Fee (1.8%)</span><span>৳{fee}</span></div>
                  <div className="flex justify-between font-bold text-violet-700 pt-1 border-t border-violet-100"><span>Total Deducted</span><span>৳{Number(amount) + fee}</span></div>
                </div>
              )}
            </div>
            {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} /> {error}</div>}
            <button onClick={() => { if (agentPhone && amount) { setStep('pin'); setError(''); } }}
              className="bg-violet-600 text-white rounded-2xl py-3 font-bold text-lg active:bg-violet-700">Proceed</button>
          </>
        )}
        {step === 'pin' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-violet-700">৳{amount}</p>
              <p className="text-gray-500 text-sm mt-1">Agent: {agentPhone} · Fee ৳{fee}</p>
            </div>
            <PinPad onComplete={handlePin} label="Enter PIN to confirm" />
          </div>
        )}
        {step === 'done' && success && (
          <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-green-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Cash Out Done!</h2>
            <p className="text-gray-500">৳{success.amount} · Fee ৳{success.fee}</p>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2">Ref: {success.ref}</p>
            <button onClick={() => nav('/')} className="bg-violet-600 text-white rounded-2xl py-3 px-8 font-bold active:bg-violet-700 w-full">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}
