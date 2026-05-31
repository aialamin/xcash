import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import TransactionCard from '../../components/TransactionCard';
import api from '../../services/api';
import { Send, Download, PlusCircle, Building2, Smartphone, Receipt, ShoppingCart, Landmark, Eye, EyeOff, Bell, ChevronRight } from 'lucide-react-native';

const actions = [
  { icon: Send,         label: 'Send',     route: '/send',      bg: '#F5F3FF', color: '#7C3AED' },
  { icon: Download,     label: 'Request',  route: '/request',   bg: '#EFF6FF', color: '#2563EB' },
  { icon: PlusCircle,   label: 'Add',      route: '/add-money', bg: '#F0FDF4', color: '#16A34A' },
  { icon: Building2,    label: 'Cash Out', route: '/cash-out',  bg: '#FFF7ED', color: '#F97316' },
  { icon: Smartphone,   label: 'Recharge', route: '/recharge',  bg: '#EFF6FF', color: '#0284C7' },
  { icon: Receipt,      label: 'Bills',    route: '/bills',     bg: '#FEFCE8', color: '#CA8A04' },
  { icon: ShoppingCart, label: 'Pay',      route: '/payment',   bg: '#FDF2F8', color: '#DB2777' },
  { icon: Landmark,     label: 'Finance',  route: '/financial', bg: '#F0FDFA', color: '#0D9488' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { wallet, fetchWallet } = useWallet();
  const [txs, setTxs] = useState<any[]>([]);
  const [balVisible, setBalVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchWallet();
    api.get('/transfer/history').then(r => setTxs(r.data.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <ScrollView className="flex-1 bg-violet-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-violet-700 px-5 pt-14 pb-8 rounded-b-3xl">
        <View className="flex-row justify-between items-start mb-5">
          <View>
            <Text className="text-violet-200 text-sm">Good day,</Text>
            <Text className="text-white text-xl font-bold">{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
            <Bell size={18} color="white" />
          </TouchableOpacity>
        </View>
        <View className="bg-white/15 rounded-2xl p-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-violet-200 text-xs">Available Balance</Text>
            <TouchableOpacity onPress={() => setBalVisible(v => !v)}>
              {balVisible ? <EyeOff size={14} color="#C4B5FD" /> : <Eye size={14} color="#C4B5FD" />}
            </TouchableOpacity>
          </View>
          <Text className="text-white text-3xl font-extrabold">
            {balVisible ? `৳${wallet?.balance?.toFixed(2) ?? '0.00'}` : '৳ ••••••'}
          </Text>
          <Text className="text-violet-200 text-xs mt-1">{user?.phone}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-4 mt-5">
        <Text className="text-gray-600 text-sm font-semibold mb-3">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-3">
          {actions.map(a => (
            <TouchableOpacity key={a.route} onPress={() => router.push(a.route as any)}
              className="bg-white rounded-2xl py-3 items-center shadow-sm" style={{ width: '22%' }}>
              <View className="w-10 h-10 rounded-xl items-center justify-center mb-1" style={{ backgroundColor: a.bg }}>
                <a.icon size={18} color={a.color} strokeWidth={1.8} />
              </View>
              <Text className="text-xs text-gray-600 font-medium">{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      <View className="px-4 mt-5 pb-24">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-600 text-sm font-semibold">Recent</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')} className="flex-row items-center gap-0.5">
            <Text className="text-violet-600 text-xs font-semibold">See all</Text>
            <ChevronRight size={14} color="#7C3AED" />
          </TouchableOpacity>
        </View>
        {txs.length === 0
          ? <Text className="text-center text-gray-400 py-8 text-sm">No transactions yet</Text>
          : txs.map(tx => <TransactionCard key={tx.id} tx={tx} userId={user?.id} />)
        }
      </View>
    </ScrollView>
  );
}
