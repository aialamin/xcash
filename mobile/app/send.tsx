import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import PinPad from '../components/PinPad';
import api from '../services/api';
import { X, CheckCircle, AlertCircle, User, Clock, ShieldCheck } from 'lucide-react-native';

type Step = 'form' | 'confirm' | 'cancel' | 'pin' | 'done';

export default function SendMoney() {
  const [step, setStep]         = useState<Step>('form');
  const [form, setForm]         = useState({ phone: '', amount: '', note: '' });
  const [receiver, setReceiver] = useState<{ name: string; phone: string } | null>(null);
  const [holdId, setHoldId]     = useState('');
  const [holdData, setHoldData] = useState<any>(null);
  const [countdown, setCountdown] = useState(30);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState<any>(null);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer during cancel window
  useEffect(() => {
    if (step === 'cancel') {
      setCountdown(30);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            confirmSend();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  // Step 1: verify receiver name (bKash DOESN'T do this)
  const verifyReceiver = async () => {
    if (!form.phone || !form.amount) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/transfer/verify-receiver', { phone: form.phone });
      setReceiver(data);
      setStep('confirm');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  // Step 2: hold transaction — opens 30s cancel window
  const holdAndStartTimer = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/transfer/hold', {
        phone: form.phone, amount: Number(form.amount), note: form.note,
      });
      setHoldId(data.hold_id);
      setHoldData(data);
      setStep('cancel');
    } catch (err: any) { setError(err.message); setStep('form'); }
    finally { setLoading(false); }
  };

  // Cancel during window
  const cancelSend = async () => {
    clearInterval(timerRef.current!);
    try { await api.delete(`/transfer/hold/${encodeURIComponent(holdId)}`); } catch {}
    setStep('form'); setHoldId(''); setHoldData(null); setError('');
  };

  // Window elapsed or user confirmed — go to PIN
  const confirmSend = () => {
    clearInterval(timerRef.current!);
    setStep('pin');
  };

  // Step 3: PIN → actual send
  const handlePin = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/transfer/send', {
        phone: form.phone, amount: Number(form.amount), note: form.note,
      });
      setSuccess(data.transaction);
      setStep('done');
    } catch (err: any) { setError(err.message); setStep('form'); }
    finally { setLoading(false); }
  };

  const fee = Number(form.amount) > 100 ? 5 : 0;

  return (
    <View className="flex-1 bg-violet-50">
      <View className="flex-row items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-violet-50">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 bg-violet-50 rounded-full items-center justify-center">
          <X size={18} color="#7C3AED" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Send Money</Text>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerClassName="gap-4">

        {/* STEP 1 — Form */}
        {step === 'form' && (
          <>
            <View className="bg-white rounded-2xl p-4 gap-3">
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-3">
                <TextInput placeholder="Receiver phone" value={form.phone} onChangeText={v => setForm({ ...form, phone: v })}
                  keyboardType="phone-pad" className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF" />
              </View>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-2">
                <Text className="text-gray-500 font-bold">৳</Text>
                <TextInput placeholder="Amount" value={form.amount} onChangeText={v => setForm({ ...form, amount: v })}
                  keyboardType="numeric" className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF" />
              </View>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-3">
                <TextInput placeholder="Note (optional)" value={form.note} onChangeText={v => setForm({ ...form, note: v })}
                  className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF" />
              </View>
            </View>
            {fee > 0 && (
              <View className="bg-amber-50 rounded-xl px-4 py-3 gap-1">
                <View className="flex-row justify-between"><Text className="text-gray-600 text-sm">Amount</Text><Text className="text-gray-700 text-sm font-medium">৳{form.amount}</Text></View>
                <View className="flex-row justify-between"><Text className="text-gray-600 text-sm">Fee</Text><Text className="text-amber-600 text-sm font-medium">৳{fee}</Text></View>
                <View className="flex-row justify-between border-t border-amber-100 pt-1"><Text className="text-gray-800 text-sm font-bold">Total</Text><Text className="text-gray-800 text-sm font-bold">৳{Number(form.amount) + fee}</Text></View>
              </View>
            )}
            {error ? <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} color="#EF4444" /><Text className="text-red-500 text-sm">{error}</Text></View> : null}
            <TouchableOpacity onPress={verifyReceiver} disabled={loading} className="bg-violet-600 rounded-2xl py-3 items-center">
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Confirm Receiver</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2 — Receiver confirmed (bKash MISSING) */}
        {step === 'confirm' && receiver && (
          <View className="bg-white rounded-2xl p-6 gap-4">
            <View className="items-center gap-3">
              <View className="w-16 h-16 bg-violet-100 rounded-full items-center justify-center">
                <User size={32} color="#7C3AED" />
              </View>
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-800">{receiver.name}</Text>
                <Text className="text-gray-500">{receiver.phone}</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                <ShieldCheck size={13} color="#16A34A" />
                <Text className="text-green-700 text-xs font-semibold">Verified XCash Account</Text>
              </View>
            </View>
            <View className="bg-violet-50 rounded-xl p-3 gap-1">
              <View className="flex-row justify-between"><Text className="text-gray-600 text-sm">Amount</Text><Text className="font-bold text-gray-800">৳{form.amount}</Text></View>
              {fee > 0 && <View className="flex-row justify-between"><Text className="text-gray-600 text-sm">Fee</Text><Text className="text-amber-600 text-sm">৳{fee}</Text></View>}
              <View className="flex-row justify-between border-t border-violet-100 pt-1"><Text className="font-bold text-violet-700">Total</Text><Text className="font-bold text-violet-700">৳{Number(form.amount) + fee}</Text></View>
            </View>
            {error ? <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2"><AlertCircle size={15} color="#EF4444" /><Text className="text-red-500 text-sm">{error}</Text></View> : null}
            <TouchableOpacity onPress={holdAndStartTimer} disabled={loading} className="bg-violet-600 rounded-2xl py-3 items-center">
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Send ৳{Number(form.amount) + fee}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('form')} className="py-2 items-center">
              <Text className="text-gray-500 text-sm">← Change details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3 — 30-second cancel window (bKash has ZERO) */}
        {step === 'cancel' && holdData && (
          <View className="bg-white rounded-2xl p-6 items-center gap-5">
            <View className={`w-20 h-20 rounded-full items-center justify-center ${countdown > 10 ? 'bg-amber-100' : 'bg-red-100'}`}>
              <Clock size={36} color={countdown > 10 ? '#D97706' : '#EF4444'} />
            </View>
            <Text className="text-2xl font-extrabold text-gray-800">{countdown}s</Text>
            <Text className="text-gray-500 text-center text-sm">
              Transaction will send automatically in <Text className="font-bold text-violet-700">{countdown} seconds</Text>.{'\n'}Tap cancel to stop it.
            </Text>
            <View className="w-full bg-violet-50 rounded-xl p-3 gap-1">
              <Text className="text-gray-500 text-xs text-center">Sending to</Text>
              <Text className="text-center font-bold text-gray-800">{holdData.receiver_name}</Text>
              <Text className="text-center text-violet-700 font-extrabold text-xl">৳{holdData.total}</Text>
            </View>
            <TouchableOpacity onPress={cancelSend} className="w-full bg-red-500 rounded-2xl py-3 items-center">
              <Text className="text-white font-bold text-lg">Cancel Transaction</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmSend} className="w-full border-2 border-violet-200 rounded-2xl py-3 items-center">
              <Text className="text-violet-700 font-bold">Send Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4 — PIN */}
        {step === 'pin' && (
          <View className="bg-white rounded-2xl p-6 items-center gap-4">
            <Text className="text-3xl font-extrabold text-violet-700">৳{Number(form.amount) + fee}</Text>
            <Text className="text-gray-500 text-sm">to {receiver?.name} · {form.phone}</Text>
            {loading ? <ActivityIndicator color="#7C3AED" size="large" /> : <PinPad onComplete={handlePin} label="Enter PIN to confirm" />}
          </View>
        )}

        {/* STEP 5 — Done */}
        {step === 'done' && success && (
          <View className="bg-white rounded-2xl p-8 items-center gap-4">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center">
              <CheckCircle size={36} color="#16A34A" strokeWidth={1.5} />
            </View>
            <Text className="text-xl font-bold text-gray-800">Money Sent!</Text>
            <Text className="text-gray-500">৳{success.amount} to {receiver?.name}</Text>
            <Text className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2 font-mono">{success.ref}</Text>
            <TouchableOpacity onPress={() => router.back()} className="bg-violet-600 rounded-2xl py-3 px-8 w-full items-center">
              <Text className="text-white font-bold">Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
