import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Delete } from 'lucide-react-native';

interface Props { onComplete: (pin: string) => void; label?: string; }

export default function PinPad({ onComplete, label = 'Enter PIN' }: Props) {
  const [pin, setPin] = useState('');

  const press = (val: string) => {
    if (pin.length >= 6) return;
    const next = pin + val;
    setPin(next);
    if (next.length === 6) {
      setTimeout(() => { onComplete(next); setPin(''); }, 100);
    }
  };

  const del = () => setPin(p => p.slice(0, -1));
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <View className="items-center gap-6">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <View className="flex-row gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? 'bg-green-700 border-green-700' : 'border-gray-300'}`} />
        ))}
      </View>
      <View className="flex-row flex-wrap w-64 gap-3 justify-center">
        {keys.map((k, i) => (
          k === '' ? <View key={i} className="w-[72px] h-14" /> :
          k === 'del' ? (
            <TouchableOpacity key={i} onPress={del} className="w-[72px] h-14 bg-gray-100 rounded-2xl items-center justify-center">
              <Delete size={20} color="#4B5563" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity key={i} onPress={() => press(k)} className="w-[72px] h-14 bg-white rounded-2xl items-center justify-center shadow-sm">
              <Text className="text-xl font-semibold text-gray-800">{k}</Text>
            </TouchableOpacity>
          )
        ))}
      </View>
    </View>
  );
}
