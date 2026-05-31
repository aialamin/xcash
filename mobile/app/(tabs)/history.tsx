import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import TransactionCard from '../../components/TransactionCard';
import api from '../../services/api';
import { ClipboardList, AlertTriangle, LayoutGrid, ArrowUpRight, ArrowDownLeft, PlusCircle, ShoppingCart, Smartphone, Receipt } from 'lucide-react-native';

const filters = [
  { id: 'All',        label: 'All',       Icon: LayoutGrid,    bg: '#166534', light: '#DCFCE7' },
  { id: 'send_money', label: 'Sent',      Icon: ArrowUpRight,  bg: '#EF4444', light: '#FEE2E2' },
  { id: 'cash_out',   label: 'Cash Out',  Icon: ArrowDownLeft, bg: '#F97316', light: '#FFEDD5' },
  { id: 'add_money',  label: 'Added',     Icon: PlusCircle,    bg: '#0284C7', light: '#DBEAFE' },
  { id: 'payment',    label: 'Payment',   Icon: ShoppingCart,  bg: '#DB2777', light: '#FCE7F3' },
  { id: 'recharge',   label: 'Recharge',  Icon: Smartphone,    bg: '#7C3AED', light: '#EDE9FE' },
  { id: 'bill_pay',   label: 'Bills',     Icon: Receipt,       bg: '#CA8A04', light: '#FEF9C3' },
];

export default function History() {
  const [txs, setTxs]         = useState<any[]>([]);
  const [filter, setFilter]   = useState('All');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/transfer/history').then(r => { setTxs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? txs : txs.filter(t => t.type === filter);
  const active = filters.find(f => f.id === filter)!;

  const disputeTx = (tx: any) => {
    if (tx.disputed) { Alert.alert('Already Disputed', 'This transaction has already been flagged.'); return; }
    Alert.alert('🚩 Dispute Transaction',
      `Ref: ${tx.ref}\nAmount: ৳${tx.amount}\n\nOur team will review within 24 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'File Dispute', style: 'destructive', onPress: async () => {
            try {
              await api.post(`/transactions/${tx.id}/dispute`, { reason: 'User reported' });
              setTxs(prev => prev.map(t => t.id === tx.id ? { ...t, disputed: true } : t));
              Alert.alert('✅ Dispute Filed', 'We will respond within 24 hours.');
            } catch (err: any) { Alert.alert('Error', err.message); }
        }},
      ]
    );
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Transactions</Text>
        <View style={[s.countBadge, { backgroundColor: active.light }]}>
          <Text style={[s.countText, { color: active.bg }]}>{filtered.length}</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={s.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterContent} style={{ alignSelf: 'center' }}>
          {filters.map(({ id, label, Icon, bg, light }) => {
            const on = filter === id;
            return (
              <TouchableOpacity key={id} onPress={() => setFilter(id)}
                style={[s.chip, { backgroundColor: on ? bg : '#fff', borderColor: on ? bg : '#E5E7EB' }]}>
                <View style={[s.chipIcon, { backgroundColor: on ? 'rgba(255,255,255,0.2)' : light }]}>
                  <Icon size={16} color={on ? '#fff' : bg} strokeWidth={2} />
                </View>
                <Text style={[s.chipLabel, { color: on ? '#fff' : '#374151' }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView style={s.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {loading ? (
          <ActivityIndicator color="#166534" size="large" style={{ marginTop: 48 }} />
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <ClipboardList size={44} color="#D1D5DB" strokeWidth={1.2} />
            <Text style={s.emptyText}>No transactions</Text>
          </View>
        ) : filtered.map(tx => (
          <View key={tx.id}>
            <TransactionCard tx={tx} userId={user?.id} />
            <TouchableOpacity onPress={() => disputeTx(tx)}
              style={[s.disputeBtn, tx.disputed && s.disputeBtnActive]}>
              <AlertTriangle size={11} color={tx.disputed ? '#EF4444' : '#9CA3AF'} />
              <Text style={[s.disputeText, tx.disputed && s.disputeTextActive]}>
                {tx.disputed ? 'Disputed' : 'Dispute'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DCFCE7' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countText: { fontSize: 13, fontWeight: '800' },
  filterWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', height: 72, justifyContent: 'center' },
  filterContent: { paddingHorizontal: 14, gap: 10, alignItems: 'center', flexDirection: 'row' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, paddingLeft: 10, paddingRight: 16, borderRadius: 28, borderWidth: 1.5, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  chipIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 13, fontWeight: '700' },
  list: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  empty: { alignItems: 'center', paddingTop: 64, gap: 10 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  disputeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#F9FAFB', marginBottom: 8, marginTop: -4 },
  disputeBtnActive: { backgroundColor: '#FEF2F2' },
  disputeText: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  disputeTextActive: { color: '#EF4444' },
});
