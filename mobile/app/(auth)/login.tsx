import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import PinPad from '../../components/PinPad';
import * as LocalAuthentication from 'expo-local-authentication';
import { Phone, ChevronLeft, AlertCircle, Fingerprint } from 'lucide-react-native';

export default function Login() {
  const [step, setStep]     = useState<'phone' | 'pin'>('phone');
  const [phone, setPhone]   = useState('');
  const [error, setError]   = useState('');
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
    setLoading(true);
    try {
      await login(phone, pin);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to log in to XCash',
      cancelLabel: 'Use PIN instead',
    });
    if (result.success && phone.length >= 11) {
      setStep('pin');
    } else if (result.success) {
      setError('Enter your phone number first');
    }
  };

  return (
    <View className="flex-1 bg-violet-700">
      <View className="items-center pt-16 pb-8">
        <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center shadow-xl mb-4">
          <Text className="text-3xl font-black text-violet-700">X</Text>
        </View>
        <Text className="text-3xl font-extrabold text-white">XCash</Text>
        <Text className="text-violet-200 text-sm mt-1">Secure · Fast · Yours</Text>
      </View>

      <View className="flex-1 bg-white rounded-t-3xl p-6">

        {step === 'phone' && (
          <View className="gap-5">
            <Text className="text-xl font-bold text-gray-800">Enter your phone</Text>
            <View className="flex-row items-center border border-gray-200 rounded-2xl px-4 gap-3">
              <Phone size={18} color="#9CA3AF" />
              <TextInput
                placeholder="01XXXXXXXXX" value={phone} onChangeText={setPhone}
                keyboardType="phone-pad" className="py-3 flex-1 text-lg text-gray-800"
                placeholderTextColor="#9CA3AF" autoFocus
              />
            </View>
            {error ? (
              <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2">
                <AlertCircle size={15} color="#EF4444" />
                <Text className="text-red-500 text-sm flex-1">{error}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              onPress={() => { if (phone.length >= 11) { setStep('pin'); setError(''); } }}
              className="bg-violet-600 rounded-2xl py-3 items-center"
            >
              <Text className="text-white font-bold text-lg">Continue</Text>
            </TouchableOpacity>
            {biometricAvailable && (
              <TouchableOpacity onPress={handleBiometric} className="flex-row items-center justify-center gap-2 border-2 border-violet-100 rounded-2xl py-3">
                <Fingerprint size={20} color="#7C3AED" />
                <Text className="text-violet-600 font-semibold">Use Biometric</Text>
              </TouchableOpacity>
            )}
            <View className="flex-row justify-center gap-1">
              <Text className="text-gray-500 text-sm">No account?</Text>
              <Link href="/(auth)/register"><Text className="text-violet-600 font-semibold text-sm">Register</Text></Link>
            </View>
          </View>
        )}

        {step === 'pin' && (
          <ScrollView contentContainerClassName="items-center gap-4">
            <TouchableOpacity onPress={() => { setStep('phone'); setError(''); }} className="self-start flex-row items-center gap-1">
              <ChevronLeft size={16} color="#7C3AED" />
              <Text className="text-violet-600 text-sm">Back</Text>
            </TouchableOpacity>
            <Text className="text-gray-600 text-sm">
              Logging in as <Text className="font-bold text-gray-800">{phone}</Text>
            </Text>
            {error ? (
              <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2 w-full">
                <AlertCircle size={15} color="#EF4444" />
                <Text className="text-red-500 text-sm flex-1">{error}</Text>
              </View>
            ) : null}
            {loading
              ? <ActivityIndicator size="large" color="#7C3AED" className="mt-8" />
              : <PinPad onComplete={handlePin} label="Enter your 6-digit PIN" />
            }
          </ScrollView>
        )}
      </View>
    </View>
  );
}
