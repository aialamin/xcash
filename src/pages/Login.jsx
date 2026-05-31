import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinPad from '../components/PinPad';
import { Phone, ChevronLeft, AlertCircle } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handlePin = async (pin) => {
    setLoading(true);
    try {
      await login(phone, pin);
      nav('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-violet-700 to-violet-900 px-6">
      <div className="flex flex-col items-center pt-16 pb-8">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-4">
          <span className="text-3xl font-black text-violet-700">X</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">XCash</h1>
        <p className="text-violet-200 text-sm">Welcome back</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl flex-1">
        {step === 'phone' ? (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-gray-800">Enter your phone</h2>
            <div className="flex items-center border border-gray-200 rounded-2xl px-4 gap-3 focus-within:border-violet-500 transition-colors">
              <Phone size={18} className="text-gray-400 shrink-0" />
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="py-3 flex-1 focus:outline-none text-lg"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <button
              onClick={() => { if (phone.length >= 11) { setStep('pin'); setError(''); } }}
              className="bg-violet-600 text-white rounded-2xl py-3 font-bold text-lg active:bg-violet-700 disabled:opacity-50"
              disabled={phone.length < 11}
            >
              Continue
            </button>
            <p className="text-center text-sm text-gray-500">
              No account? <Link to="/register" className="text-violet-600 font-semibold">Register</Link>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button onClick={() => { setStep('phone'); setError(''); }} className="self-start flex items-center gap-1 text-violet-600 text-sm">
              <ChevronLeft size={16} /> Back
            </button>
            <p className="text-gray-600 text-sm">Logging in as <span className="font-bold text-gray-800">{phone}</span></p>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2 w-full justify-center">
                <AlertCircle size={15} /> {error}
              </div>
            )}
            {loading
              ? <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mt-8" />
              : <PinPad onComplete={handlePin} label="Enter your 6-digit PIN" />
            }
          </div>
        )}
      </div>
    </div>
  );
}
