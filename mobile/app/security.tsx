import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import NumPad from '../components/NumPad';
import api from '../services/api';
import { X, Lock, Shield, Smartphone, Clock, ChevronRight, AlertTriangle } from 'lucide-react-native';

type View2 = 'menu' | 'change-pin-old' | 'change-pin-new' | 'history';

export default function Security() {
  const [view, setView] = useState<View2>('menu');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [frozen, setFrozen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.status === 'frozen') setFrozen(true);
  }, [user]);

  const handleFreezeToggle = async (val: boolean) => {
    Alert.alert(
      val ? 'Freeze Account?' : 'Unfreeze Account?',
      val ? 'No transactions can be made while frozen.' : 'Your account will be active again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: async () => {
          try {
            await api.patch('/wallet/freeze', { freeze: val });
            setFrozen(val);
            Alert.alert(val ? '🔒 Account Frozen' : '🔓 Account Active', val ? 'Account frozen successfully.' : 'Account unfrozen.');
          } catch (e: any) { Alert.alert('Error', e.message); }
        }},
      ]
    );
  };

  const submitChangePIN = async () => {
    setLoading(true);
    try {
      await api.post('/auth/change-pin', { current_pin: oldPin, new_pin: newPin });
      Alert.alert('✅ PIN Changed', 'Your PIN has been updated successfully.');
      setView('menu'); setOldPin(''); setNewPin('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setOldPin(''); setNewPin(''); setView('change-pin-old');
    } finally { setLoading(false); }
  };

  const loadHistory = async () => {
    const r = await api.get('/auth/login-history');
    setHistory(r.data);
    setView('history');
  };

  // ── CHANGE PIN: Old ──
  if (view === 'change-pin-old') return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => { setView('menu'); setOldPin(''); }} style={s.closeBtn}><X size={18} color="#166534" /></TouchableOpacity>
        <Text style={s.headerTitle}>Current PIN</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.pinScreen}>
        <View style={s.shieldWrap}><Lock size={28} color="#166534" /></View>
        <Text style={s.pinTitle}>Enter current PIN</Text>
        <View style={s.dotsRow}>
          {Array.from({length:6}).map((_,i) => <View key={i} style={[s.dot, i < oldPin.length && s.dotOn]} />)}
        </View>
        <NumPad
          onPress={k => { if (oldPin.length < 6) { const n = oldPin+k; setOldPin(n); if (n.length===6) setView('change-pin-new'); }}}
          onDelete={() => setOldPin(p => p.slice(0,-1))}
        />
      </View>
    </View>
  );

  // ── CHANGE PIN: New ──
  if (view === 'change-pin-new') return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => { setView('change-pin-old'); setNewPin(''); }} style={s.closeBtn}><X size={18} color="#166534" /></TouchableOpacity>
        <Text style={s.headerTitle}>New PIN</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.pinScreen}>
        <View style={s.shieldWrap}><Lock size={28} color="#166534" /></View>
        <Text style={s.pinTitle}>Enter new PIN</Text>
        <Text style={s.pinSub}>Choose a strong 6-digit PIN</Text>
        <View style={s.dotsRow}>
          {Array.from({length:6}).map((_,i) => <View key={i} style={[s.dot, i < newPin.length && s.dotOn]} />)}
        </View>
        {loading ? <ActivityIndicator color="#166534" size="large" /> : (
          <NumPad
            onPress={k => { if (newPin.length < 6) { const n = newPin+k; setNewPin(n); if (n.length===6) submitChangePIN(); }}}
            onDelete={() => setNewPin(p => p.slice(0,-1))}
          />
        )}
      </View>
    </View>
  );

  // ── LOGIN HISTORY ──
  if (view === 'history') return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => setView('menu')} style={s.closeBtn}><X size={18} color="#166534" /></TouchableOpacity>
        <Text style={s.headerTitle}>Login History</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {history.length === 0 ? <Text style={{ textAlign:'center', color:'#9CA3AF', marginTop: 40 }}>No history yet</Text> : history.map(h => (
          <View key={h.id} style={s.histCard}>
            <View style={[s.histDot, { backgroundColor: h.status === 'success' ? '#16A34A' : '#EF4444' }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.histDevice}>{h.device_id || 'Unknown device'}</Text>
              <Text style={s.histDate}>{new Date(h.created_at).toLocaleString()}</Text>
            </View>
            <Text style={[s.histStatus, { color: h.status === 'success' ? '#16A34A' : '#EF4444' }]}>{h.status}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // ── MENU ──
  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}><X size={18} color="#166534" /></TouchableOpacity>
        <Text style={s.headerTitle}>Security Settings</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>

        <View style={s.card}>
          <TouchableOpacity onPress={() => setView('change-pin-old')} style={s.menuRow}>
            <View style={[s.menuIcon, { backgroundColor: '#DCFCE7' }]}><Lock size={20} color="#166534" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Change PIN</Text>
              <Text style={s.menuSub}>Update your 6-digit security PIN</Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={[s.menuRow, { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
            <View style={[s.menuIcon, { backgroundColor: frozen ? '#FEF2F2' : '#DCFCE7' }]}>
              <Shield size={20} color={frozen ? '#EF4444' : '#166534'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Freeze Account</Text>
              <Text style={s.menuSub}>{frozen ? '⚠️ Account is frozen' : 'Temporarily lock all transactions'}</Text>
            </View>
            <Switch value={frozen} onValueChange={handleFreezeToggle} trackColor={{ true: '#EF4444', false: '#DCFCE7' }} thumbColor="#fff" />
          </View>

          <TouchableOpacity onPress={loadHistory} style={[s.menuRow, { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
            <View style={[s.menuIcon, { backgroundColor: '#EFF6FF' }]}><Clock size={20} color="#2563EB" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Login History</Text>
              <Text style={s.menuSub}>View recent account access</Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={[s.menuRow, { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
            <View style={[s.menuIcon, { backgroundColor: '#F5F3FF' }]}><Smartphone size={20} color="#7C3AED" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Trusted Devices</Text>
              <Text style={s.menuSub}>1 device registered</Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={s.tipCard}>
          <AlertTriangle size={16} color="#D97706" />
          <Text style={s.tipText}>Pocket will never ask for your PIN via call or SMS. Report suspicious activity immediately.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DCFCE7' },
  closeBtn: { width: 36, height: 36, backgroundColor: '#F0FDF4', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  menuIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  menuSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  tipCard: { flexDirection: 'row', gap: 10, backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FDE68A' },
  tipText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  pinScreen: { flex: 1, alignItems: 'center', paddingTop: 32, paddingHorizontal: 24, gap: 16 },
  shieldWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  pinTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  pinSub: { fontSize: 13, color: '#6B7280' },
  dotsRow: { flexDirection: 'row', gap: 12 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#DCFCE7', borderWidth: 1.5, borderColor: '#86EFAC' },
  dotOn: { backgroundColor: '#166534', borderColor: '#166534' },
  histCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  histDot: { width: 10, height: 10, borderRadius: 5 },
  histDevice: { fontSize: 13, fontWeight: '600', color: '#111827' },
  histDate: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  histStatus: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
});
