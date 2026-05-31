import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import NumPad from '../../components/NumPad';
import * as LocalAuthentication from 'expo-local-authentication';
import { ChevronLeft, Fingerprint, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react-native';

type Step = 'phone' | 'pin';

export default function Login() {
  const [step, setStep]           = useState<Step>('phone');
  const [phone, setPhone]         = useState('');
  const [pin, setPin]             = useState('');
  const [showPin, setShowPin]     = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [biometric, setBiometric] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { login } = useAuth();
  const router    = useRouter();

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(h =>
      h && LocalAuthentication.isEnrolledAsync().then(e => setBiometric(e))
    );
  }, []);

  useEffect(() => {
    if (step === 'phone') setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  const handlePinKey = async (k: string) => {
    const next = pin + k;
    setPin(next);
    if (next.length === 6) {
      setLoading(true); setError('');
      try {
        await login(phone, next);
        router.replace('/(tabs)');
      } catch (err: any) {
        setError(err.message || 'Incorrect PIN');
        setPin('');
      } finally { setLoading(false); }
    }
  };

  const handleBiometric = async () => {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Verify your identity' });
    if (r.success && phone.length >= 11) setStep('pin');
    else if (r.success) setError('Enter phone number first');
  };

  // ── PIN SCREEN — full screen, no scroll ──
  if (step === 'pin') {
    return (
      <View style={s.pinScreen}>
        {/* Header */}
        <View style={s.pinTop}>
          <TouchableOpacity onPress={() => { setStep('phone'); setPin(''); setError(''); }} style={s.backBtn}>
            <ChevronLeft size={20} color="#fff" />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
          <View style={s.pinBrand}>
            <Text style={s.pinBrandText}>Pocket</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* Identity */}
        <View style={s.pinMid}>
          <View style={s.shieldRing}>
            <ShieldCheck size={32} color="#166534" />
          </View>
          <Text style={s.pinTitle}>Enter PIN</Text>
          <Text style={s.pinPhone}>{phone}</Text>

          {/* PIN boxes */}
          <View style={s.pinRow}>
            {Array.from({ length: 6 }).map((_, i) => {
              const filled = i < pin.length;
              const active = i === pin.length;
              return (
                <View key={i} style={[s.pinBox, filled && s.pinBoxFilled, active && s.pinBoxActive]}>
                  {filled && <Text style={s.pinDot}>{showPin ? pin[i] : '●'}</Text>}
                  {active && <View style={s.cursor} />}
                </View>
              );
            })}
          </View>

          <TouchableOpacity onPress={() => setShowPin(v => !v)} style={s.showRow}>
            {showPin ? <EyeOff size={13} color="#6B7280" /> : <Eye size={13} color="#6B7280" />}
            <Text style={s.showText}>{showPin ? 'Hide' : 'Show'} PIN</Text>
          </TouchableOpacity>

          {error ? (
            <View style={s.errorBox}>
              <AlertCircle size={13} color="#EF4444" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
          {loading && <Text style={s.loadingText}>Verifying...</Text>}
        </View>

        {/* NumPad — centered at bottom */}
        <View style={s.pinPad}>
          <NumPad onPress={handlePinKey} onDelete={() => setPin(p => p.slice(0, -1))} />
          <Text style={s.secureNote}>🔒 End-to-end encrypted</Text>
        </View>
      </View>
    );
  }

  // ── PHONE SCREEN ──
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={s.root}>
        <View style={s.header}>
          {/* Logotype — icon + name side by side */}
          <View style={s.logoTypeRow}>
            <Image
              source={require('../../assets/logo.png')}
              style={s.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={s.taglineMain}>Faster, Secure & Free{'\n'}Money Exchanging</Text>
        </View>

        <ScrollView style={s.card} contentContainerStyle={s.cardContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: 8 }}>
            <Text style={s.stepTitle}>Welcome back</Text>
            <Text style={s.stepSub}>Enter your registered phone number</Text>
          </View>

          <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={[s.phoneWrap, phone.length > 0 && s.phoneWrapActive]}>
            <View style={s.prefixBox}>
              <Text style={s.prefixText}>BD</Text>
              <Text style={s.prefixSep}>|</Text>
            </View>
            <TextInput
              ref={inputRef}
              value={phone}
              onChangeText={v => { setPhone(v.replace(/[^0-9]/g, '').slice(0, 11)); setError(''); }}
              keyboardType="phone-pad"
              placeholder="01X XXXX XXXX"
              placeholderTextColor="#86EFAC"
              style={s.phoneInput}
              maxLength={11}
              returnKeyType="next"
              onSubmitEditing={() => { if (phone.length >= 11) { setStep('pin'); setError(''); } }}
            />
            {phone.length === 11 && (
              <View style={s.checkCircle}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={s.dotsRow}>
            {Array.from({ length: 11 }).map((_, i) => (
              <View key={i} style={[s.dot, i < phone.length && s.dotOn]} />
            ))}
          </View>

          {error ? (
            <View style={s.errorBox}>
              <AlertCircle size={14} color="#EF4444" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => { if (phone.length >= 11) { setStep('pin'); setError(''); } }}
            disabled={phone.length < 11}
            style={[s.mainBtn, phone.length < 11 && s.mainBtnDisabled]}
          >
            <Text style={[s.mainBtnText, phone.length < 11 && s.mainBtnTextDisabled]}>Continue  →</Text>
          </TouchableOpacity>

          {biometric && (
            <TouchableOpacity onPress={handleBiometric} style={s.bioBtn}>
              <Fingerprint size={18} color="#166534" />
              <Text style={s.bioBtnText}>Use Biometrics</Text>
            </TouchableOpacity>
          )}

          <View style={s.regRow}>
            <Text style={s.regText}>New here? </Text>
            <Link href="/(auth)/register"><Text style={s.regLink}>Create account</Text></Link>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const G = '#166534';
const GL = '#DCFCE7';

const s = StyleSheet.create({
  // ── PIN screen ──
  pinScreen: { flex: 1, backgroundColor: '#fff' },
  pinTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8, backgroundColor: G },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 60 },
  backText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  pinBrand: {},
  pinBrandText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  pinMid: { alignItems: 'center', paddingTop: 28, paddingHorizontal: 24, gap: 10, backgroundColor: G, paddingBottom: 32 },
  shieldRing: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  pinTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  pinPhone: { fontSize: 14, color: '#86EFAC' },
  pinRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  pinBox: { width: 46, height: 54, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  pinBoxFilled: { borderColor: '#86EFAC', backgroundColor: 'rgba(255,255,255,0.2)' },
  pinBoxActive: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.25)', shadowColor: '#fff', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  pinDot: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cursor: { width: 2, height: 20, backgroundColor: '#fff', borderRadius: 1, position: 'absolute' },
  showRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  showText: { color: '#86EFAC', fontSize: 12 },
  pinPad: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, gap: 12 },
  secureNote: { textAlign: 'center', color: '#9CA3AF', fontSize: 11 },
  loadingText: { color: '#86EFAC', fontWeight: '600', fontSize: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, width: '100%' },
  errorText: { color: '#FCA5A5', fontSize: 13, flex: 1 },

  // ── Phone screen ──
  root: { flex: 1, backgroundColor: '#14532D' },
  header: { alignItems: 'center', paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24 },
  logoTypeRow: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  logoImage: { width: 260, height: 100 },
  taglineMain: { fontSize: 14, color: '#BBF7D0', fontWeight: '400', textAlign: 'center', marginTop: 12, lineHeight: 22, letterSpacing: 0.3 },
  card: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  cardContent: { padding: 28, gap: 18 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  stepSub: { fontSize: 14, color: '#6B7280', marginTop: 3 },
  phoneWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 20, borderWidth: 2, borderColor: GL, paddingLeft: 6, paddingRight: 14 },
  phoneWrapActive: { borderColor: G, backgroundColor: '#F0FDF4' },
  prefixBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 18 },
  prefixText: { fontSize: 13, fontWeight: '800', color: G, letterSpacing: 1 },
  prefixSep: { color: '#86EFAC', fontSize: 18, fontWeight: '200' },
  phoneInput: { flex: 1, fontSize: 22, fontWeight: '700', color: '#111827', letterSpacing: 2, paddingVertical: 18 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GL },
  dotOn: { backgroundColor: G },
  mainBtn: { backgroundColor: G, borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: G, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  mainBtnDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0, elevation: 0 },
  mainBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  mainBtnTextDisabled: { color: '#9CA3AF' },
  bioBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: GL },
  bioBtnText: { color: G, fontWeight: '600' },
  regRow: { flexDirection: 'row', justifyContent: 'center' },
  regText: { color: '#9CA3AF', fontSize: 14 },
  regLink: { color: G, fontWeight: '700', fontSize: 14 },
});
