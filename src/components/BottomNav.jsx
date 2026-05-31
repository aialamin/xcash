import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, Gift, Bell, User } from 'lucide-react';

const tabs = [
  { to: '/',              icon: Home,          label: 'Home' },
  { to: '/history',       icon: ClipboardList, label: 'History' },
  { to: '/rewards',       icon: Gift,          label: 'Rewards' },
  { to: '/notifications', icon: Bell,          label: 'Alerts' },
  { to: '/profile',       icon: User,          label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-violet-100 flex z-50">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${isActive ? 'text-violet-600' : 'text-gray-400'}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
