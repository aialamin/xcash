import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X, Plus, Send, MessageCircle, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';

const CATEGORIES = ['Payment Issue', 'Account Problem', 'Technical Error', 'Fraud Report', 'Other'];

function TicketBadge({ status }: { status: string }) {
  const colors: any = { open: ['#FEF9C3','#854D0E'], in_progress: ['#DBEAFE','#1E40AF'], resolved: ['#DCFCE7','#166534'], closed: ['#F3F4F6','#6B7280'] };
  const [bg, text] = colors[status] || colors.closed;
  return <View style={[styles.badge, { backgroundColor: bg }]}><Text style={[styles.badgeText, { color: text }]}>{status.replace('_',' ')}</Text></View>;
}

export default function Support() {
  const [view, setView] = useState<'list'|'new'|'chat'>('list');
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ subject: '', category: CATEGORIES[0], message: '', priority: 'normal' });
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try { const r = await api.get('/support/tickets'); setTickets(r.data); } catch {}
  };

  const openTicket = async (t: any) => {
    try { const r = await api.get(`/support/tickets/${t.id}`); setSelected(r.data); setView('chat'); } catch {}
  };

  const createTicket = async () => {
    if (!form.subject || !form.message) return;
    setLoading(true);
    try {
      await api.post('/support/tickets', form);
      await loadTickets();
      setView('list');
      setForm({ subject: '', category: CATEGORIES[0], message: '', priority: 'normal' });
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    try {
      const r = await api.post(`/support/tickets/${selected.id}/reply`, { message: reply });
      setSelected((s: any) => ({ ...s, messages: [...(s.messages||[]), r.data] }));
      setReply('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {}
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => view === 'list' ? router.back() : setView('list')} style={styles.closeBtn}>
            <X size={18} color="#166534" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {view === 'list' ? 'Support Center' : view === 'new' ? 'New Ticket' : selected?.subject?.slice(0,30)}
          </Text>
          {view === 'list' && (
            <TouchableOpacity onPress={() => setView('new')} style={styles.newBtn}>
              <Plus size={18} color="#166534" />
            </TouchableOpacity>
          )}
          {view !== 'list' && <View style={{ width: 36 }} />}
        </View>

        {/* LIST */}
        {view === 'list' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {/* Banner */}
            <View style={styles.banner}>
              <MessageCircle size={28} color="#166534" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>24/7 Support</Text>
                <Text style={styles.bannerSub}>Average response time: 2 hours</Text>
              </View>
            </View>

            {tickets.length === 0 ? (
              <View style={styles.empty}>
                <MessageCircle size={48} color="#D1D5DB" strokeWidth={1.2} />
                <Text style={styles.emptyText}>No support tickets yet</Text>
                <TouchableOpacity onPress={() => setView('new')} style={styles.newTicketBtn}>
                  <Text style={styles.newTicketBtnText}>Create New Ticket</Text>
                </TouchableOpacity>
              </View>
            ) : (
              tickets.map(t => (
                <TouchableOpacity key={t.id} onPress={() => openTicket(t)} style={styles.ticketCard}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.ticketSubject}>{t.subject}</Text>
                    <Text style={styles.ticketCategory}>{t.category}</Text>
                    <Text style={styles.ticketDate}>{new Date(t.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <TicketBadge status={t.status} />
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        {/* NEW TICKET */}
        {view === 'new' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} onPress={() => setForm(f => ({ ...f, category: c }))}
                    style={[styles.catChip, form.category === c && styles.catChipActive]}>
                    <Text style={[styles.catChipText, form.category === c && styles.catChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['low','normal','high','urgent'].map(p => (
                <TouchableOpacity key={p} onPress={() => setForm(f => ({ ...f, priority: p }))}
                  style={[styles.catChip, form.priority === p && styles.catChipActive, { flex: 1, justifyContent: 'center' }]}>
                  <Text style={[styles.catChipText, form.priority === p && styles.catChipTextActive, { textAlign: 'center', textTransform: 'capitalize' }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Subject *</Text>
            <TextInput value={form.subject} onChangeText={v => setForm(f => ({ ...f, subject: v }))}
              placeholder="Briefly describe your issue" placeholderTextColor="#9CA3AF"
              style={styles.inputField} />

            <Text style={styles.label}>Message *</Text>
            <TextInput value={form.message} onChangeText={v => setForm(f => ({ ...f, message: v }))}
              placeholder="Describe your issue in detail..." placeholderTextColor="#9CA3AF"
              style={[styles.inputField, { height: 120, textAlignVertical: 'top', paddingTop: 12 }]}
              multiline />

            <TouchableOpacity onPress={createTicket} disabled={loading || !form.subject || !form.message}
              style={[styles.submitBtn, (!form.subject || !form.message) && { backgroundColor: '#E5E7EB' }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Ticket</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* CHAT */}
        {view === 'chat' && selected && (
          <>
            <View style={styles.chatStatus}>
              <TicketBadge status={selected.status} />
              <Text style={styles.chatCategory}>{selected.category}</Text>
              {selected.status === 'open' || selected.status === 'in_progress' ? (
                <TouchableOpacity onPress={async () => {
                  await api.patch(`/support/tickets/${selected.id}/close`, {});
                  setSelected((s: any) => ({ ...s, status: 'closed' }));
                }} style={styles.closeTicketBtn}>
                  <Text style={styles.closeTicketText}>Close</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <ScrollView ref={scrollRef} style={{ flex: 1, padding: 16 }} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
              {(selected.messages || []).map((m: any) => (
                <View key={m.id} style={[styles.bubble, m.is_admin ? styles.bubbleAdmin : styles.bubbleUser]}>
                  {m.is_admin && <Text style={styles.bubbleSender}>Support Team</Text>}
                  <Text style={[styles.bubbleText, m.is_admin && styles.bubbleTextAdmin]}>{m.message}</Text>
                  <Text style={styles.bubbleTime}>{new Date(m.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</Text>
                </View>
              ))}
            </ScrollView>
            {(selected.status === 'open' || selected.status === 'in_progress') && (
              <View style={styles.replyBar}>
                <TextInput value={reply} onChangeText={setReply}
                  placeholder="Type a message..." placeholderTextColor="#9CA3AF"
                  style={styles.replyInput} multiline />
                <TouchableOpacity onPress={sendReply} style={styles.sendBtn}>
                  <Send size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DCFCE7' },
  closeBtn: { width: 36, height: 36, backgroundColor: '#F0FDF4', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  newBtn: { width: 36, height: 36, backgroundColor: '#F0FDF4', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#DCFCE7', borderRadius: 16, padding: 16 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#166534' },
  bannerSub: { fontSize: 12, color: '#4ADE80', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
  newTicketBtn: { backgroundColor: '#166534', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  newTicketBtnText: { color: '#fff', fontWeight: '700' },
  ticketCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ticketSubject: { fontSize: 14, fontWeight: '700', color: '#111827' },
  ticketCategory: { fontSize: 12, color: '#166534' },
  ticketDate: { fontSize: 11, color: '#9CA3AF' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  inputField: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#111827' },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  catChipActive: { borderColor: '#166534', backgroundColor: '#DCFCE7' },
  catChipText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  catChipTextActive: { color: '#166534' },
  submitBtn: { backgroundColor: '#166534', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chatStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  chatCategory: { flex: 1, fontSize: 12, color: '#6B7280' },
  closeTicketBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444' },
  closeTicketText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, gap: 4 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#166534', borderBottomRightRadius: 4 },
  bubbleAdmin: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: '#166534' },
  bubbleText: { fontSize: 14, color: '#fff' },
  bubbleTextAdmin: { color: '#111827' },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.6)', alignSelf: 'flex-end' },
  replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  replyInput: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#111827', maxHeight: 100 },
  sendBtn: { width: 42, height: 42, backgroundColor: '#166534', borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
