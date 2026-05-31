import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { X, PiggyBank, CreditCard, Shield, CheckCircle, TrendingUp } from 'lucide-react-native';

export default function Financial() {
  const [tab, setTab] = useState<'savings'|'loan'|'insurance'>('savings');
  const [savings, setSavings] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [form, setForm] = useState({ type: 'general', target: '', monthly: '', loanAmt: '', tenure: '6' });
  const [done, setDone] = useState('');
  const router = useRouter();

  useEffect(() => {
    api.get('/financial/savings').then(r=>setSavings(r.data)).catch(()=>{});
    api.get('/financial/loan').then(r=>setLoans(r.data)).catch(()=>{});
  }, []);

  const tabs = [
    { id: 'savings', Icon: PiggyBank, label: 'Savings' },
    { id: 'loan', Icon: CreditCard, label: 'Loan' },
    { id: 'insurance', Icon: Shield, label: 'Insurance' },
  ];

  return (
    <View className="flex-1 bg-green-50">
      <View className="flex-row items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-green-50">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 bg-green-50 rounded-full items-center justify-center"><X size={18} color="#166534" /></TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Financial Services</Text>
      </View>
      <View className="flex-row gap-2 p-4">
        {tabs.map(({ id, Icon, label }) => (
          <TouchableOpacity key={id} onPress={() => setTab(id as any)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl border-2 ${tab === id ? 'border-green-600 bg-green-50' : 'border-gray-100 bg-white'}`}>
            <Icon size={15} color={tab === id ? '#166534' : '#9CA3AF'} strokeWidth={1.8} />
            <Text className={`text-sm font-semibold ${tab === id ? 'text-green-800' : 'text-gray-500'}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
        {tab === 'savings' && (
          <>
            {savings.map(s => (
              <View key={s.id} className="bg-white rounded-2xl p-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="font-semibold text-gray-800 capitalize">{s.type} Savings</Text>
                  <View className={`px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Text className={`text-xs font-semibold ${s.status === 'active' ? 'text-green-700' : 'text-gray-500'}`}>{s.status}</Text>
                  </View>
                </View>
                <View className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <View className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, (s.current_amount / (s.target_amount || 1)) * 100)}%` }} />
                </View>
                <Text className="text-xs text-gray-500">৳{s.current_amount} / ৳{s.target_amount || '—'}</Text>
              </View>
            ))}
            {done !== 'savings' ? (
              <View className="bg-white rounded-2xl p-4 gap-3">
                <View className="flex-row items-center gap-2"><TrendingUp size={16} color="#166534" /><Text className="font-semibold text-gray-700">Open New Savings</Text></View>
                {['general','dps','goal'].map(t=>(
                  <TouchableOpacity key={t} onPress={()=>setForm({...form,type:t})} className={`py-2 px-4 rounded-xl border-2 ${form.type===t?'border-green-600 bg-green-50':'border-gray-100'}`}>
                    <Text className={`text-sm font-semibold capitalize ${form.type===t?'text-green-800':'text-gray-500'}`}>{t==='dps'?'DPS (Monthly)':t==='goal'?'Goal-based':'General'}</Text>
                  </TouchableOpacity>
                ))}
                <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-2"><Text className="text-gray-500 font-bold">৳</Text><TextInput placeholder="Target Amount" value={form.target} onChangeText={v=>setForm({...form,target:v})} keyboardType="numeric" className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF"/></View>
                <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-2"><Text className="text-gray-500 font-bold">৳</Text><TextInput placeholder="Monthly Deposit" value={form.monthly} onChangeText={v=>setForm({...form,monthly:v})} keyboardType="numeric" className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF"/></View>
                <TouchableOpacity onPress={async()=>{try{const s=await api.post('/financial/savings',{type:form.type,target_amount:Number(form.target),monthly_deposit:Number(form.monthly)});setSavings(p=>[...p,s.data]);setDone('savings');}catch{}}} className="bg-green-700 rounded-2xl py-3 items-center"><Text className="text-white font-bold">Open Account</Text></TouchableOpacity>
              </View>
            ) : <View className="flex-row items-center justify-center gap-2 bg-green-50 rounded-2xl py-4"><CheckCircle size={18} color="#16A34A"/><Text className="text-green-600 font-semibold">Savings account opened!</Text></View>}
          </>
        )}
        {tab === 'loan' && (
          <>
            {loans.map(l=>(
              <View key={l.id} className="bg-white rounded-2xl p-4">
                <View className="flex-row justify-between mb-1">
                  <Text className="font-semibold text-gray-800 text-lg">৳{l.amount}</Text>
                  <View className={`px-2 py-0.5 rounded-full ${l.status==='approved'?'bg-green-100':l.status==='pending'?'bg-yellow-100':'bg-red-100'}`}>
                    <Text className={`text-xs font-semibold ${l.status==='approved'?'text-green-700':l.status==='pending'?'text-yellow-700':'text-red-500'}`}>{l.status}</Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500">EMI: ৳{l.emi_amount}/month · {l.tenure} months</Text>
              </View>
            ))}
            {done !== 'loan' ? (
              <View className="bg-white rounded-2xl p-4 gap-3">
                <View className="flex-row items-center gap-2"><CreditCard size={16} color="#166534"/><Text className="font-semibold text-gray-700">Apply for Loan</Text></View>
                <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-2"><Text className="text-gray-500 font-bold">৳</Text><TextInput placeholder="Loan Amount" value={form.loanAmt} onChangeText={v=>setForm({...form,loanAmt:v})} keyboardType="numeric" className="py-3 flex-1 text-gray-800" placeholderTextColor="#9CA3AF"/></View>
                <View className="flex-row gap-2">{[3,6,12,18,24].map(t=>(<TouchableOpacity key={t} onPress={()=>setForm({...form,tenure:String(t)})} className={`flex-1 py-2 rounded-xl border-2 items-center ${form.tenure===String(t)?'border-green-600 bg-green-50':'border-gray-100'}`}><Text className={`text-xs font-semibold ${form.tenure===String(t)?'text-green-800':'text-gray-500'}`}>{t}m</Text></TouchableOpacity>))}</View>
                {form.loanAmt?<Text className="text-xs text-green-700 text-center bg-green-50 rounded-xl py-2">Est. EMI: ৳{Math.ceil((Number(form.loanAmt)*1.12)/Number(form.tenure))}/month</Text>:null}
                <TouchableOpacity onPress={async()=>{try{const l=await api.post('/financial/loan',{amount:Number(form.loanAmt),tenure:Number(form.tenure)});setLoans(p=>[...p,l.data]);setDone('loan');}catch{}}} className="bg-green-700 rounded-2xl py-3 items-center"><Text className="text-white font-bold">Apply Now</Text></TouchableOpacity>
              </View>
            ) : <View className="flex-row items-center justify-center gap-2 bg-green-50 rounded-2xl py-4"><CheckCircle size={18} color="#16A34A"/><Text className="text-green-600 font-semibold">Application submitted!</Text></View>}
          </>
        )}
        {tab === 'insurance' && (
          <View className="bg-white rounded-2xl p-8 items-center gap-4">
            <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center"><Shield size={32} color="#3B82F6" strokeWidth={1.5}/></View>
            <Text className="font-bold text-gray-800 text-lg">Insurance Plans</Text>
            <Text className="text-gray-500 text-sm text-center leading-6">Life, health, and accident insurance coming soon.</Text>
            <TouchableOpacity className="bg-green-50 rounded-2xl py-3 px-6"><Text className="text-green-700 font-semibold">Notify Me</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
