import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onPress: (key: string) => void;
  onDelete: () => void;
}

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function NumPad({ onPress, onDelete }: Props) {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map(row => (
        <View key={row} style={styles.row}>
          {KEYS.slice(row * 3, row * 3 + 3).map((key, col) => {
            if (key === '') return <View key={col} style={styles.key} />;
            const isDelete = key === '⌫';
            return (
              <TouchableOpacity
                key={col}
                onPress={() => isDelete ? onDelete() : onPress(key)}
                onLongPress={() => isDelete && onDelete()}
                activeOpacity={0.6}
                style={[styles.key, isDelete && styles.deleteKey]}
              >
                <Text style={[styles.keyText, isDelete && styles.deleteText]}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
  },
  key: {
    width: 80,
    height: 56,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  deleteKey: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#14532D',
    textAlign: 'center',
  },
  deleteText: {
    fontSize: 20,
    color: '#EF4444',
    textAlign: 'center',
  },
});
