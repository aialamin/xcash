import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import PinPad from '../../components/PinPad';
import { User, Phone, CreditCard, Mail, ChevronLeft, AlertCircle } from 'lucide-react-native';

export default function Register() {
  const [step, setStep] = useState<'info' | 'pin' | 'confirm'>('info');
  const [form, setForm] = useState({ name: '', phone: '', nid: '', email: '' });
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const router = useRouter();

  const handleConfirm = async (confirmPin: string) => {
    if (confirmPin !== pin) { setError('PINs do not match'); setStep('pin'); return; }
    try {
      await register({ ...form, pin });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setStep('info');
    }
  };

  const fields = [
    { key: 'name',  Icon: User,       placeholder: 'Full Name',           keyboard: 'default' as const },
    { key: 'phone', Icon: Phone,      placeholder: 'Phone (01XXXXXXXXX)', keyboard: 'phone-pad' as const },
    { key: 'nid',   Icon: CreditCard, placeholder: 'National ID (NID)',   keyboard: 'default' as const },
    { key: 'email', Icon: Mail,       placeholder: 'Email (optional)',    keyboard: 'email-address' as const },
  ];

  return (
    <View className="flex-1 bg-violet-700">
      <View className="items-center pt-12 pb-6">
        <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-xl mb-3">
          <Text className="text-2xl font-black text-violet-700">X</Text>
        </View>
        <Text className="text-2xl font-extrabold text-white">Create Account</Text>
        <View className="flex-row gap-1.5 mt-3">
          {['info','pin','confirm'].map((s, i) => (
            <View key={s} className="h-1.5 w-8 rounded-full" style={{ backgroundColor: step === s ? '#fff' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </View>
      </View>
      <ScrollView className="flex-1 bg-white rounded-t-3xl" contentContainerClassName="p-6 gap-4">
        {step === 'info' && (
          <>
            <Text className="text-xl font-bold text-gray-800">Your details</Text>
            {fields.map(({ key, Icon, placeholder, keyboard }) => (
              <View key={key} className="flex-row items-center border border-gray-200 rounded-2xl px-4 gap-3">
                <Icon size={16} color="#9CA3AF" />
                <TextInput placeholder={placeholder} value={(form as any)[key]}
                  onChangeText={v => setForm({ ...form, [key]: v })}
                  keyboardType={keyboard} className="py-3 flex-1 text-gray-800"
                  placeholderTextColor="#9CA3AF" />
              </View>
            ))}
            {error ? <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} color="#EF4444" /><Text className="text-red-500 text-sm">{error}</Text></View> : null}
            <TouchableOpacity onPress={() => { if (form.name && form.phone) { setStep('pin'); setError(''); } }} className="bg-violet-600 rounded-2xl py-3 items-center">
              <Text className="text-white font-bold text-lg">Continue</Text>
            </TouchableOpacity>
            <View className="flex-row justify-center gap-1">
              <Text className="text-gray-500 text-sm">Have account?</Text>
              <Link href="/(auth)/login"><Text className="text-violet-600 font-semibold text-sm">Login</Text></Link>
            </View>
          </>
        )}
        {step === 'pin' && (
          <View className="items-center gap-4">
            <TouchableOpacity onPress={() => setStep('info')} className="self-start flex-row items-center gap-1"><ChevronLeft size={16} color="#7C3AED" /><Text className="text-violet-600 text-sm">Back</Text></TouchableOpacity>
            <PinPad onComplete={p => { setPin(p); setStep('confirm'); }} label="Set a 6-digit PIN" />
          </View>
        )}
        {step === 'confirm' && (
          <View className="items-center gap-4">
            <TouchableOpacity onPress={() => setStep('pin')} className="self-start flex-row items-center gap-1"><ChevronLeft size={16} color="#7C3AED" /><Text className="text-violet-600 text-sm">Back</Text></TouchableOpacity>
            {error ? <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} color="#EF4444" /><Text className="text-red-500 text-sm">{error}</Text></View> : null}
            <PinPad onComplete={handleConfirm} label="Confirm your PIN" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
