import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import TransactionCard from '../components/TransactionCard';
import api from '../services/api';
import { ClipboardList } from 'lucide-react';

const filters = ['All', 'send_money', 'cash_out', 'add_money', 'payment', 'recharge', 'bill_pay'];
const filterLabels = { All: 'All', send_money: 'Sent', cash_out: 'Cash Out', add_money: 'Add Money', payment: 'Payment', recharge: 'Recharge', bill_pay: 'Bills' };

export default function History() {
  const [txs, setTxs] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/transfer/history').then(r => { setTxs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? txs : txs.filter(t => t.type === filter);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <div className="p-4 bg-white border-b border-violet-50 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-800">Transaction History</h1>
      </div>
      <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === f ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-500 border-gray-200'}`}>
            {filterLabels[f]}
          </button>
        ))}
      </div>
      <div className="px-4 flex flex-col gap-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400 gap-3">
            <ClipboardList size={40} strokeWidth={1.2} />
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          filtered.map(tx => <TransactionCard key={tx._id} tx={tx} userId={user?._id} />)
        )}
      </div>
    </div>
  );
}
