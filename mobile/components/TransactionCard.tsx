import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ArrowUpRight, ArrowDownLeft, Banknote, Building2, PlusCircle, ShoppingCart, Smartphone, Receipt, PiggyBank, CreditCard, Copy, Check } from 'lucide-react-native';

const typeConfig: Record<string, { Icon: any; bg: string; color: string; label: string }> = {
  send_money:    { Icon: ArrowUpRight,  bg: '#FEF2F2', color: '#EF4444', label: 'Sent'        },
  request_money: { Icon: ArrowDownLeft, bg: '#EFF6FF', color: '#3B82F6', label: 'Requested'   },
  cash_in:       { Icon: Banknote,      bg: '#F0FDF4', color: '#16A34A', label: 'Cash In'     },
  cash_out:      { Icon: Building2,     bg: '#FFF7ED', color: '#F97316', label: 'Cash Out'    },
  add_money:     { Icon: PlusCircle,    bg: '#F0FDF4', color: '#16A34A', label: 'Add Money'   },
  payment:       { Icon: ShoppingCart,  bg: '#F0FDF4', color: '#166534', label: 'Payment'     },
  recharge:      { Icon: Smartphone,    bg: '#EFF6FF', color: '#2563EB', label: 'Recharge'    },
  bill_pay:      { Icon: Receipt,       bg: '#FEFCE8', color: '#CA8A04', label: 'Bill Pay'    },
  savings:       { Icon: PiggyBank,     bg: '#F0FDFA', color: '#0D9488', label: 'Savings'     },
  loan:          { Icon: CreditCard,    bg: '#FEF2F2', color: '#DC2626', label: 'Loan'        },
};

export default function TransactionCard({ tx, userId }: { tx: any; userId?: string }) {
  const [copied, setCopied] = useState(false);
  const cfg = typeConfig[tx.type] || { Icon: Banknote, bg: '#F9FAFB', color: '#6B7280', label: tx.type };
  const { Icon } = cfg;
  const isCredit = tx.receiver_id === userId;
  const amount   = isCredit ? `+৳${tx.amount}` : `-৳${tx.amount}`;
  const other    = isCredit ? tx.sender?.name : tx.receiver?.name;
  const date     = new Date(tx.created_at).toLocaleDateString('en-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const copyRef = async () => {
    await Clipboard.setStringAsync(tx.ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={s.card}>
      {/* Icon */}
      <View style={[s.iconWrap, { backgroundColor: cfg.bg }]}>
        <Icon size={20} color={cfg.color} strokeWidth={1.8} />
      </View>

      {/* Main info */}
      <View style={s.info}>
        <Text style={s.label} numberOfLines={1}>
          {cfg.label}{other ? ` — ${other}` : ''}
        </Text>
        <Text style={s.date}>{date}</Text>

        {/* Transaction code — tappable to copy */}
        <TouchableOpacity onPress={copyRef} style={[s.refRow, copied && s.refRowCopied]} activeOpacity={0.7}>
          {copied
            ? <Check size={14} color="#16A34A" />
            : <Copy size={14} color="#166534" />
          }
          <Text style={[s.refCode, copied && s.refCodeCopied]} numberOfLines={1}>{tx.ref}</Text>
          <Text style={[s.copyHint, copied && { color: '#16A34A' }]}>{copied ? 'Copied!' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <View style={s.amountCol}>
        <Text style={[s.amount, { color: isCredit ? '#16A34A' : '#EF4444' }]}>{amount}</Text>
        {tx.fee > 0 && <Text style={s.fee}>Fee ৳{tx.fee}</Text>}
        {tx.status === 'pending' && <Text style={s.pending}>Pending</Text>}
        {tx.disputed && <Text style={s.disputed}>Disputed</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  info: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontWeight: '700', color: '#111827' },
  date: { fontSize: 11, color: '#9CA3AF' },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 4, borderWidth: 1.5, borderColor: '#DCFCE7' },
  refRowCopied: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  refCode: { fontSize: 12, color: '#166534', fontFamily: 'monospace', fontWeight: '700', maxWidth: 120 },
  refCodeCopied: { color: '#14532D' },
  copyHint: { fontSize: 11, color: '#166534', fontWeight: '700' },
  amountCol: { alignItems: 'flex-end', gap: 3, minWidth: 70 },
  amount: { fontSize: 15, fontWeight: '800' },
  fee: { fontSize: 11, color: '#F59E0B' },
  pending: { fontSize: 10, color: '#F59E0B', fontWeight: '700' },
  disputed: { fontSize: 10, color: '#EF4444', fontWeight: '700' },
});
