import { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';

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
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (error) {
      // Shake animation on error
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const handleChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '').slice(0, length);
    setCode(digits);
    if (digits.length === length) {
      inputRef.current?.blur();
      onComplete(digits);
    }
  };

  return (
    <View className="items-center gap-4 w-full">
      {label && <Text className="text-gray-500 text-sm">{label}</Text>}

      <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} className="w-full">
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }} className="flex-row justify-center gap-3">
          {Array.from({ length }).map((_, i) => {
            const filled = i < code.length;
            const active = i === code.length;
            return (
              <View key={i} className={`w-12 h-14 rounded-2xl items-center justify-center border-2 ${
                active ? 'border-violet-500 bg-violet-50' :
                filled ? 'border-violet-300 bg-violet-50' :
                'border-gray-200 bg-gray-50'
              }`}
                style={active ? { shadowColor: '#7C3AED', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 } : {}}>
                <Text className={`text-2xl font-bold ${filled ? 'text-violet-700' : 'text-transparent'}`}>
                  {filled ? (i === code.length - 1 ? code[i] : '●') : ''}
                </Text>
                {active && <View className="absolute bottom-2 w-5 h-0.5 bg-violet-500 rounded-full" />}
              </View>
            );
          })}
        </Animated.View>
      </TouchableOpacity>

      {/* Hidden real input */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        className="absolute opacity-0 w-1 h-1"
        caretHidden
      />
    </View>
  );
}
