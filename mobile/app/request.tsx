import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { X, CheckCircle, AlertCircle } from 'lucide-react-native';

export default function RequestMoney() {
  const [form, setForm] = useState({ phone: '', amount: '', note: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

  const submit = async () => {
    try {
      await api.post('/transfer/request', { ...form, amount: Number(form.amount) });
      setDone(true);
    } catch (err: any) { setError(err.message); }
  };

  return (
    <View className="flex-1 bg-violet-50">
      <View className="flex-row items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-violet-50">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 bg-violet-50 rounded-full items-center justify-center"><X size={18} color="#7C3AED" /></TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Request Money</Text>
      </View>
      <ScrollView className="flex-1 p-4" contentContainerClassName="gap-4">
        {!done ? (
          <>
            <View className="bg-white rounded-2xl p-4 gap-3">
              {[{k:'phone',p:'From phone',kb:'phone-pad'},{k:'amount',p:'Amount (৳)',kb:'numeric'},{k:'note',p:'Note (optional)',kb:'default'}].map(({k,p,kb})=>(
                <View key={k} className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-3">
                  <TextInput placeholder={p} value={(form as any)[k]} onChangeText={v=>setForm({...form,[k]:v})} keyboardType={kb as any} className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF" />
                </View>
              ))}
            </View>
            {error?<View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} color="#EF4444"/><Text className="text-red-500 text-sm">{error}</Text></View>:null}
            <TouchableOpacity onPress={submit} className="bg-violet-600 rounded-2xl py-3 items-center"><Text className="text-white font-bold text-lg">Send Request</Text></TouchableOpacity>
          </>
        ):(
          <View className="bg-white rounded-2xl p-8 items-center gap-4">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center"><CheckCircle size={36} color="#3B82F6" strokeWidth={1.5}/></View>
            <Text className="text-xl font-bold text-gray-800">Request Sent!</Text>
            <Text className="text-gray-500">৳{form.amount} requested from {form.phone}</Text>
            <TouchableOpacity onPress={()=>router.back()} className="bg-violet-600 rounded-2xl py-3 px-8 w-full items-center"><Text className="text-white font-bold">Done</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
