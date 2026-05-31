import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import PinPad from '../components/PinPad';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import { X, CheckCircle, AlertCircle } from 'lucide-react-native';

export default function Payment() {
  const [step, setStep] = useState<'form'|'pin'|'done'>('form');
  const [form, setForm] = useState({ merchantPhone: '', amount: '', note: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);
  const { fetchWallet } = useWallet();
  const router = useRouter();

  const handlePin = async () => {
    try {
      const { data } = await api.post('/payment/merchant', { merchant_phone: form.merchantPhone, amount: Number(form.amount), note: form.note });
      await fetchWallet();
      setSuccess(data.transaction);
      setStep('done');
    } catch (err: any) { setError(err.message); setStep('form'); }
  };

  return (
    <View className="flex-1 bg-green-50">
      <View className="flex-row items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-green-50">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 bg-green-50 rounded-full items-center justify-center"><X size={18} color="#166534" /></TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Merchant Payment</Text>
      </View>
      <ScrollView className="flex-1 p-4" contentContainerClassName="gap-4">
        {step === 'form' && (
          <>
            <View className="bg-white rounded-2xl p-4 gap-3">
              {[{k:'merchantPhone',p:'Merchant phone / ID',kb:'phone-pad'},{k:'amount',p:'Amount (৳)',kb:'numeric'},{k:'note',p:'Note (optional)',kb:'default'}].map(({k,p,kb})=>(
                <View key={k} className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-3">
                  <TextInput placeholder={p} value={(form as any)[k]} onChangeText={v=>setForm({...form,[k]:v})} keyboardType={kb as any} className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF" />
                </View>
              ))}
            </View>
            {error?<View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} color="#EF4444"/><Text className="text-red-500 text-sm">{error}</Text></View>:null}
            <TouchableOpacity onPress={()=>{if(form.merchantPhone&&form.amount){setStep('pin');setError('');}}} className="bg-green-700 rounded-2xl py-3 items-center"><Text className="text-white font-bold text-lg">Proceed</Text></TouchableOpacity>
          </>
        )}
        {step==='pin'&&<View className="bg-white rounded-2xl p-6 items-center gap-4"><Text className="text-3xl font-extrabold text-green-800">৳{form.amount}</Text><Text className="text-gray-500 text-sm">to {form.merchantPhone}</Text><PinPad onComplete={handlePin} label="Enter PIN to pay"/></View>}
        {step==='done'&&success&&(
          <View className="bg-white rounded-2xl p-8 items-center gap-4">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center"><CheckCircle size={36} color="#16A34A" strokeWidth={1.5}/></View>
            <Text className="text-xl font-bold text-gray-800">Payment Successful!</Text>
            <Text className="text-gray-500">৳{success.amount} paid</Text>
            <TouchableOpacity onPress={()=>router.back()} className="bg-green-700 rounded-2xl py-3 px-8 w-full items-center"><Text className="text-white font-bold">Done</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
