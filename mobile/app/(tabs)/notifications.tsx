import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import { Bell, CheckCheck } from 'lucide-react-native';

export default function Notifications() {
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => { api.get('/notifications').then(r => setNotifs(r.data)).catch(() => {}); }, []);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <View className="flex-1 bg-violet-50">
      <View className="px-4 pt-14 pb-3 bg-white border-b border-violet-50 flex-row justify-between items-center">
        <Text className="text-xl font-bold text-gray-800">Notifications</Text>
        {notifs.some(n => !n.is_read) && (
          <TouchableOpacity onPress={markAll} className="flex-row items-center gap-1.5">
            <CheckCheck size={16} color="#7C3AED" /><Text className="text-violet-600 text-sm font-semibold">Mark all</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView className="flex-1 p-4 pb-20" showsVerticalScrollIndicator={false}>
        {notifs.length === 0
          ? <View className="items-center py-16 gap-3"><Bell size={40} color="#D1D5DB" strokeWidth={1.2} /><Text className="text-gray-400 text-sm">No notifications</Text></View>
          : notifs.map(n => (
            <TouchableOpacity key={n.id} onPress={() => markRead(n.id)}
              className={`bg-white rounded-2xl p-4 mb-2 flex-row gap-3 ${!n.is_read ? 'border-l-4 border-violet-500' : ''}`}>
              <View className={`w-10 h-10 rounded-full items-center justify-center ${!n.is_read ? 'bg-violet-100' : 'bg-gray-100'}`}>
                <Bell size={18} color={!n.is_read ? '#7C3AED' : '#9CA3AF'} strokeWidth={1.8} />
              </View>
              <View className="flex-1">
                <Text className={`text-sm font-semibold ${!n.is_read ? 'text-gray-800' : 'text-gray-500'}`}>{n.title}</Text>
                <Text className="text-xs text-gray-400 mt-0.5">{n.body}</Text>
              </View>
              {!n.is_read && <View className="w-2 h-2 bg-violet-500 rounded-full mt-2" />}
            </TouchableOpacity>
          ))
        }
      </ScrollView>
    </View>
  );
}
