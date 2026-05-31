import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import { X, CheckCircle, AlertCircle } from 'lucide-react-native';

const operators = ['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel'];
const quickAmounts = [50, 100, 149, 199, 299, 399, 499];

export default function Recharge() {
  const [form, setForm] = useState({ msisdn: '', operator: 'Grameenphone', type: 'prepaid', amount: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { fetchWallet } = useWallet();
  const router = useRouter();

  const submit = async () => {
    try {
      await api.post('/recharge', { ...form, amount: Number(form.amount) });
      await fetchWallet();
      setDone(true);
    } catch (err: any) { setError(err.message); }
  };

  return (
    <View className="flex-1 bg-violet-50">
      <View className="flex-row items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-violet-50">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 bg-violet-50 rounded-full items-center justify-center">
          <X size={18} color="#7C3AED" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Mobile Recharge</Text>
      </View>
      <ScrollView className="flex-1 p-4" contentContainerClassName="gap-4">
        {!done ? (
          <>
            <View className="bg-white rounded-2xl p-4 gap-3">
              <TextInput placeholder="Phone number to recharge" value={form.msisdn} onChangeText={v => setForm({ ...form, msisdn: v })}
                keyboardType="phone-pad" className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800" placeholderTextColor="#9CA3AF" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                {operators.map(o => (
                  <TouchableOpacity key={o} onPress={() => setForm({ ...form, operator: o })}
                    className={`px-3 py-2 rounded-xl border ${form.operator === o ? 'border-violet-500 bg-violet-50' : 'border-gray-200'}`}>
                    <Text className={`text-sm font-medium ${form.operator === o ? 'text-violet-700' : 'text-gray-600'}`}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View className="flex-row gap-2">
                {['prepaid', 'postpaid'].map(t => (
                  <TouchableOpacity key={t} onPress={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2 rounded-xl border-2 items-center ${form.type === t ? 'border-violet-500 bg-violet-50' : 'border-gray-100'}`}>
                    <Text className={`text-sm font-semibold capitalize ${form.type === t ? 'text-violet-700' : 'text-gray-500'}`}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="bg-white rounded-2xl p-4 gap-3">
              <Text className="text-sm font-semibold text-gray-600">Quick Amount</Text>
              <View className="flex-row flex-wrap gap-2">
                {quickAmounts.map(p => (
                  <TouchableOpacity key={p} onPress={() => setForm({ ...form, amount: String(p) })}
                    className={`px-3 py-2 rounded-xl border-2 ${form.amount === String(p) ? 'border-violet-500 bg-violet-50' : 'border-gray-100'}`}>
                    <Text className={`text-sm font-semibold ${form.amount === String(p) ? 'text-violet-700' : 'text-gray-600'}`}>৳{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-2">
                <Text className="text-gray-500 font-bold">৳</Text>
                <TextInput placeholder="Custom amount" value={form.amount} onChangeText={v => setForm({ ...form, amount: v })}
                  keyboardType="numeric" className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF" />
              </View>
            </View>
            {error ? <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} color="#EF4444" /><Text className="text-red-500 text-sm">{error}</Text></View> : null}
            <TouchableOpacity onPress={submit} className="bg-violet-600 rounded-2xl py-3 items-center">
              <Text className="text-white font-bold text-lg">Recharge Now</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View className="bg-white rounded-2xl p-8 items-center gap-4">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center">
              <CheckCircle size={36} color="#16A34A" strokeWidth={1.5} />
            </View>
            <Text className="text-xl font-bold text-gray-800">Recharge Successful!</Text>
            <Text className="text-gray-500">৳{form.amount} to {form.msisdn}</Text>
            <TouchableOpacity onPress={() => router.back()} className="bg-violet-600 rounded-2xl py-3 px-8 w-full items-center">
              <Text className="text-white font-bold">Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
