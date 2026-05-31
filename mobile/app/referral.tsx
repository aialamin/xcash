import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Share, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import api from '../services/api';
import { X, Gift, Copy, Check, Users, Share2 } from 'lucide-react-native';

export default function Referral() {
  const [data, setData] = useState<any>(null);
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get('/referral').then(r => setData(r.data)).catch(() => {});
  }, []);

  const copyCode = async () => {
    if (!data?.code) return;
    await Clipboard.setStringAsync(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = () => {
    if (!data?.share_text) return;
    Share.share({ message: data.share_text, title: 'Join Pocket' });
  };

  const applyCode = async () => {
    if (!code.trim()) return;
    setApplying(true);
    try {
      const r = await api.post('/referral/apply', { code: code.trim().toUpperCase() });
      Alert.alert('🎉 Bonus Added!', r.data.message);
      setCode('');
      api.get('/referral').then(r2 => setData(r2.data));
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setApplying(false); }
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}><X size={18} color="#166534" /></TouchableOpacity>
        <Text style={s.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Hero */}
        <View style={s.hero}>
          <Gift size={40} color="#fff" />
          <Text style={s.heroTitle}>Earn ৳50 per referral!</Text>
          <Text style={s.heroSub}>Invite friends to Pocket. You both get ৳50 when they sign up.</Text>
        </View>

        {/* Your code */}
        <View style={s.codeCard}>
          <Text style={s.codeLabel}>Your Referral Code</Text>
          <View style={s.codeRow}>
            <Text style={s.code}>{data?.code ?? '...'}</Text>
            <TouchableOpacity onPress={copyCode} style={[s.copyBtn, copied && s.copyBtnDone]}>
              {copied ? <Check size={16} color="#fff" /> : <Copy size={16} color="#166534" />}
              <Text style={[s.copyBtnText, copied && { color: '#fff' }]}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={shareCode} style={s.shareBtn}>
            <Share2 size={18} color="#fff" />
            <Text style={s.shareBtnText}>Share with Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Users size={20} color="#166534" />
            <Text style={s.statNum}>{data?.total_refs ?? 0}</Text>
            <Text style={s.statLabel}>Referrals</Text>
          </View>
          <View style={s.statBox}>
            <Gift size={20} color="#F97316" />
            <Text style={s.statNum}>{data?.rewarded_refs ?? 0}</Text>
            <Text style={s.statLabel}>Rewarded</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: '#166534' }]}>৳{(data?.rewarded_refs ?? 0) * (data?.reward_per_ref ?? 50)}</Text>
            <Text style={s.statLabel}>Earned</Text>
          </View>
        </View>

        {/* Apply code */}
        <View style={s.applyCard}>
          <Text style={s.applyTitle}>Have a referral code?</Text>
          <View style={s.applyRow}>
            <TextInput
              value={code}
              onChangeText={v => setCode(v.toUpperCase())}
              placeholder="Enter code e.g. PKT254763"
              placeholderTextColor="#9CA3AF"
              style={s.applyInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity onPress={applyCode} disabled={applying || !code.trim()} style={[s.applyBtn, !code.trim() && { backgroundColor: '#E5E7EB' }]}>
              {applying ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.applyBtnText}>Apply</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* How it works */}
        <View style={s.howCard}>
          <Text style={s.howTitle}>How it works</Text>
          {[
            { n: '1', t: 'Share your code', s: 'Send your unique code to friends' },
            { n: '2', t: 'Friend signs up', s: 'They register and enter your code' },
            { n: '3', t: 'Both earn ৳50', s: 'Bonus added to both wallets instantly' },
          ].map(({ n, t, s: sub }) => (
            <View key={n} style={s.howRow}>
              <View style={s.howNum}><Text style={s.howNumText}>{n}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.howLabel}>{t}</Text>
                <Text style={s.howSub}>{sub}</Text>
              </View>
            </View>
          ))}
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
  hero: { backgroundColor: '#166534', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  heroSub: { fontSize: 13, color: '#BBF7D0', textAlign: 'center' },
  codeCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 12 },
  codeLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  code: { flex: 1, fontSize: 26, fontWeight: '900', color: '#166534', letterSpacing: 3 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  copyBtnDone: { backgroundColor: '#16A34A' },
  copyBtnText: { color: '#166534', fontWeight: '700', fontSize: 13 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#166534', borderRadius: 14, paddingVertical: 14 },
  shareBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  applyCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 12 },
  applyTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  applyRow: { flexDirection: 'row', gap: 8 },
  applyInput: { flex: 1, backgroundColor: '#F0FDF4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '700', color: '#166534', letterSpacing: 2, borderWidth: 1.5, borderColor: '#DCFCE7' },
  applyBtn: { backgroundColor: '#166534', borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  howCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 14 },
  howTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  howNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  howNumText: { fontSize: 13, fontWeight: '900', color: '#166534' },
  howLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  howSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});
