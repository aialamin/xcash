import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { PiggyBank, CreditCard, Shield, TrendingUp, CheckCircle, ChevronDown } from 'lucide-react';

export default function Financial() {
  const [tab, setTab] = useState('savings');
  const [savings, setSavings] = useState([]);
  const [loans, setLoans] = useState([]);
  const [form, setForm] = useState({ type: 'general', targetAmount: '', monthlyDeposit: '', loanAmount: '', tenure: '6' });
  const [done, setDone] = useState('');

  useEffect(() => {
    api.get('/financial/savings').then(r => setSavings(r.data)).catch(() => {});
    api.get('/financial/loan').then(r => setLoans(r.data)).catch(() => {});
  }, []);

  const openSavings = async () => {
    try {
      const s = await api.post('/financial/savings', { type: form.type, targetAmount: Number(form.targetAmount), monthlyDeposit: Number(form.monthlyDeposit) });
      setSavings(prev => [...prev, s.data]);
      setDone('savings');
    } catch {}
  };

  const applyLoan = async () => {
    try {
      const l = await api.post('/financial/loan', { amount: Number(form.loanAmount), tenure: Number(form.tenure) });
      setLoans(prev => [...prev, l.data]);
      setDone('loan');
    } catch {}
  };

  const tabs = [
    { id: 'savings',   icon: PiggyBank,  label: 'Savings' },
    { id: 'loan',      icon: CreditCard, label: 'Loan' },
    { id: 'insurance', icon: Shield,     label: 'Insurance' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <PageHeader title="Financial Services" />
      <div className="flex gap-2 p-4">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${tab === id ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-100 text-gray-500 bg-white'}`}>
            <Icon size={15} strokeWidth={1.8} /> {label}
          </button>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-4">
        {tab === 'savings' && (
          <>
            {savings.map(s => (
              <div key={s._id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                      <PiggyBank size={18} className="text-teal-600" strokeWidth={1.8} />
                    </div>
                    <span className="font-semibold text-gray-800 capitalize">{s.type} Savings</span>
                  </div>
                  <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (s.currentAmount / (s.targetAmount || 1)) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>৳{s.currentAmount} saved</span>
                  <span>Target: ৳{s.targetAmount || '—'}</span>
                </div>
              </div>
            ))}
            {done !== 'savings' ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <p className="font-semibold text-gray-700 flex items-center gap-2"><TrendingUp size={16} className="text-violet-600" /> Open New Savings</p>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-violet-500">
                  <option value="general">General Savings</option>
                  <option value="dps">DPS (Monthly)</option>
                  <option value="goal">Goal-based</option>
                </select>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                  <span className="text-gray-500 font-bold">৳</span>
                  <input type="number" placeholder="Target Amount" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} className="py-3 flex-1 focus:outline-none" />
                </div>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                  <span className="text-gray-500 font-bold">৳</span>
                  <input type="number" placeholder="Monthly Deposit" value={form.monthlyDeposit} onChange={e => setForm({ ...form, monthlyDeposit: e.target.value })} className="py-3 flex-1 focus:outline-none" />
                </div>
                <button onClick={openSavings} className="bg-violet-600 text-white rounded-2xl py-3 font-bold active:bg-violet-700">Open Account</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center text-green-600 font-semibold bg-green-50 rounded-2xl py-4">
                <CheckCircle size={18} /> Savings account opened!
              </div>
            )}
          </>
        )}

        {tab === 'loan' && (
          <>
            {loans.map(l => (
              <div key={l._id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-gray-800 text-lg">৳{l.amount}</span>
                  <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${l.status === 'approved' ? 'bg-green-100 text-green-700' : l.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-500'}`}>{l.status}</span>
                </div>
                <p className="text-xs text-gray-500">EMI: ৳{l.emiAmount}/month · {l.tenure} months</p>
              </div>
            ))}
            {done !== 'loan' ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <p className="font-semibold text-gray-700 flex items-center gap-2"><CreditCard size={16} className="text-violet-600" /> Apply for Loan</p>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                  <span className="text-gray-500 font-bold">৳</span>
                  <input type="number" placeholder="Loan Amount" value={form.loanAmount} onChange={e => setForm({ ...form, loanAmount: e.target.value })} className="py-3 flex-1 focus:outline-none" />
                </div>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-violet-500">
                  <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  <select value={form.tenure} onChange={e => setForm({ ...form, tenure: e.target.value })} className="py-3 flex-1 focus:outline-none bg-white">
                    {[3, 6, 12, 18, 24].map(t => <option key={t} value={t}>{t} months</option>)}
                  </select>
                </div>
                {form.loanAmount && <p className="text-xs text-violet-600 text-center bg-violet-50 rounded-xl py-2">Est. EMI: ৳{Math.ceil((Number(form.loanAmount) * 1.12) / Number(form.tenure))}/month (12% p.a.)</p>}
                <button onClick={applyLoan} className="bg-violet-600 text-white rounded-2xl py-3 font-bold active:bg-violet-700">Apply Now</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center text-green-600 font-semibold bg-green-50 rounded-2xl py-4">
                <CheckCircle size={18} /> Application submitted!
              </div>
            )}
          </>
        )}

        {tab === 'insurance' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Shield size={32} className="text-blue-500" strokeWidth={1.5} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Insurance Plans</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Life, health, and accident insurance coming soon via partner providers.</p>
            <button className="bg-violet-50 text-violet-600 rounded-2xl py-3 px-6 font-semibold">Notify Me</button>
          </div>
        )}
      </div>
    </div>
  );
}
