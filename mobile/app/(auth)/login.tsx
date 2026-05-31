import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import PinPad from '../../components/PinPad';
import * as LocalAuthentication from 'expo-local-authentication';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseAuth } from '../../services/firebase';
import app from '../../services/firebase';
import { Phone, ChevronLeft, AlertCircle, Fingerprint, ShieldCheck } from 'lucide-react-native';

type Step = 'phone' | 'otp' | 'pin';

export default function Login() {
  const [step, setStep]         = useState<Step>('phone');
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const recaptchaVerifier       = useRef<any>(null);
  const { login }               = useAuth();
  const router                  = useRouter();

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled   = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    })();
  }, []);

  // Step 1: Send OTP via Firebase
  const sendOTP = async () => {
    if (phone.length < 11) { setError('Enter a valid phone number'); return; }
    setLoading(true); setError('');
    try {
      // Format to E.164 for Bangladesh: 01XXXXXXXXX → +8801XXXXXXXXX
      const e164 = phone.startsWith('+') ? phone : `+88${phone}`;
      const provider = new PhoneAuthProvider(firebaseAuth);
      const id = await provider.verifyPhoneNumber(e164, recaptchaVerifier.current);
      setVerificationId(id);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // Step 2: Verify OTP
  const verifyOTP = async () => {
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(firebaseAuth, credential);
      // OTP verified — now get Firebase ID token and go to PIN
      setStep('pin');
    } catch (err: any) {
      setError('Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // Step 3: PIN → XCash JWT (backend verifies Firebase token + PIN)
  const handlePin = async (pin: string) => {
    setLoading(true);
    try {
      const firebaseToken = await firebaseAuth.currentUser?.getIdToken();
      await login(phone, pin, firebaseToken);
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
    if (result.success && phone.length >= 11) setStep('otp');
    else if (result.success) setError('Enter your phone number first');
  };

  return (
    <View className="flex-1 bg-violet-700">
      {/* Firebase reCAPTCHA — invisible verifier */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={true}
      />

      <View className="items-center pt-16 pb-8">
        <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center shadow-xl mb-4">
          <Text className="text-3xl font-black text-violet-700">X</Text>
        </View>
        <Text className="text-3xl font-extrabold text-white">XCash</Text>
        <Text className="text-violet-200 text-sm mt-1">Secure · Fast · Yours</Text>
      </View>

      <View className="flex-1 bg-white rounded-t-3xl p-6">

        {/* STEP 1 — Phone */}
        {step === 'phone' && (
          <View className="gap-5">
            <Text className="text-xl font-bold text-gray-800">Enter your phone</Text>
            <View className="flex-row items-center border border-gray-200 rounded-2xl px-4 gap-3">
              <Phone size={18} color="#9CA3AF" />
              <TextInput
                placeholder="01XXXXXXXXX" value={phone} onChangeText={setPhone}
                keyboardType="phone-pad" className="py-3 flex-1 text-lg text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {error ? (
              <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2">
                <AlertCircle size={15} color="#EF4444" />
                <Text className="text-red-500 text-sm flex-1">{error}</Text>
              </View>
            ) : null}
            <TouchableOpacity onPress={sendOTP} disabled={loading} className="bg-violet-600 rounded-2xl py-3 items-center">
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Send OTP</Text>}
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

        {/* STEP 2 — OTP */}
        {step === 'otp' && (
          <ScrollView contentContainerClassName="gap-5">
            <TouchableOpacity onPress={() => { setStep('phone'); setError(''); }} className="self-start flex-row items-center gap-1">
              <ChevronLeft size={16} color="#7C3AED" />
              <Text className="text-violet-600 text-sm">Back</Text>
            </TouchableOpacity>
            <View className="items-center gap-2">
              <View className="w-14 h-14 bg-violet-100 rounded-full items-center justify-center">
                <ShieldCheck size={28} color="#7C3AED" />
              </View>
              <Text className="text-xl font-bold text-gray-800">Verify your number</Text>
              <Text className="text-gray-500 text-sm text-center">
                OTP sent to <Text className="font-bold text-gray-700">+88{phone}</Text>
              </Text>
            </View>
            <View className="flex-row items-center border border-gray-200 rounded-2xl px-4 gap-3">
              <TextInput
                placeholder="6-digit OTP" value={otp} onChangeText={setOtp}
                keyboardType="number-pad" maxLength={6}
                className="py-3 flex-1 text-xl text-center tracking-widest text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {error ? (
              <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2">
                <AlertCircle size={15} color="#EF4444" />
                <Text className="text-red-500 text-sm flex-1">{error}</Text>
              </View>
            ) : null}
            <TouchableOpacity onPress={verifyOTP} disabled={loading} className="bg-violet-600 rounded-2xl py-3 items-center">
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Verify OTP</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={sendOTP} disabled={loading}>
              <Text className="text-center text-violet-600 text-sm">Resend OTP</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* STEP 3 — PIN (2nd factor) */}
        {step === 'pin' && (
          <ScrollView contentContainerClassName="items-center gap-4">
            <View className="flex-row items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full self-center">
              <ShieldCheck size={14} color="#16A34A" />
              <Text className="text-green-700 text-xs font-semibold">Phone verified via Firebase</Text>
            </View>
            <Text className="text-gray-600 text-sm">Now enter your XCash PIN</Text>
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
