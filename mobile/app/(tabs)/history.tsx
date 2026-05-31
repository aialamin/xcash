import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import TransactionCard from '../../components/TransactionCard';
import api from '../../services/api';
import { ClipboardList, AlertTriangle } from 'lucide-react-native';

const filters = ['All', 'send_money', 'cash_out', 'add_money', 'payment', 'recharge', 'bill_pay'];
const labels: Record<string, string> = { All: 'All', send_money: 'Sent', cash_out: 'Cash Out', add_money: 'Add Money', payment: 'Payment', recharge: 'Recharge', bill_pay: 'Bills' };

export default function History() {
  const [txs, setTxs]         = useState<any[]>([]);
  const [filter, setFilter]   = useState('All');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/transfer/history').then(r => { setTxs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? txs : txs.filter(t => t.type === filter);

  const disputeTx = (tx: any) => {
    if (tx.disputed) { Alert.alert('Already Disputed', 'This transaction has already been flagged.'); return; }
    Alert.alert(
      '🚩 Dispute Transaction',
      `Ref: ${tx.ref}\nAmount: ৳${tx.amount}\n\nFiling a dispute will notify our team and freeze this transaction for review. We respond within 24 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'File Dispute', style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/transactions/${tx.id}/dispute`, { reason: 'User reported' });
              setTxs(prev => prev.map(t => t.id === tx.id ? { ...t, disputed: true } : t));
              Alert.alert('✅ Dispute Filed', 'Our team will review and respond within 24 hours.');
            } catch (err: any) { Alert.alert('Error', err.message); }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-violet-50">
      <View className="px-4 pt-14 pb-3 bg-white border-b border-violet-50">
        <Text className="text-xl font-bold text-gray-800">Transactions</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3 max-h-14" contentContainerClassName="gap-2">
        {filters.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} className="px-3 py-1.5 rounded-full border"
            style={{ backgroundColor: filter === f ? '#7C3AED' : '#fff', borderColor: filter === f ? '#7C3AED' : '#E5E7EB' }}>
            <Text className="text-xs font-semibold" style={{ color: filter === f ? '#fff' : '#6B7280' }}>{labels[f]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView className="flex-1 px-4 pt-2 pb-20" showsVerticalScrollIndicator={false}>
        {loading
          ? <ActivityIndicator color="#7C3AED" size="large" className="mt-12" />
          : filtered.length === 0
            ? <View className="items-center py-16 gap-3"><ClipboardList size={40} color="#D1D5DB" strokeWidth={1.2} /><Text className="text-gray-400 text-sm">No transactions</Text></View>
            : filtered.map(tx => (
                <View key={tx.id}>
                  <TransactionCard tx={tx} userId={user?.id} />
                  {/* Dispute button — bKash has NO in-app dispute */}
                  <TouchableOpacity
                    onPress={() => disputeTx(tx)}
                    className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl mb-3 self-end -mt-2 ${tx.disputed ? 'bg-red-50' : 'bg-gray-50'}`}
                  >
                    <AlertTriangle size={12} color={tx.disputed ? '#EF4444' : '#9CA3AF'} />
                    <Text className={`text-xs font-medium ${tx.disputed ? 'text-red-500' : 'text-gray-400'}`}>
                      {tx.disputed ? 'Disputed' : 'Dispute'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
        }
      </ScrollView>
    </View>
  );
}
