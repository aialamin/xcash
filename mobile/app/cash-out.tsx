import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import PinPad from '../components/PinPad';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import { X, CheckCircle, AlertCircle } from 'lucide-react-native';

export default function CashOut() {
  const [step, setStep] = useState<'form' | 'pin' | 'done'>('form');
  const [agentPhone, setAgentPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);
  const { fetchWallet } = useWallet();
  const router = useRouter();
  const fee = amount ? Math.ceil(Number(amount) * 0.018) : 0;

  const handlePin = async () => {
    try {
      const { data } = await api.post('/wallet/cash-out', { amount: Number(amount), agent_phone: agentPhone });
      await fetchWallet();
      setSuccess(data.transaction);
      setStep('done');
    } catch (err: any) { setError(err.message); setStep('form'); }
  };

  return (
    <View className="flex-1 bg-green-50">
      <View className="flex-row items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-green-50">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 bg-green-50 rounded-full items-center justify-center"><X size={18} color="#166534" /></TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Cash Out</Text>
      </View>
      <ScrollView className="flex-1 p-4" contentContainerClassName="gap-4">
        {step === 'form' && (
          <>
            <View className="bg-white rounded-2xl p-4 gap-3">
              <TextInput placeholder="Agent phone number" value={agentPhone} onChangeText={setAgentPhone} keyboardType="phone-pad" className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800" placeholderTextColor="#9CA3AF" />
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-2">
                <Text className="text-gray-500 font-bold">৳</Text>
                <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF" />
              </View>
              {Number(amount) > 0 && (
                <View className="bg-green-50 rounded-xl p-3 gap-1">
                  <View className="flex-row justify-between"><Text className="text-gray-600 text-sm">Amount</Text><Text className="text-gray-600 text-sm">৳{amount}</Text></View>
                  <View className="flex-row justify-between"><Text className="text-gray-600 text-sm">Fee (1.8%)</Text><Text className="text-gray-600 text-sm">৳{fee}</Text></View>
                  <View className="flex-row justify-between border-t border-green-100 pt-1"><Text className="font-bold text-green-800 text-sm">Total</Text><Text className="font-bold text-green-800 text-sm">৳{Number(amount) + fee}</Text></View>
                </View>
              )}
            </View>
            {error ? <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} color="#EF4444" /><Text className="text-red-500 text-sm">{error}</Text></View> : null}
            <TouchableOpacity onPress={() => { if (agentPhone && amount) { setStep('pin'); setError(''); } }} className="bg-green-700 rounded-2xl py-3 items-center">
              <Text className="text-white font-bold text-lg">Proceed</Text>
            </TouchableOpacity>
          </>
        )}
        {step === 'pin' && (
          <View className="bg-white rounded-2xl p-6 items-center gap-4">
            <Text className="text-3xl font-extrabold text-green-800">৳{amount}</Text>
            <Text className="text-gray-500 text-sm">Agent: {agentPhone} · Fee ৳{fee}</Text>
            <PinPad onComplete={handlePin} label="Enter PIN to confirm" />
          </View>
        )}
        {step === 'done' && success && (
          <View className="bg-white rounded-2xl p-8 items-center gap-4">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center"><CheckCircle size={36} color="#16A34A" strokeWidth={1.5} /></View>
            <Text className="text-xl font-bold text-gray-800">Cash Out Done!</Text>
            <Text className="text-gray-500">৳{success.amount} · Fee ৳{success.fee}</Text>
            <TouchableOpacity onPress={() => router.back()} className="bg-green-700 rounded-2xl py-3 px-8 w-full items-center"><Text className="text-white font-bold">Done</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
