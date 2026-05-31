import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import api from '../../services/api';
import { Users, Bell, Landmark, Shield, HelpCircle, FileText, ChevronRight, PlusCircle, LogOut, TrendingDown } from 'lucide-react-native';

export default function Profile() {
  const { user, logout } = useAuth();
  const { wallet } = useWallet();
  const router = useRouter();
  const [dailySpend, setDailySpend]   = useState<any>(null);
  const [limitInput, setLimitInput]   = useState('');
  const [editLimit, setEditLimit]     = useState(false);
  const [savingLimit, setSavingLimit] = useState(false);

  useEffect(() => {
    api.get('/wallet/daily-spend').then(r => setDailySpend(r.data)).catch(() => {});
  }, []);

  const saveLimit = async () => {
    if (!limitInput || Number(limitInput) <= 0) return;
    setSavingLimit(true);
    try {
      await api.patch('/wallet/daily-limit', { limit: Number(limitInput) });
      const r = await api.get('/wallet/daily-spend');
      setDailySpend(r.data);
      setEditLimit(false);
      Alert.alert('✅ Limit Updated', `Daily spending limit set to ৳${limitInput}`);
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setSavingLimit(false); }
  };

  const menu = [
    { Icon: Users,      label: 'Beneficiaries',      to: null,             bg: '#EFF6FF', color: '#2563EB' },
    { Icon: Bell,       label: 'Notifications',       to: '/notifications', bg: '#F5F3FF', color: '#7C3AED' },
    { Icon: Landmark,   label: 'Financial Services',  to: '/financial',     bg: '#F0FDFA', color: '#0D9488' },
    { Icon: Shield,     label: 'Security Settings',   to: null,             bg: '#F0FDF4', color: '#16A34A' },
    { Icon: HelpCircle, label: 'Help & Support',      to: null,             bg: '#FFF7ED', color: '#F97316' },
    { Icon: FileText,   label: 'Terms & Privacy',     to: null,             bg: '#F9FAFB', color: '#6B7280' },
  ];

  const spentPct = dailySpend ? Math.min(100, (dailySpend.spent_today / dailySpend.daily_limit) * 100) : 0;

  return (
    <ScrollView className="flex-1 bg-violet-50" showsVerticalScrollIndicator={false}>
      <View className="px-4 pt-14 pb-3 bg-white border-b border-violet-50">
        <Text className="text-xl font-bold text-gray-800">My Profile</Text>
      </View>
      <View className="p-4 pb-24 gap-4">

        {/* Profile card */}
        <View className="rounded-2xl p-5 flex-row items-center gap-4" style={{ backgroundColor: '#7C3AED' }}>
          <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="text-3xl font-extrabold text-white">{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">{user?.name}</Text>
            <Text className="text-violet-200 text-sm">{user?.phone}</Text>
            <View className="mt-1 self-start px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text className="text-xs text-white capitalize">{user?.role}</Text>
            </View>
          </View>
        </View>

        {/* Balance */}
        <View className="bg-white rounded-2xl p-4 flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-gray-500 mb-0.5">Wallet Balance</Text>
            <Text className="text-2xl font-extrabold text-violet-700">৳{wallet?.balance?.toFixed(2) ?? '0.00'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/add-money')} className="flex-row items-center gap-1.5 rounded-xl px-4 py-2" style={{ backgroundColor: '#7C3AED' }}>
            <PlusCircle size={15} color="white" />
            <Text className="text-white text-sm font-semibold">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Spending Limit — bKash has NO self-set limit */}
        <View className="bg-white rounded-2xl p-4 gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <TrendingDown size={16} color="#7C3AED" />
              <Text className="font-semibold text-gray-700">Daily Spending Limit</Text>
            </View>
            <TouchableOpacity onPress={() => setEditLimit(!editLimit)}>
              <Text className="text-violet-600 text-sm font-semibold">{editLimit ? 'Cancel' : 'Change'}</Text>
            </TouchableOpacity>
          </View>
          {dailySpend && (
            <>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Spent today</Text>
                <Text className="text-xs font-semibold text-gray-700">৳{dailySpend.spent_today?.toFixed(0)} / ৳{dailySpend.daily_limit?.toFixed(0)}</Text>
              </View>
              <View className="w-full bg-gray-100 rounded-full h-2">
                <View className={`h-2 rounded-full ${spentPct > 80 ? 'bg-red-500' : spentPct > 50 ? 'bg-amber-400' : 'bg-violet-500'}`}
                  style={{ width: `${spentPct}%` }} />
              </View>
              <Text className="text-xs text-gray-400">৳{dailySpend.remaining?.toFixed(0)} remaining today</Text>
            </>
          )}
          {editLimit && (
            <View className="gap-2">
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-2">
                <Text className="text-gray-500 font-bold">৳</Text>
                <TextInput placeholder="New daily limit" value={limitInput} onChangeText={setLimitInput}
                  keyboardType="numeric" className="py-2 flex-1 text-gray-800" placeholderTextColor="#9CA3AF" />
              </View>
              <TouchableOpacity onPress={saveLimit} disabled={savingLimit} className="bg-violet-600 rounded-xl py-2 items-center">
                {savingLimit ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-bold">Save Limit</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu */}
        <View className="bg-white rounded-2xl overflow-hidden">
          {menu.map(({ Icon, label, to, bg, color }, i) => (
            <TouchableOpacity key={i} onPress={() => to && router.push(to as any)}
              className={`flex-row items-center gap-3 px-4 py-3.5 ${i < menu.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={17} color={color} strokeWidth={1.8} />
              </View>
              <Text className="text-gray-700 font-medium text-sm flex-1">{label}</Text>
              <ChevronRight size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={async () => { logout(); router.replace('/(auth)/login'); }}
          className="flex-row items-center justify-center gap-2 bg-red-50 rounded-2xl py-3">
          <LogOut size={18} color="#EF4444" />
          <Text className="text-red-500 font-bold">Logout</Text>
        </TouchableOpacity>
        <Text className="text-center text-xs text-gray-400">XCash Enterprise v1.0 · Secure · Go + React Native</Text>
      </View>
    </ScrollView>
  );
}
