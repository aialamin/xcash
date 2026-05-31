import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Splash() {
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => nav(user ? '/' : '/login'), 2000);
    return () => clearTimeout(t);
  }, [user, nav]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-violet-700 to-violet-900">
      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
        <span className="text-6xl font-black text-violet-700">X</span>
      </div>
      <h1 className="text-4xl font-extrabold text-white tracking-widest">XCash</h1>
      <p className="text-violet-200 mt-2 text-sm">Your Digital Wallet</p>
      <div className="mt-12 w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
