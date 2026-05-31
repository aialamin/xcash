import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import NumPad from '../../components/NumPad';
import { User, Phone, CreditCard, Mail, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react-native';

type Step = 'info' | 'pin' | 'confirm';

function PinDisplay({ value }: { value: string }) {
  return (
    <View style={styles.pinRow}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[styles.pinBox, i < value.length && styles.pinBoxFilled]}>
          {i < value.length && <Text style={styles.pinDot}>●</Text>}
        </View>
      ))}
    </View>
  );
}

export default function Register() {
  const [step, setStep]           = useState<Step>('info');
  const [form, setForm]           = useState({ name: '', phone: '', nid: '', email: '' });
  const [pin, setPin]             = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const stepIndex = ['info','pin','confirm'].indexOf(step);

  const handleConfirm = async (cp: string) => {
    if (cp !== pin) { setError('PINs do not match. Try again.'); setConfirmPin(''); return; }
    setLoading(true);
    try {
      await register({ ...form, pin });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setStep('info');
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'name',  Icon: User,       label: 'Full Name',    placeholder: 'Your full name',    keyboard: 'default' as const,       required: true },
    { key: 'phone', Icon: Phone,      label: 'Phone',        placeholder: '01XXXXXXXXX',       keyboard: 'phone-pad' as const,     required: true },
    { key: 'nid',   Icon: CreditCard, label: 'National ID',  placeholder: 'NID number',        keyboard: 'number-pad' as const,    required: false },
    { key: 'email', Icon: Mail,       label: 'Email',        placeholder: 'optional',          keyboard: 'email-address' as const, required: false },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>Create Account</Text>
        <View style={styles.progressRow}>
          {['info','pin','confirm'].map((s, i) => (
            <View key={s} style={[styles.progressBar, i <= stepIndex && styles.progressBarActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step {stepIndex + 1} of 3</Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {step !== 'info' && (
            <TouchableOpacity onPress={() => { setStep(step === 'confirm' ? 'pin' : 'info'); setError(''); }} style={styles.backBtn}>
              <ChevronLeft size={20} color="#166534" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}

          {/* STEP 1 — Info */}
          {step === 'info' && (
            <>
              <Text style={styles.title}>Your details</Text>
              {fields.map(({ key, Icon, label, placeholder, keyboard, required }) => (
                <View key={key}>
                  <View style={styles.fieldLabel}>
                    <Text style={styles.labelText}>{label}</Text>
                    {required && <Text style={styles.required}>*</Text>}
                  </View>
                  <View style={[styles.inputBox, (form as any)[key] && styles.inputBoxActive]}>
                    <Icon size={18} color={(form as any)[key] ? '#166534' : '#9CA3AF'} />
                    <TextInput
                      placeholder={placeholder}
                      value={(form as any)[key]}
                      onChangeText={v => setForm({ ...form, [key]: v })}
                      keyboardType={keyboard}
                      style={styles.input}
                      placeholderTextColor="#9CA3AF"
                    />
                    {(form as any)[key] ? <CheckCircle size={16} color="#10B981" /> : null}
                  </View>
                </View>
              ))}
              {error ? <View style={styles.errorBox}><AlertCircle size={14} color="#EF4444" /><Text style={styles.errorText}>{error}</Text></View> : null}
              <TouchableOpacity
                onPress={() => { if (form.name && form.phone) { setStep('pin'); setError(''); } }}
                disabled={!form.name || !form.phone}
                style={[styles.btn, { backgroundColor: form.name && form.phone ? '#166534' : '#E5E7EB' }]}
              >
                <Text style={[styles.btnText, { color: form.name && form.phone ? '#fff' : '#9CA3AF' }]}>Continue →</Text>
              </TouchableOpacity>
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Have an account? </Text>
                <Link href="/(auth)/login"><Text style={styles.loginLink}>Login</Text></Link>
              </View>
            </>
          )}

          {/* STEP 2 — Set PIN */}
          {step === 'pin' && (
            <View style={{ alignItems: 'center', gap: 16 }}>
              <Text style={styles.title}>Choose a 6-digit PIN</Text>
              <Text style={styles.subtitle}>Never share your PIN with anyone</Text>
              <PinDisplay value={pin} />
              <NumPad
                onPress={k => {
                  if (pin.length < 6) {
                    const next = pin + k;
                    setPin(next);
                    if (next.length === 6) { setStep('confirm'); }
                  }
                }}
                onDelete={() => setPin(p => p.slice(0, -1))}
              />
              <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>💡 PIN Tips</Text>
                <Text style={styles.tipText}>• Avoid sequential digits (e.g. 123456)</Text>
                <Text style={styles.tipText}>• Use a mix you can remember</Text>
                <Text style={styles.tipText}>• Never write your PIN down</Text>
              </View>
            </View>
          )}

          {/* STEP 3 — Confirm PIN */}
          {step === 'confirm' && (
            <View style={{ alignItems: 'center', gap: 16 }}>
              <Text style={styles.title}>Confirm your PIN</Text>
              <Text style={styles.subtitle}>Enter the same PIN again</Text>
              {error ? <View style={styles.errorBox}><AlertCircle size={14} color="#EF4444" /><Text style={styles.errorText}>{error}</Text></View> : null}
              {loading ? (
                <Text style={{ color: '#166534', fontSize: 16, paddingVertical: 20 }}>Creating your account...</Text>
              ) : (
                <>
                  <PinDisplay value={confirmPin} />
                  <NumPad
                    onPress={k => {
                      if (confirmPin.length < 6) {
                        const next = confirmPin + k;
                        setConfirmPin(next);
                        if (next.length === 6) handleConfirm(next);
                      }
                    }}
                    onDelete={() => setConfirmPin(p => p.slice(0, -1))}
                  />
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#166534' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  brand: { fontSize: 26, fontWeight: '800', color: '#fff' },
  progressRow: { flexDirection: 'row', gap: 8 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressBarActive: { backgroundColor: '#fff' },
  stepLabel: { color: '#BBF7D0', fontSize: 12 },
  body: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backText: { color: '#166534', fontWeight: '600', fontSize: 14 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', alignSelf: 'flex-start' },
  subtitle: { fontSize: 14, color: '#6B7280', alignSelf: 'flex-start' },
  fieldLabel: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  labelText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  required: { color: '#EF4444', fontSize: 12 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#F3F4F6', borderRadius: 14, paddingHorizontal: 14, gap: 10 },
  inputBoxActive: { borderColor: '#166534' },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#111827' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, width: '100%' },
  errorText: { color: '#EF4444', fontSize: 13, flex: 1 },
  btn: { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  btnText: { fontWeight: '700', fontSize: 16 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: '#6B7280', fontSize: 14 },
  loginLink: { color: '#166534', fontWeight: '700', fontSize: 14 },
  pinRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  pinBox: { width: 46, height: 56, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  pinBoxFilled: { borderColor: '#166534', backgroundColor: '#DCFCE7' },
  pinDot: { fontSize: 18, color: '#14532D', fontWeight: '700' },
  tipBox: { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, width: '100%', gap: 4 },
  tipTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  tipText: { fontSize: 12, color: '#B45309' },
});
