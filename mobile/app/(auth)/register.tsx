import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import OTPInput from '../../components/OTPInput';
import { User, Phone, CreditCard, Mail, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react-native';

const steps = ['info', 'pin', 'confirm'] as const;
type Step = typeof steps[number];

export default function Register() {
  const [step, setStep] = useState<Step>('info');
  const [form, setForm] = useState({ name: '', phone: '', nid: '', email: '' });
  const [pin, setPin]   = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const stepIndex = steps.indexOf(step);

  const handleConfirm = async (confirmPin: string) => {
    if (confirmPin !== pin) { setError('PINs do not match. Try again.'); return; }
    setLoading(true);
    try {
      await register({ ...form, pin });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setStep('info');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <View className="flex-1 bg-white">

        {/* Header */}
        <View style={{ backgroundColor: '#7C3AED' }} className="pt-14 pb-10 px-6">
          <View className="flex-row items-center gap-3 mb-6">
            {step !== 'info' && (
              <TouchableOpacity onPress={() => { setStep(steps[stepIndex - 1]); setError(''); }}
                className="w-9 h-9 bg-white/20 rounded-full items-center justify-center">
                <ChevronLeft size={20} color="white" />
              </TouchableOpacity>
            )}
            <Link href="/(auth)/login" asChild>
              {step === 'info' ? (
                <TouchableOpacity className="w-9 h-9 bg-white/20 rounded-full items-center justify-center">
                  <ChevronLeft size={20} color="white" />
                </TouchableOpacity>
              ) : <View />}
            </Link>
          </View>

          <Text className="text-3xl font-extrabold text-white">Create Account</Text>
          <Text className="text-violet-200 mt-1">
            {step === 'info' ? 'Enter your details' : step === 'pin' ? 'Set a secure PIN' : 'Confirm your PIN'}
          </Text>

          {/* Progress bar */}
          <View className="flex-row gap-2 mt-5">
            {steps.map((s, i) => (
              <View key={s} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <View className="h-full rounded-full bg-white"
                  style={{ width: i <= stepIndex ? '100%' : '0%' }} />
              </View>
            ))}
          </View>
          <Text className="text-violet-200 text-xs mt-2">Step {stepIndex + 1} of {steps.length}</Text>
        </View>

        {/* Content */}
        <View className="flex-1 bg-white rounded-t-3xl -mt-6">
          <ScrollView contentContainerClassName="p-6 gap-5" showsVerticalScrollIndicator={false}>

            {/* STEP 1 — Info */}
            {step === 'info' && (
              <>
                {[
                  { key: 'name',  Icon: User,       label: 'Full Name',       placeholder: 'Md Alamin Hossain', keyboard: 'default' as const,        required: true },
                  { key: 'phone', Icon: Phone,      label: 'Phone Number',    placeholder: '01XXXXXXXXX',       keyboard: 'phone-pad' as const,      required: true },
                  { key: 'nid',   Icon: CreditCard, label: 'National ID',     placeholder: '10-digit NID',      keyboard: 'number-pad' as const,     required: false },
                  { key: 'email', Icon: Mail,       label: 'Email',           placeholder: 'optional',          keyboard: 'email-address' as const,  required: false },
                ].map(({ key, Icon, label, placeholder, keyboard, required }) => (
                  <View key={key}>
                    <View className="flex-row items-center gap-1 mb-1.5">
                      <Text className="text-sm font-semibold text-gray-700">{label}</Text>
                      {required && <Text className="text-red-400 text-xs">*</Text>}
                    </View>
                    <View className="flex-row items-center bg-gray-50 border-2 rounded-2xl px-4 gap-3"
                      style={{ borderColor: (form as any)[key] ? '#7C3AED' : '#F3F4F6' }}>
                      <Icon size={18} color={(form as any)[key] ? '#7C3AED' : '#9CA3AF'} />
                      <TextInput
                        placeholder={placeholder}
                        value={(form as any)[key]}
                        onChangeText={v => setForm({ ...form, [key]: v })}
                        keyboardType={keyboard}
                        className="py-4 flex-1 text-gray-800 font-medium"
                        placeholderTextColor="#9CA3AF"
                      />
                      {(form as any)[key] ? <CheckCircle size={16} color="#10B981" /> : null}
                    </View>
                  </View>
                ))}

                {error ? (
                  <View className="flex-row items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <AlertCircle size={16} color="#EF4444" />
                    <Text className="text-red-500 text-sm flex-1">{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={() => { if (form.name && form.phone) { setStep('pin'); setError(''); } }}
                  disabled={!form.name || !form.phone}
                  className="rounded-2xl py-4 items-center mt-2"
                  style={{ backgroundColor: form.name && form.phone ? '#7C3AED' : '#E5E7EB' }}>
                  <Text className={`font-bold text-lg ${form.name && form.phone ? 'text-white' : 'text-gray-400'}`}>
                    Continue →
                  </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center gap-1">
                  <Text className="text-gray-500 text-sm">Already have an account?</Text>
                  <Link href="/(auth)/login"><Text className="text-violet-600 font-semibold text-sm">Login</Text></Link>
                </View>
              </>
            )}

            {/* STEP 2 — Set PIN */}
            {step === 'pin' && (
              <View className="items-center gap-6 pt-4">
                <View className="items-center gap-2">
                  <Text className="text-lg font-bold text-gray-800">Choose a 6-digit PIN</Text>
                  <Text className="text-gray-500 text-sm text-center px-8">
                    Never share your PIN with anyone. XCash staff will never ask for it.
                  </Text>
                </View>
                <OTPInput
                  length={6}
                  onComplete={p => { setPin(p); setStep('confirm'); }}
                  label="Tap to enter your PIN"
                />
                <View className="bg-amber-50 border border-amber-100 rounded-2xl p-4 w-full">
                  <Text className="text-amber-700 text-xs font-semibold mb-1">💡 PIN Tips</Text>
                  <Text className="text-amber-600 text-xs">• Avoid 123456, 000000 or birthdays</Text>
                  <Text className="text-amber-600 text-xs">• Use a unique combination</Text>
                  <Text className="text-amber-600 text-xs">• Memorize it — don't write it down</Text>
                </View>
              </View>
            )}

            {/* STEP 3 — Confirm PIN */}
            {step === 'confirm' && (
              <View className="items-center gap-6 pt-4">
                <View className="items-center gap-2">
                  <Text className="text-lg font-bold text-gray-800">Confirm your PIN</Text>
                  <Text className="text-gray-500 text-sm">Enter the same PIN again</Text>
                </View>
                {error ? (
                  <View className="flex-row items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 w-full">
                    <AlertCircle size={16} color="#EF4444" />
                    <Text className="text-red-500 text-sm flex-1">{error}</Text>
                  </View>
                ) : null}
                {loading ? (
                  <View className="items-center gap-3 py-8">
                    <View className="w-16 h-16 bg-violet-100 rounded-full items-center justify-center">
                      <Text className="text-3xl">⏳</Text>
                    </View>
                    <Text className="text-gray-500">Creating your account...</Text>
                  </View>
                ) : (
                  <OTPInput
                    length={6}
                    onComplete={handleConfirm}
                    label="Re-enter your PIN"
                    error={error}
                  />
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
