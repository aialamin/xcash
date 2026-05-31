import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X, Users, Activity, MessageSquare, DollarSign, ShieldAlert, TrendingUp, Lock, Unlock } from 'lucide-react-native';

type Tab = 'stats' | 'users' | 'tickets' | 'transactions';

export default function AdminPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (user?.role !== 'admin') {
    return (
      <View style={styles.noAccess}>
        <ShieldAlert size={48} color="#EF4444" />
        <Text style={styles.noAccessText}>Admin access required</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'stats') { const r = await api.get('/admin/stats'); setStats(r.data); }
      if (tab === 'users') { const r = await api.get('/admin/users'); setUsers(r.data); }
      if (tab === 'tickets') { const r = await api.get('/admin/tickets'); setTickets(r.data); }
      if (tab === 'transactions') { const r = await api.get('/admin/transactions'); setTxs(r.data); }
    } catch {}
    setLoading(false);
  };

  const toggleBlock = async (u: any) => {
    const newStatus = u.status === 'blocked' ? 'active' : 'blocked';
    Alert.alert(`${newStatus === 'blocked' ? 'Block' : 'Unblock'} User`, `${u.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: newStatus === 'blocked' ? 'destructive' : 'default', onPress: async () => {
        await api.patch(`/admin/users/${u.id}/status`, { status: newStatus });
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: newStatus } : x));
      }},
    ]);
  };

  const tabs = [
    { id: 'stats', Icon: TrendingUp, label: 'Stats' },
    { id: 'users', Icon: Users, label: 'Users' },
    { id: 'tickets', Icon: MessageSquare, label: 'Support' },
    { id: 'transactions', Icon: Activity, label: 'Txns' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={18} color="#166534" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map(({ id, Icon, label }) => (
          <TouchableOpacity key={id} onPress={() => setTab(id as Tab)} style={[styles.tabBtn, tab === id && styles.tabBtnActive]}>
            <Icon size={16} color={tab === id ? '#166534' : '#9CA3AF'} />
            <Text style={[styles.tabLabel, tab === id && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color="#166534" size="large" style={{ marginTop: 40 }} /> : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>

          {/* STATS */}
          {tab === 'stats' && stats && (
            <>
              {[
                { label: 'Total Users', value: stats.total_users, color: '#166534', icon: Users },
                { label: 'Active Users', value: stats.active_users, color: '#0284C7', icon: Activity },
                { label: 'Total Transactions', value: stats.total_tx, color: '#D97706', icon: DollarSign },
                { label: 'Total Volume', value: `৳${Number(stats.total_volume).toFixed(0)}`, color: '#7C3AED', icon: TrendingUp },
                { label: 'Open Tickets', value: stats.open_tickets, color: '#EF4444', icon: MessageSquare },
              ].map(({ label, value, color, icon: Icon }) => (
                <View key={label} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                    <Icon size={22} color={color} />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>{label}</Text>
                    <Text style={[styles.statValue, { color }]}>{value}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* USERS */}
          {tab === 'users' && users.map(u => (
            <View key={u.id} style={styles.card}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{u.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userPhone}>{u.phone} · {u.role}</Text>
                <Text style={styles.userBalance}>৳{(u.balance ?? u.wallet?.balance ?? 0).toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleBlock(u)} style={[styles.blockBtn, u.status === 'blocked' && styles.unblockBtn]}>
                {u.status === 'blocked' ? <Unlock size={16} color="#166534" /> : <Lock size={16} color="#EF4444" />}
              </TouchableOpacity>
            </View>
          ))}

          {/* SUPPORT TICKETS */}
          {tab === 'tickets' && tickets.map(t => (
            <View key={t.id} style={styles.card}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.userName}>{t.subject}</Text>
                <Text style={styles.userPhone}>{t.user?.name} · {t.category}</Text>
                <Text style={styles.userPhone}>{t.messages?.length ?? 0} messages</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: t.status === 'open' ? '#EF4444' : t.status === 'in_progress' ? '#F59E0B' : '#166534' }]} />
            </View>
          ))}

          {/* TRANSACTIONS */}
          {tab === 'transactions' && txs.map(t => (
            <View key={t.id} style={styles.card}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.userName}>{t.type?.replace('_',' ').toUpperCase()}</Text>
                <Text style={styles.userPhone}>{t.sender?.name ?? '—'} → {t.receiver?.name ?? '—'}</Text>
                <Text style={styles.userPhone}>{t.ref}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#166534' }}>৳{t.amount}</Text>
                {t.fee > 0 && <Text style={{ fontSize: 11, color: '#EF4444' }}>Fee ৳{t.fee}</Text>}
                {t.disputed && <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: '700' }}>DISPUTED</Text>}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  noAccess: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  noAccessText: { fontSize: 18, fontWeight: '700', color: '#EF4444' },
  backBtn: { backgroundColor: '#166534', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DCFCE7' },
  closeBtn: { width: 36, height: 36, backgroundColor: '#F0FDF4', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  adminBadge: { backgroundColor: '#166534', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  adminBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#166534' },
  tabLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  tabLabelActive: { color: '#166534' },
  statCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  statIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 13, color: '#6B7280' },
  statValue: { fontSize: 22, fontWeight: '800' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  userAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 18, fontWeight: '800', color: '#166534' },
  userName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  userPhone: { fontSize: 12, color: '#6B7280' },
  userBalance: { fontSize: 13, fontWeight: '600', color: '#166534' },
  blockBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  unblockBtn: { backgroundColor: '#DCFCE7' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
