import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import { X, Zap, Flame, Droplets, Wifi, Tv, GraduationCap, CreditCard, ReceiptText, CheckCircle, AlertCircle } from 'lucide-react-native';

const categories = [
  { id: 'electricity', Icon: Zap,          label: 'Electricity', bg: '#FEFCE8', color: '#CA8A04' },
  { id: 'gas',         Icon: Flame,         label: 'Gas',         bg: '#FFF7ED', color: '#F97316' },
  { id: 'water',       Icon: Droplets,      label: 'Water',       bg: '#EFF6FF', color: '#3B82F6' },
  { id: 'internet',    Icon: Wifi,          label: 'Internet',    bg: '#F0F9FF', color: '#0284C7' },
  { id: 'tv',          Icon: Tv,            label: 'Cable TV',    bg: '#F5F3FF', color: '#7C3AED' },
  { id: 'education',   Icon: GraduationCap, label: 'Education',   bg: '#F0FDFA', color: '#0D9488' },
  { id: 'loan_emi',    Icon: CreditCard,    label: 'Loan EMI',    bg: '#FEF2F2', color: '#EF4444' },
  { id: 'other',       Icon: ReceiptText,   label: 'Other',       bg: '#F9FAFB', color: '#6B7280' },
];

export default function BillPay() {
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ accountNo: '', amount: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { fetchWallet } = useWallet();
  const router = useRouter();
  const cat = categories.find(c => c.id === selected);

  const submit = async () => {
    try {
      await api.post('/bills/pay', { category: selected, account_no: form.accountNo, amount: Number(form.amount) });
      await fetchWallet();
      setDone(true);
    } catch (err: any) { setError(err.message); }
  };

  return (
    <View className="flex-1 bg-violet-50">
      <View className="flex-row items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-violet-50">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 bg-violet-50 rounded-full items-center justify-center"><X size={18} color="#7C3AED" /></TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Bill Pay</Text>
      </View>
      <ScrollView className="flex-1 p-4" contentContainerClassName="gap-4">
        {!done && !selected && (
          <View className="flex-row flex-wrap gap-3">
            {categories.map(({ id, Icon, label, bg, color }) => (
              <TouchableOpacity key={id} onPress={() => setSelected(id)} className="bg-white rounded-2xl p-4 items-center gap-2 shadow-sm" style={{ width: '47%' }}>
                <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon size={22} color={color} strokeWidth={1.8} />
                </View>
                <Text className="text-sm font-medium text-gray-700">{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!done && selected && cat && (
          <>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text className="text-violet-600 text-sm">← Change category</Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: cat.bg }}>
              <View className="w-10 h-10 bg-white rounded-xl items-center justify-center">
                <cat.Icon size={20} color={cat.color} strokeWidth={1.8} />
              </View>
              <Text className="font-semibold text-gray-800">{cat.label}</Text>
            </View>
            <View className="bg-white rounded-2xl p-4 gap-3">
              <TextInput placeholder="Account / Bill number" value={form.accountNo} onChangeText={v => setForm({ ...form, accountNo: v })} className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800" placeholderTextColor="#9CA3AF" />
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-2">
                <Text className="text-gray-500 font-bold">৳</Text>
                <TextInput placeholder="Amount" value={form.amount} onChangeText={v => setForm({ ...form, amount: v })} keyboardType="numeric" className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF" />
              </View>
            </View>
            {error ? <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} color="#EF4444" /><Text className="text-red-500 text-sm">{error}</Text></View> : null}
            <TouchableOpacity onPress={submit} className="bg-violet-600 rounded-2xl py-3 items-center"><Text className="text-white font-bold text-lg">Pay Bill</Text></TouchableOpacity>
          </>
        )}
        {done && (
          <View className="bg-white rounded-2xl p-8 items-center gap-4">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center"><CheckCircle size={36} color="#16A34A" strokeWidth={1.5} /></View>
            <Text className="text-xl font-bold text-gray-800">Bill Paid!</Text>
            <Text className="text-gray-500">৳{form.amount} for {cat?.label}</Text>
            <TouchableOpacity onPress={() => router.back()} className="bg-violet-600 rounded-2xl py-3 px-8 w-full items-center"><Text className="text-white font-bold">Done</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
