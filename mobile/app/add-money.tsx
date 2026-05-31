import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import { X, Landmark, CreditCard, Users, Check, CheckCircle, AlertCircle } from 'lucide-react-native';

const sources = [
  { id: 'bank', Icon: Landmark, label: 'Bank Transfer', bg: '#EFF6FF', color: '#2563EB' },
  { id: 'card', Icon: CreditCard, label: 'Debit/Credit Card', bg: '#F5F3FF', color: '#7C3AED' },
  { id: 'agent', Icon: Users, label: 'Agent (Cash In)', bg: '#F0FDF4', color: '#16A34A' },
];

export default function AddMoney() {
  const [source, setSource] = useState('bank');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { fetchWallet } = useWallet();
  const router = useRouter();

  const submit = async () => {
    try {
      await api.post('/wallet/add-money', { amount: Number(amount), source });
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
        <Text className="text-lg font-bold text-gray-800">Add Money</Text>
      </View>
      <ScrollView className="flex-1 p-4" contentContainerClassName="gap-4">
        {!done ? (
          <>
            <View className="bg-white rounded-2xl p-4 gap-3">
              <Text className="text-sm font-semibold text-gray-600">Select source</Text>
              {sources.map(({ id, Icon, label, bg, color }) => (
                <TouchableOpacity key={id} onPress={() => setSource(id)}
                  className={`flex-row items-center gap-3 p-3 rounded-xl border-2 ${source === id ? 'border-violet-500' : 'border-gray-100'}`}
                  style={source === id ? { backgroundColor: '#F5F3FF' } : {}}>
                  <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: bg }}>
                    <Icon size={18} color={color} strokeWidth={1.8} />
                  </View>
                  <Text className={`font-medium flex-1 ${source === id ? 'text-violet-700' : 'text-gray-700'}`}>{label}</Text>
                  {source === id && <Check size={16} color="#7C3AED" />}
                </TouchableOpacity>
              ))}
            </View>
            <View className="bg-white rounded-2xl p-4">
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-2">
                <Text className="text-gray-500 font-bold text-lg">৳</Text>
                <TextInput placeholder="Enter amount" value={amount} onChangeText={setAmount}
                  keyboardType="numeric" className="py-3 flex-1 text-gray-800 text-lg" placeholderTextColor="#9CA3AF" />
              </View>
            </View>
            {error ? <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} color="#EF4444" /><Text className="text-red-500 text-sm">{error}</Text></View> : null}
            <TouchableOpacity onPress={submit} className="bg-violet-600 rounded-2xl py-3 items-center">
              <Text className="text-white font-bold text-lg">Add Money</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View className="bg-white rounded-2xl p-8 items-center gap-4">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center">
              <CheckCircle size={36} color="#16A34A" strokeWidth={1.5} />
            </View>
            <Text className="text-xl font-bold text-gray-800">Money Added!</Text>
            <Text className="text-gray-500">৳{amount} added to wallet</Text>
            <TouchableOpacity onPress={() => router.back()} className="bg-violet-600 rounded-2xl py-3 px-8 w-full items-center">
              <Text className="text-white font-bold">Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
