import { useState } from 'react';
import { Delete } from 'lucide-react';

export default function PinPad({ onComplete, label = 'Enter PIN' }) {
  const [pin, setPin] = useState('');

  const press = (val) => {
    if (pin.length >= 6) return;
    const next = pin + val;
    setPin(next);
    if (next.length === 6) {
      setTimeout(() => { onComplete(next); setPin(''); }, 100);
    }
  };

  const del = () => setPin((p) => p.slice(0, -1));

  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-gray-500 text-sm">{label}</p>
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${i < pin.length ? 'bg-violet-600 border-violet-600 scale-110' : 'border-gray-300'}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 w-64">
        {keys.map((k, i) => (
          k === '' ? <div key={i} /> :
          k === 'del' ? (
            <button key={i} onClick={del} className="h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 active:scale-95 transition-transform">
              <Delete size={20} strokeWidth={1.8} />
            </button>
          ) : (
            <button key={i} onClick={() => press(k)} className="h-14 rounded-2xl bg-white shadow-sm text-gray-800 text-xl font-semibold active:bg-violet-50 active:scale-95 transition-transform">
              {k}
            </button>
          )
        ))}
      </div>
    </div>
  );
}
