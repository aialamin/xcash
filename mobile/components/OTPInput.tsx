import { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, StyleSheet } from 'react-native';

interface Props {
  length?: number;
  onComplete: (code: string) => void;
  label?: string;
  error?: string;
}

export default function OTPInput({ length = 6, onComplete, label, error }: Props) {
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (error) {
      setCode('');
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start(() => setTimeout(() => inputRef.current?.focus(), 100));
    }
  }, [error]);

  const handleChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '').slice(0, length);
    setCode(digits);
    if (digits.length === length) {
      inputRef.current?.blur();
      setTimeout(() => onComplete(digits), 100);
    }
  };

  return (
    <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
      {label && (
        <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 4 }}>{label}</Text>
      )}

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={{ width: '100%' }}
      >
        <Animated.View style={[styles.boxRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length }).map((_, i) => {
            const filled = i < code.length;
            const active = i === code.length;
            return (
              <View
                key={i}
                style={[
                  styles.box,
                  active && styles.boxActive,
                  filled && styles.boxFilled,
                ]}
              >
                <Text style={styles.digit}>
                  {filled ? (i < code.length - 1 ? '●' : code[i]) : ''}
                </Text>
                {active && <View style={styles.cursor} />}
              </View>
            );
          })}
        </Animated.View>
      </TouchableOpacity>

      {/* Hidden input — positioned off-screen so keyboard doesn't cover content */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        caretHidden
        style={styles.hiddenInput}
        showSoftInputOnFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    width: 48,
    height: 58,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: '#166534',
    backgroundColor: '#F0FDF4',
    shadowColor: '#166534',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  boxFilled: {
    borderColor: '#4ADE80',
    backgroundColor: '#F0FDF4',
  },
  digit: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14532D',
  },
  cursor: {
    position: 'absolute',
    bottom: 8,
    width: 20,
    height: 2,
    backgroundColor: '#166534',
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: -9999, // off-screen — keyboard still appears but content stays visible
  },
});
