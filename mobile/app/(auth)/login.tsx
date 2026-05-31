import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import OTPInput from '../../components/OTPInput';
import * as LocalAuthentication from 'expo-local-authentication';
import { Phone, ChevronLeft, Fingerprint, ShieldCheck, AlertCircle } from 'lucide-react-native';

export default function Login() {
  const [step, setStep]       = useState<'phone' | 'pin'>('phone');
  const [phone, setPhone]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { login } = useAuth();
  const router    = useRouter();

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled   = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    })();
  }, []);

  const handlePin = async (pin: string) => {
    setLoading(true); setError('');
    try {
      await login(phone, pin);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN. Try again.');
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify your identity',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use PIN',
    });
    if (result.success && phone.length >= 11) setStep('pin');
    else if (result.success) setError('Enter your phone number first');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <View className="flex-1 bg-white">

        {/* Header */}
        <View className="items-center pt-20 pb-10 px-6" style={{ backgroundColor: '#7C3AED' }}>
          <View className="w-20 h-20 bg-white rounded-3xl items-center justify-center shadow-2xl mb-5"
            style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 }}>
            <Text className="text-4xl font-black text-violet-700">X</Text>
          </View>
          <Text className="text-3xl font-extrabold text-white tracking-wide">XCash</Text>
          <Text className="text-violet-200 text-sm mt-1 tracking-widest uppercase">Mobile Banking</Text>
        </View>

        {/* Card */}
        <View className="flex-1 bg-white rounded-t-3xl -mt-6 px-6 pt-8">

          {/* STEP 1 — Phone */}
          {step === 'phone' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6">
              <View>
                <Text className="text-2xl font-bold text-gray-900">Welcome back 👋</Text>
                <Text className="text-gray-500 mt-1">Enter your phone to continue</Text>
              </View>

              {/* Phone input */}
              <View>
                <Text className="text-sm font-semibold text-gray-600 mb-2">Phone Number</Text>
                <View className="flex-row items-center bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 gap-3"
                  style={{ borderColor: phone.length > 0 ? '#7C3AED' : undefined }}>
                  <View className="bg-violet-100 rounded-xl px-2 py-1">
                    <Text className="text-violet-700 font-bold text-sm">🇧🇩 +88</Text>
                  </View>
                  <TextInput
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChangeText={v => { setPhone(v); setError(''); }}
                    keyboardType="phone-pad"
                    maxLength={11}
                    className="py-4 flex-1 text-lg text-gray-800 font-medium"
                    placeholderTextColor="#9CA3AF"
                    autoFocus
                  />
                  {phone.length === 11 && (
                    <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                  )}
                </View>
              </View>

              {error ? (
                <View className="flex-row items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertCircle size={16} color="#EF4444" />
                  <Text className="text-red-500 text-sm flex-1">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => { if (phone.length >= 11) { setStep('pin'); setError(''); } }}
                disabled={phone.length < 11}
                className="rounded-2xl py-4 items-center"
                style={{ backgroundColor: phone.length >= 11 ? '#7C3AED' : '#E5E7EB' }}>
                <Text className={`font-bold text-lg ${phone.length >= 11 ? 'text-white' : 'text-gray-400'}`}>
                  Continue
                </Text>
              </TouchableOpacity>

              {biometricAvailable && (
                <TouchableOpacity onPress={handleBiometric}
                  className="flex-row items-center justify-center gap-2 border-2 border-violet-100 bg-violet-50 rounded-2xl py-4">
                  <Fingerprint size={22} color="#7C3AED" />
                  <Text className="text-violet-700 font-semibold">Login with Biometrics</Text>
                </TouchableOpacity>
              )}

              <View className="flex-row justify-center items-center gap-2 mt-2">
                <View className="flex-1 h-px bg-gray-100" />
                <Text className="text-gray-400 text-sm px-3">New to XCash?</Text>
                <View className="flex-1 h-px bg-gray-100" />
              </View>

              <Link href="/(auth)/register" asChild>
                <TouchableOpacity className="border-2 border-violet-200 rounded-2xl py-4 items-center">
                  <Text className="text-violet-700 font-bold text-lg">Create Account</Text>
                </TouchableOpacity>
              </Link>
            </ScrollView>
          )}

          {/* STEP 2 — PIN */}
          {step === 'pin' && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ alignItems: 'center', gap: 24, paddingBottom: 320 }}>
              <TouchableOpacity onPress={() => { setStep('phone'); setError(''); setLoading(false); }}
                className="self-start flex-row items-center gap-1 -ml-1">
                <ChevronLeft size={20} color="#7C3AED" />
                <Text className="text-violet-600 font-medium">Back</Text>
              </TouchableOpacity>

              <View className="items-center gap-2 w-full">
                <View className="w-16 h-16 bg-violet-100 rounded-full items-center justify-center">
                  <ShieldCheck size={32} color="#7C3AED" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">Enter your PIN</Text>
                <View className="flex-row items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                  <Phone size={14} color="#6B7280" />
                  <Text className="text-gray-500 text-sm font-medium">+88{phone}</Text>
                </View>
              </View>

              {loading ? (
                <View className="items-center gap-3 py-8">
                  <ActivityIndicator size="large" color="#7C3AED" />
                  <Text className="text-gray-500 text-sm">Verifying...</Text>
                </View>
              ) : (
                <OTPInput
                  length={6}
                  onComplete={handlePin}
                  label="Enter your 6-digit PIN"
                  error={error}
                />
              )}

              {error ? (
                <View className="flex-row items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 w-full">
                  <AlertCircle size={16} color="#EF4444" />
                  <Text className="text-red-500 text-sm flex-1">{error}</Text>
                </View>
              ) : null}

              <Text className="text-gray-400 text-xs text-center px-8">
                Your PIN is encrypted and never stored in plain text
              </Text>
            </ScrollView>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
