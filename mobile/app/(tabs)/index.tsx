import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import TransactionCard from '../../components/TransactionCard';
import QRCard from '../../components/QRCard';
import api from '../../services/api';
import { Send, Download, PlusCircle, Building2, Smartphone, Receipt, ShoppingCart, Landmark, Eye, EyeOff, Bell, ChevronRight, QrCode, X } from 'lucide-react-native';

const actions = [
  { icon: Send,         label: 'Send',     route: '/send',      bg: '#F0FDF4', color: '#166534' },
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
  const [showMyQR, setShowMyQR] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchWallet();
    api.get('/transfer/history').then(r => setTxs(r.data.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <ScrollView className="flex-1 bg-green-50" showsVerticalScrollIndicator={false}>

      {/* My QR Modal */}
      <Modal visible={showMyQR} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-green-50">
          <View className="flex-row items-center justify-between px-5 pt-14 pb-4 bg-white border-b border-green-50">
            <Text className="text-lg font-bold text-gray-800">My QR Code</Text>
            <TouchableOpacity onPress={() => setShowMyQR(false)} className="w-9 h-9 bg-green-50 rounded-full items-center justify-center">
              <X size={18} color="#166534" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center justify-center px-8 gap-6">
            <QRCard phone={user?.phone ?? ''} name={user?.name ?? ''} />
            <Text className="text-gray-500 text-sm text-center px-4">
              Show this QR code to anyone with Pocket — they can scan it to send you money instantly.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View className="bg-green-800 px-5 pt-14 pb-8 rounded-b-3xl">
        <View className="flex-row justify-between items-start mb-5">
          <View>
            <Text className="text-green-200 text-sm">Good day,</Text>
            <Text className="text-white text-xl font-bold">{user?.name}</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setShowMyQR(true)} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
              <QrCode size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/notifications')} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
              <Bell size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="bg-white/15 rounded-2xl p-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-green-200 text-xs">Available Balance</Text>
            <TouchableOpacity onPress={() => setBalVisible(v => !v)}>
              {balVisible ? <EyeOff size={14} color="#86EFAC" /> : <Eye size={14} color="#86EFAC" />}
            </TouchableOpacity>
          </View>
          <Text className="text-white text-3xl font-extrabold">
            {balVisible ? `৳${wallet?.balance?.toFixed(2) ?? '0.00'}` : '৳ ••••••'}
          </Text>
          <Text className="text-green-200 text-xs mt-1">{user?.phone}</Text>
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
            <Text className="text-green-700 text-xs font-semibold">See all</Text>
            <ChevronRight size={14} color="#166534" />
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
