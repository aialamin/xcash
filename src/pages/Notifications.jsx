import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { Bell, CheckCheck } from 'lucide-react';

const typeIcon = {
  send_money: '💸', add_money: '💰', cash_out: '🏧',
  payment: '🛒', recharge: '📱', bill_pay: '🧾', general: '🔔',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
  }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <div className="flex items-center justify-between p-4 bg-white border-b border-violet-50 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-800">Notifications</h1>
        {unread > 0 && (
          <button onClick={markAll} className="flex items-center gap-1.5 text-violet-600 text-sm font-semibold">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <Bell size={40} strokeWidth={1.2} />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : notifications.map(n => (
          <button key={n._id} onClick={() => markRead(n._id)}
            className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm flex gap-3 transition-colors ${!n.isRead ? 'border-l-4 border-violet-500' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-violet-100' : 'bg-gray-100'}`}>
              <Bell size={18} className={!n.isRead ? 'text-violet-600' : 'text-gray-400'} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${!n.isRead ? 'text-gray-800' : 'text-gray-500'}`}>{n.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.body}</p>
              <p className="text-xs text-gray-300 mt-1">{new Date(n.createdAt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
            {!n.isRead && <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
