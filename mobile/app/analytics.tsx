import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BarChart, PieChart } from 'react-native-chart-kit';
import api from '../services/api';
import { X, TrendingDown, Calendar } from 'lucide-react-native';

const W = Dimensions.get('window').width - 32;

const TYPE_COLORS: Record<string, string> = {
  send_money: '#EF4444', cash_out: '#F97316', payment: '#DB2777',
  bill_pay: '#CA8A04', recharge: '#2563EB', add_money: '#16A34A', default: '#6B7280',
};
const TYPE_LABELS: Record<string, string> = {
  send_money: 'Sent', cash_out: 'Cash Out', payment: 'Payment',
  bill_pay: 'Bills', recharge: 'Recharge', add_money: 'Added',
};

export default function Analytics() {
  const [period, setPeriod] = useState<'week'|'month'|'year'>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { load(); }, [period]);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get(`/analytics/spending?period=${period}`); setData(r.data); }
    catch {}
    setLoading(false);
  };

  const pieData = (data?.by_category || [])
    .filter((c: any) => c.type !== 'add_money')
    .map((c: any) => ({
      name: TYPE_LABELS[c.type] || c.type,
      population: Number(c.total),
      color: TYPE_COLORS[c.type] || TYPE_COLORS.default,
      legendFontColor: '#374151',
      legendFontSize: 12,
    }));

  const dailyLabels = (data?.daily || []).slice(-7).map((d: any) =>
    new Date(d.day).getDate().toString()
  );
  const dailyValues = (data?.daily || []).slice(-7).map((d: any) => Number(d.total));

  const chartConfig = {
    backgroundColor: '#fff', backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff',
    color: () => '#166534', labelColor: () => '#6B7280',
    barPercentage: 0.6, decimalPlaces: 0,
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}><X size={18} color="#166534" /></TouchableOpacity>
        <Text style={s.headerTitle}>Spending Analytics</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Period selector */}
      <View style={s.periodRow}>
        {(['week','month','year'] as const).map(p => (
          <TouchableOpacity key={p} onPress={() => setPeriod(p)}
            style={[s.periodBtn, period === p && s.periodBtnActive]}>
            <Text style={[s.periodText, period === p && s.periodTextActive]}>
              {p === 'week' ? '7 Days' : p === 'month' ? '30 Days' : '1 Year'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color="#166534" size="large" style={{ marginTop: 48 }} /> : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>

          {/* Total card */}
          <View style={s.totalCard}>
            <TrendingDown size={24} color="#EF4444" />
            <View>
              <Text style={s.totalLabel}>Total Spent</Text>
              <Text style={s.totalValue}>৳{Number(data?.total_spent || 0).toFixed(0)}</Text>
            </View>
            <View style={s.periodBadge}>
              <Calendar size={12} color="#166534" />
              <Text style={s.periodBadgeText}>{period}</Text>
            </View>
          </View>

          {/* Bar chart — daily spending */}
          {dailyValues.length > 0 && (
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Daily Spending</Text>
              <BarChart
                data={{ labels: dailyLabels, datasets: [{ data: dailyValues.length > 0 ? dailyValues : [0] }] }}
                width={W} height={180} chartConfig={chartConfig}
                style={{ borderRadius: 12 }} showValuesOnTopOfBars yAxisLabel="৳" yAxisSuffix=""
                fromZero
              />
            </View>
          )}

          {/* Pie chart — by category */}
          {pieData.length > 0 && (
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>By Category</Text>
              <PieChart
                data={pieData} width={W} height={200}
                chartConfig={chartConfig}
                accessor="population" backgroundColor="transparent"
                paddingLeft="16" absolute
              />
            </View>
          )}

          {/* Category breakdown list */}
          {(data?.by_category || []).length > 0 && (
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Breakdown</Text>
              {data.by_category.map((c: any) => {
                const color = TYPE_COLORS[c.type] || TYPE_COLORS.default;
                const pct = data.total_spent > 0 ? (c.total / data.total_spent * 100).toFixed(0) : 0;
                return (
                  <View key={c.type} style={s.breakRow}>
                    <View style={[s.breakDot, { backgroundColor: color }]} />
                    <Text style={s.breakLabel}>{TYPE_LABELS[c.type] || c.type}</Text>
                    <View style={s.breakBar}>
                      <View style={[s.breakFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={[s.breakAmt, { color }]}>৳{Number(c.total).toFixed(0)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {(!data?.by_category?.length) && (
            <View style={s.empty}>
              <TrendingDown size={48} color="#DCFCE7" />
              <Text style={s.emptyText}>No spending data for this period</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DCFCE7' },
  closeBtn: { width: 36, height: 36, backgroundColor: '#F0FDF4', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  periodRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#166534', borderColor: '#166534' },
  periodText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  periodTextActive: { color: '#fff' },
  totalCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 18, padding: 18 },
  totalLabel: { fontSize: 12, color: '#6B7280' },
  totalValue: { fontSize: 28, fontWeight: '900', color: '#EF4444' },
  periodBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 'auto' },
  periodBadgeText: { fontSize: 11, color: '#166534', fontWeight: '700', textTransform: 'capitalize' },
  chartCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 12 },
  chartTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakDot: { width: 10, height: 10, borderRadius: 5 },
  breakLabel: { width: 70, fontSize: 12, color: '#374151', fontWeight: '600' },
  breakBar: { flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  breakFill: { height: 8, borderRadius: 4 },
  breakAmt: { width: 64, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
});
