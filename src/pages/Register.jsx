import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinPad from '../components/PinPad';
import { User, Phone, CreditCard, Mail, ChevronLeft, AlertCircle } from 'lucide-react';

const fields = [
  { key: 'name',  icon: User,       placeholder: 'Full Name',         type: 'text' },
  { key: 'phone', icon: Phone,      placeholder: 'Phone (01XXXXXXXXX)', type: 'tel' },
  { key: 'nid',   icon: CreditCard, placeholder: 'National ID (NID)',  type: 'text' },
  { key: 'email', icon: Mail,       placeholder: 'Email (optional)',   type: 'email' },
];

export default function Register() {
  const [step, setStep] = useState('info');
  const [form, setForm] = useState({ name: '', phone: '', nid: '', email: '' });
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const nav = useNavigate();

  const handleConfirmPin = async (confirmPin) => {
    if (confirmPin !== pin) { setError('PINs do not match. Try again.'); setStep('pin'); return; }
    try {
      await register({ ...form, pin });
      nav('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setStep('info');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-violet-700 to-violet-900 px-6">
      <div className="flex flex-col items-center pt-12 pb-6">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-3">
          <span className="text-2xl font-black text-violet-700">X</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Create Account</h1>
        <div className="flex gap-1.5 mt-3">
          {['info','pin','confirm'].map((s, i) => (
            <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${step === s || (['pin','confirm'].includes(step) && i === 0) || (step === 'confirm' && i === 1) ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl flex-1">
        {step === 'info' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-800">Your details</h2>
            {fields.map(({ key, icon: Icon, placeholder, type }) => (
              <div key={key} className="flex items-center border border-gray-200 rounded-2xl px-4 gap-3 focus-within:border-violet-500 transition-colors">
                <Icon size={16} className="text-gray-400 shrink-0" />
                <input type={type} placeholder={placeholder} value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="py-3 flex-1 focus:outline-none" />
              </div>
            ))}
            {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} /> {error}</div>}
            <button onClick={() => { if (form.name && form.phone) { setStep('pin'); setError(''); } }}
              className="bg-violet-600 text-white rounded-2xl py-3 font-bold text-lg active:bg-violet-700 disabled:opacity-50"
              disabled={!form.name || !form.phone}>
              Continue
            </button>
            <p className="text-center text-sm text-gray-500">
              Have an account? <Link to="/login" className="text-violet-600 font-semibold">Login</Link>
            </p>
          </div>
        )}

        {step === 'pin' && (
          <div className="flex flex-col items-center gap-4">
            <button onClick={() => setStep('info')} className="self-start flex items-center gap-1 text-violet-600 text-sm"><ChevronLeft size={16} /> Back</button>
            <PinPad onComplete={(p) => { setPin(p); setStep('confirm'); }} label="Set a 6-digit PIN" />
          </div>
        )}

        {step === 'confirm' && (
          <div className="flex flex-col items-center gap-4">
            <button onClick={() => setStep('pin')} className="self-start flex items-center gap-1 text-violet-600 text-sm"><ChevronLeft size={16} /> Back</button>
            {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2 text-center"><AlertCircle size={15} /> {error}</div>}
            <PinPad onComplete={handleConfirmPin} label="Confirm your PIN" />
          </div>
        )}
      </div>
    </div>
  );
}
