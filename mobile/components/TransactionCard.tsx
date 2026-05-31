import { View, Text } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, Banknote, Building2, PlusCircle, ShoppingCart, Smartphone, Receipt, PiggyBank, CreditCard } from 'lucide-react-native';

const typeConfig: Record<string, { Icon: any; bg: string; color: string; label: string; amountColor: string }> = {
  send_money:    { Icon: ArrowUpRight,  bg: '#FEF2F2', color: '#EF4444', label: 'Sent',        amountColor: '#EF4444' },
  request_money: { Icon: ArrowDownLeft, bg: '#EFF6FF', color: '#3B82F6', label: 'Requested',   amountColor: '#3B82F6' },
  cash_in:       { Icon: Banknote,      bg: '#F0FDF4', color: '#16A34A', label: 'Cash In',     amountColor: '#16A34A' },
  cash_out:      { Icon: Building2,     bg: '#FFF7ED', color: '#F97316', label: 'Cash Out',    amountColor: '#EF4444' },
  add_money:     { Icon: PlusCircle,    bg: '#F0FDF4', color: '#16A34A', label: 'Add Money',   amountColor: '#16A34A' },
  payment:       { Icon: ShoppingCart,  bg: '#F5F3FF', color: '#7C3AED', label: 'Payment',     amountColor: '#EF4444' },
  recharge:      { Icon: Smartphone,    bg: '#EFF6FF', color: '#2563EB', label: 'Recharge',    amountColor: '#EF4444' },
  bill_pay:      { Icon: Receipt,       bg: '#FEFCE8', color: '#CA8A04', label: 'Bill Pay',    amountColor: '#EF4444' },
  savings:       { Icon: PiggyBank,     bg: '#F0FDFA', color: '#0D9488', label: 'Savings',     amountColor: '#EF4444' },
  loan:          { Icon: CreditCard,    bg: '#FEF2F2', color: '#DC2626', label: 'Loan',        amountColor: '#16A34A' },
};

export default function TransactionCard({ tx, userId }: { tx: any; userId?: string }) {
  const cfg = typeConfig[tx.type] || { Icon: Banknote, bg: '#F9FAFB', color: '#6B7280', label: tx.type, amountColor: '#6B7280' };
  const { Icon } = cfg;
  const isCredit = tx.receiver_id === userId;
  const amount = isCredit ? `+৳${tx.amount}` : `-৳${tx.amount}`;
  const other = isCredit ? tx.sender?.name : tx.receiver?.name;
  const date = new Date(tx.created_at).toLocaleDateString('en-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <View className="flex-row items-center gap-3 bg-white rounded-2xl p-3 shadow-sm mb-2">
      <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: cfg.bg }}>
        <Icon size={20} color={cfg.color} strokeWidth={1.8} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-800 text-sm" numberOfLines={1}>{cfg.label}{other ? ` — ${other}` : ''}</Text>
        <Text className="text-xs text-gray-400">{tx.ref} · {date}</Text>
      </View>
      <View className="items-end">
        <Text className="font-bold text-sm" style={{ color: isCredit ? '#16A34A' : '#EF4444' }}>{amount}</Text>
        {tx.fee > 0 && <Text className="text-xs text-gray-400">Fee ৳{tx.fee}</Text>}
      </View>
    </View>
  );
}
