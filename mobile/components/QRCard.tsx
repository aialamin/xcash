import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface Props {
  phone: string;
  name: string;
  size?: number;
}

export default function QRCard({ phone, name, size = 180 }: Props) {
  const qrValue = `pocket://pay/${phone}`;

  return (
    <View style={s.card}>
      <View style={s.logoRow}>
        <Text style={s.logoText}>৳</Text>
        <Text style={s.brand}>Pocket</Text>
      </View>
      <View style={s.qrWrap}>
        <QRCode
          value={qrValue}
          size={size}
          color="#14532D"
          backgroundColor="#fff"
          logo={{ uri: '' }}
          logoSize={30}
          logoBackgroundColor="transparent"
        />
      </View>
      <Text style={s.name}>{name}</Text>
      <Text style={s.phone}>{phone}</Text>
      <Text style={s.hint}>Scan to send money instantly</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 8, borderWidth: 1, borderColor: '#F0FDF4' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  logoText: { fontSize: 20, fontWeight: '900', color: '#166534' },
  brand: { fontSize: 18, fontWeight: '900', color: '#166534', letterSpacing: 1 },
  qrWrap: { padding: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#DCFCE7' },
  name: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
  phone: { fontSize: 15, color: '#166534', fontWeight: '600', letterSpacing: 1 },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
});
