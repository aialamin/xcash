import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import QRScanner from '../components/QRScanner';
import api from '../services/api';
import { X, QrCode, Star, Search, ChevronRight, ChevronLeft, Check, UserPlus } from 'lucide-react-native';

type Step = 'contact' | 'amount' | 'confirm' | 'done';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function SendMoney() {
  const [step, setStep]           = useState<Step>('contact');
  const [phone, setPhone]         = useState('');
  const [receiver, setReceiver]   = useState<any>(null);
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');
  const [favourites, setFavourites] = useState<any[]>([]);
  const [search, setSearch]       = useState('');
  const [showQR, setShowQR]       = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sending, setSending]     = useState(false);
  const [success, setSuccess]     = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    api.get('/beneficiaries').then(r => setFavourites(r.data)).catch(() => {});
  }, []);

  // 3-second countdown on confirm step
  useEffect(() => {
    if (sending) {
      setCountdown(3);
      progressAnim.setValue(0);
      Animated.timing(progressAnim, { toValue: 1, duration: 3000, useNativeDriver: false }).start();
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            executeSend();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sending]);

  const cancelSend = () => {
    clearInterval(timerRef.current!);
    progressAnim.stopAnimation();
    setSending(false);
    setCountdown(3);
  };

  const executeSend = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/transfer/send', {
        phone: receiver.phone,
        amount: Number(amount),
        note,
      });
      setSending(false);
      setSuccess(data.transaction);
      setStep('done');
    } catch (err: any) {
      setSending(false);
      setError(err.message);
      setStep('confirm');
    } finally { setLoading(false); }
  };

  const lookupReceiver = async (p: string) => {
    if (p.length < 11) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/transfer/verify-receiver', { phone: p });
      setReceiver(data);
      setStep('amount');
    } catch (err: any) {
      setError('No Pocket account found for this number');
    } finally { setLoading(false); }
  };

  const selectContact = (c: any) => {
    setPhone(c.phone);
    setReceiver({ name: c.name, phone: c.phone });
    setStep('amount');
  };

  const addToFavourites = async () => {
    if (!receiver) return;
    try {
      await api.post('/beneficiaries', { name: receiver.name, phone: receiver.phone });
      const r = await api.get('/beneficiaries');
      setFavourites(r.data);
    } catch {}
  };

  const fee = Number(amount) > 100 ? 5 : 0;
  const total = Number(amount) + fee;

  const filtered = search
    ? favourites.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()) || f.phone?.includes(search))
    : favourites;

  // ── STEP 1: CONTACT ──
  if (step === 'contact') return (
    <View style={s.root}>
      <QRScanner visible={showQR} onScan={p => { setPhone(p); setShowQR(false); lookupReceiver(p); }} onClose={() => setShowQR(false)} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}><X size={20} color="#166534" /></TouchableOpacity>
        <Text style={s.headerTitle}>Send Money</Text>
        <TouchableOpacity onPress={() => setShowQR(true)} style={s.iconBtn}><QrCode size={20} color="#166534" /></TouchableOpacity>
      </View>

      {/* Phone input */}
      <View style={s.phoneRow}>
        <View style={s.phoneBox}>
          <Text style={s.phonePre}>BD |</Text>
          <TextInput
            value={phone}
            onChangeText={v => { setPhone(v.replace(/[^0-9]/g, '').slice(0, 11)); setError(''); }}
            placeholder="01X XXXX XXXX"
            placeholderTextColor="#86EFAC"
            keyboardType="phone-pad"
            style={s.phoneInput}
            maxLength={11}
          />
          {phone.length === 11 && (
            <TouchableOpacity onPress={() => lookupReceiver(phone)} disabled={loading} style={s.goBtn}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <ChevronRight size={20} color="#fff" />}
            </TouchableOpacity>
          )}
        </View>
        {error ? <Text style={s.errorText}>{error}</Text> : null}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {/* Search favourites */}
        {favourites.length > 0 && (
          <>
            <View style={s.searchBox}>
              <Search size={16} color="#9CA3AF" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search contacts..."
                placeholderTextColor="#9CA3AF"
                style={s.searchInput}
              />
            </View>

            <Text style={s.sectionTitle}>⭐ Favourites</Text>
            {filtered.map(f => (
              <TouchableOpacity key={f.id} onPress={() => selectContact(f)} style={s.contactCard}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{f.name?.[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.contactName}>{f.name}</Text>
                  <Text style={s.contactPhone}>{f.phone}</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {favourites.length === 0 && (
          <View style={s.emptyContacts}>
            <Star size={40} color="#DCFCE7" />
            <Text style={s.emptyText}>No favourites yet</Text>
            <Text style={s.emptySubText}>Send money to someone and add them as a favourite</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // ── STEP 2: AMOUNT ──
  if (step === 'amount') return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => { setStep('contact'); setAmount(''); }} style={s.iconBtn}><ChevronLeft size={20} color="#166534" /></TouchableOpacity>
        <Text style={s.headerTitle}>Enter Amount</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Recipient */}
      <View style={s.recipientBar}>
        <View style={s.avatar}><Text style={s.avatarText}>{receiver?.name?.[0]?.toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.recipientName}>{receiver?.name}</Text>
          <Text style={s.recipientPhone}>{receiver?.phone}</Text>
        </View>
        <TouchableOpacity onPress={addToFavourites} style={s.starBtn}>
          <Star size={18} color="#166534" fill={favourites.some(f => f.phone === receiver?.phone) ? '#166534' : 'none'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Big amount display */}
        <View style={s.amountDisplay}>
          <Text style={s.amountCurrency}>৳</Text>
          <TextInput
            value={amount}
            onChangeText={v => setAmount(v.replace(/[^0-9]/g, ''))}
            placeholder="0"
            placeholderTextColor="#DCFCE7"
            keyboardType="number-pad"
            style={s.amountInput}
            autoFocus
          />
        </View>

        {/* Quick amounts */}
        <View style={s.quickRow}>
          {QUICK_AMOUNTS.map(q => (
            <TouchableOpacity key={q} onPress={() => setAmount(String(q))} style={[s.quickBtn, amount === String(q) && s.quickBtnActive]}>
              <Text style={[s.quickBtnText, amount === String(q) && s.quickBtnTextActive]}>৳{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a note (optional)"
          placeholderTextColor="#9CA3AF"
          style={s.noteInput}
        />

        {/* Fee info */}
        {Number(amount) > 0 && (
          <View style={s.feeCard}>
            <View style={s.feeRow}><Text style={s.feeLabel}>Amount</Text><Text style={s.feeValue}>৳{amount}</Text></View>
            <View style={s.feeRow}><Text style={s.feeLabel}>Fee</Text><Text style={[s.feeValue, { color: fee > 0 ? '#F59E0B' : '#166534' }]}>{fee > 0 ? `৳${fee}` : 'Free'}</Text></View>
            <View style={[s.feeRow, { borderTopWidth: 1, borderTopColor: '#DCFCE7', paddingTop: 8, marginTop: 4 }]}>
              <Text style={[s.feeLabel, { fontWeight: '700' }]}>Total</Text>
              <Text style={[s.feeValue, { fontWeight: '800', color: '#166534' }]}>৳{total}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => { if (Number(amount) >= 10) setStep('confirm'); }}
          disabled={Number(amount) < 10}
          style={[s.mainBtn, Number(amount) < 10 && s.mainBtnDisabled]}
        >
          <Text style={s.mainBtnText}>Continue →</Text>
        </TouchableOpacity>
        {Number(amount) > 0 && Number(amount) < 10 && <Text style={s.minText}>Minimum amount is ৳10</Text>}
      </ScrollView>
    </View>
  );

  // ── STEP 3: CONFIRM (3-second send) ──
  if (step === 'confirm') return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => { cancelSend(); setStep('amount'); }} style={s.iconBtn}><ChevronLeft size={20} color="#166534" /></TouchableOpacity>
        <Text style={s.headerTitle}>Confirm & Send</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1 }}>
        {/* Summary card */}
        <View style={s.summaryCard}>
          <View style={s.summaryAvatar}><Text style={s.summaryAvatarText}>{receiver?.name?.[0]?.toUpperCase()}</Text></View>
          <Text style={s.summaryName}>{receiver?.name}</Text>
          <Text style={s.summaryPhone}>{receiver?.phone}</Text>
          <View style={s.summaryDivider} />
          <Text style={s.summaryAmount}>৳{amount}</Text>
          {fee > 0 && <Text style={s.summaryFee}>+ ৳{fee} fee</Text>}
          {note ? <Text style={s.summaryNote}>"{note}"</Text> : null}
        </View>

        {error ? <View style={s.errorBox}><Text style={s.errorBoxText}>{error}</Text></View> : null}

        {/* 3-second send button */}
        {!sending ? (
          <TouchableOpacity onPress={() => setSending(true)} style={s.sendBtn} activeOpacity={0.85}>
            <Text style={s.sendBtnText}>TAP TO SEND  ৳{total}</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.countdownWrap}>
            {/* Progress bar */}
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, { width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }) }]} />
            </View>
            <Text style={s.countdownText}>Sending in {countdown}s...</Text>
            <TouchableOpacity onPress={cancelSend} style={s.cancelBtn}>
              <Text style={s.cancelBtnText}>✕  Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && <ActivityIndicator color="#166534" size="large" />}

        <Text style={s.noPin}>🔒 No PIN required · Secured by Pocket</Text>
      </ScrollView>
    </View>
  );

  // ── DONE ──
  return (
    <View style={s.root}>
      <View style={[s.doneWrap]}>
        <View style={s.doneCircle}><Check size={40} color="#fff" strokeWidth={3} /></View>
        <Text style={s.doneTitle}>Money Sent!</Text>
        <Text style={s.doneSub}>৳{amount} sent to {receiver?.name}</Text>
        {success?.ref && <Text style={s.doneRef}>{success.ref}</Text>}
        <TouchableOpacity onPress={() => router.back()} style={s.doneBtn}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setStep('contact'); setPhone(''); setAmount(''); setReceiver(null); setSuccess(null); }} style={s.sendAgainBtn}>
          <Text style={s.sendAgainText}>Send Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const G = '#166534';
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DCFCE7' },
  iconBtn: { width: 36, height: 36, backgroundColor: '#F0FDF4', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

  phoneRow: { backgroundColor: G, padding: 20, gap: 8 },
  phoneBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingLeft: 16, paddingRight: 6, paddingVertical: 4 },
  phonePre: { color: '#86EFAC', fontWeight: '800', fontSize: 15, marginRight: 8 },
  phoneInput: { flex: 1, fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: 2, paddingVertical: 14 },
  goBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#FCA5A5', fontSize: 13 },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginVertical: 12, borderWidth: 1, borderColor: '#DCFCE7' },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: G },
  contactName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  contactPhone: { fontSize: 12, color: '#6B7280' },
  emptyContacts: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#9CA3AF' },
  emptySubText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32 },

  recipientBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: G, paddingHorizontal: 20, paddingVertical: 14 },
  recipientName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  recipientPhone: { fontSize: 12, color: '#86EFAC' },
  starBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  amountDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: G, borderRadius: 24, paddingVertical: 24, paddingHorizontal: 20 },
  amountCurrency: { fontSize: 36, fontWeight: '900', color: '#86EFAC', marginRight: 8 },
  amountInput: { fontSize: 52, fontWeight: '900', color: '#fff', minWidth: 80, textAlign: 'center' },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#DCFCE7', backgroundColor: '#fff' },
  quickBtnActive: { backgroundColor: G, borderColor: G },
  quickBtnText: { fontSize: 13, fontWeight: '700', color: '#166534' },
  quickBtnTextActive: { color: '#fff' },

  noteInput: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },

  feeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: '#DCFCE7' },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: 13, color: '#6B7280' },
  feeValue: { fontSize: 13, fontWeight: '600', color: '#111827' },

  mainBtn: { backgroundColor: G, borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: G, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  mainBtnDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0 },
  mainBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  minText: { textAlign: 'center', color: '#EF4444', fontSize: 12 },

  summaryCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#DCFCE7' },
  summaryAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  summaryAvatarText: { fontSize: 28, fontWeight: '900', color: G },
  summaryName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  summaryPhone: { fontSize: 13, color: '#6B7280' },
  summaryDivider: { width: '100%', height: 1, backgroundColor: '#F0FDF4', marginVertical: 8 },
  summaryAmount: { fontSize: 40, fontWeight: '900', color: G },
  summaryFee: { fontSize: 13, color: '#F59E0B' },
  summaryNote: { fontSize: 13, color: '#6B7280', fontStyle: 'italic' },

  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12 },
  errorBoxText: { color: '#EF4444', fontSize: 13 },

  sendBtn: { backgroundColor: G, borderRadius: 20, paddingVertical: 20, alignItems: 'center', shadowColor: G, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  sendBtnText: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },

  countdownWrap: { gap: 12, alignItems: 'center' },
  progressTrack: { width: '100%', height: 8, backgroundColor: '#DCFCE7', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: G, borderRadius: 4 },
  countdownText: { fontSize: 16, fontWeight: '700', color: G },
  cancelBtn: { backgroundColor: '#FEF2F2', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12, borderWidth: 1, borderColor: '#FCA5A5' },
  cancelBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },

  noPin: { textAlign: 'center', color: '#9CA3AF', fontSize: 12 },

  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  doneCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: G, alignItems: 'center', justifyContent: 'center', shadowColor: G, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  doneTitle: { fontSize: 26, fontWeight: '900', color: '#111827' },
  doneSub: { fontSize: 15, color: '#6B7280' },
  doneRef: { fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' },
  doneBtn: { backgroundColor: G, borderRadius: 18, paddingVertical: 15, paddingHorizontal: 40, marginTop: 8, shadowColor: G, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  sendAgainBtn: { paddingVertical: 12 },
  sendAgainText: { color: G, fontWeight: '700', fontSize: 14 },
});
