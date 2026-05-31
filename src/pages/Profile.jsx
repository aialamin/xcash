import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { Users, Bell, Landmark, Shield, HelpCircle, FileText, ChevronRight, PlusCircle, LogOut } from 'lucide-react';

const menuItems = [
  { icon: Users,      label: 'Beneficiaries',     to: '/beneficiaries',   bg: 'bg-blue-50',   color: 'text-blue-600' },
  { icon: Bell,       label: 'Notifications',      to: '/notifications',   bg: 'bg-violet-50', color: 'text-violet-600' },
  { icon: Landmark,   label: 'Financial Services', to: '/financial',       bg: 'bg-teal-50',   color: 'text-teal-600' },
  { icon: Shield,     label: 'Security',           to: '#',                bg: 'bg-green-50',  color: 'text-green-600' },
  { icon: HelpCircle, label: 'Help & Support',     to: '#',                bg: 'bg-orange-50', color: 'text-orange-500' },
  { icon: FileText,   label: 'Terms & Privacy',    to: '#',                bg: 'bg-gray-50',   color: 'text-gray-500' },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const { wallet } = useWallet();
  const nav = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <div className="p-4 bg-white border-b border-violet-50 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-800">My Profile</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{user?.name}</h2>
            <p className="text-violet-200 text-sm">{user?.phone}</p>
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full mt-1 inline-block capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Wallet Balance</p>
            <p className="text-2xl font-extrabold text-violet-700">৳{wallet?.balance?.toFixed(2) ?? '0.00'}</p>
          </div>
          <button onClick={() => nav('/add-money')}
            className="flex items-center gap-1.5 bg-violet-600 text-white rounded-xl px-4 py-2 text-sm font-semibold active:bg-violet-700">
            <PlusCircle size={15} /> Add Money
          </button>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {menuItems.map(({ to, icon: Icon, label, bg, color }, i) => (
            <button key={i} onClick={() => to !== '#' && nav(to)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 active:bg-violet-50 text-left">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={color} strokeWidth={1.8} />
              </div>
              <span className="text-gray-700 font-medium text-sm flex-1">{label}</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button onClick={() => { logout(); nav('/login'); }}
          className="flex items-center justify-center gap-2 bg-red-50 text-red-500 rounded-2xl py-3 font-bold active:bg-red-100">
          <LogOut size={18} /> Logout
        </button>
        <p className="text-center text-xs text-gray-400">XCash v1.0.0 · Made with ♥</p>
      </div>
    </div>
  );
}
