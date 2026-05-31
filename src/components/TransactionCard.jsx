import { ArrowUpRight, ArrowDownLeft, Banknote, Building2, PlusCircle, ShoppingCart, Smartphone, Receipt, PiggyBank, CreditCard } from 'lucide-react';

const typeConfig = {
  send_money:    { icon: ArrowUpRight,   bg: 'bg-red-50',     color: 'text-red-500',    label: 'Sent' },
  request_money: { icon: ArrowDownLeft,  bg: 'bg-blue-50',    color: 'text-blue-500',   label: 'Requested' },
  cash_in:       { icon: Banknote,       bg: 'bg-green-50',   color: 'text-green-600',  label: 'Cash In' },
  cash_out:      { icon: Building2,      bg: 'bg-orange-50',  color: 'text-orange-500', label: 'Cash Out' },
  add_money:     { icon: PlusCircle,     bg: 'bg-green-50',   color: 'text-green-600',  label: 'Add Money' },
  payment:       { icon: ShoppingCart,   bg: 'bg-purple-50',  color: 'text-purple-600', label: 'Payment' },
  recharge:      { icon: Smartphone,     bg: 'bg-blue-50',    color: 'text-blue-600',   label: 'Recharge' },
  bill_pay:      { icon: Receipt,        bg: 'bg-yellow-50',  color: 'text-yellow-600', label: 'Bill Pay' },
  savings:       { icon: PiggyBank,      bg: 'bg-teal-50',    color: 'text-teal-600',   label: 'Savings' },
  loan:          { icon: CreditCard,     bg: 'bg-red-50',     color: 'text-red-600',    label: 'Loan' },
};

export default function TransactionCard({ tx, userId }) {
  const cfg = typeConfig[tx.type] || { icon: Banknote, bg: 'bg-gray-50', color: 'text-gray-600', label: tx.type };
  const Icon = cfg.icon;
  const isCredit = tx.receiverId?._id === userId || tx.receiverId === userId;
  const amount = isCredit ? `+৳${tx.amount}` : `-৳${tx.amount}`;
  const amtColor = isCredit ? 'text-green-600' : 'text-red-500';
  const other = isCredit ? tx.senderId?.name : tx.receiverId?.name;
  const date = new Date(tx.createdAt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
      <div className={`w-11 h-11 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={cfg.color} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{cfg.label}{other ? ` — ${other}` : ''}</p>
        <p className="text-xs text-gray-400">{tx.ref} · {date}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`font-bold text-sm ${amtColor}`}>{amount}</p>
        {tx.fee > 0 && <p className="text-xs text-gray-400">Fee ৳{tx.fee}</p>}
      </div>
    </div>
  );
}
