import { ScrollView, View, Text } from 'react-native';
import { Smartphone, Store, Zap, Users, CreditCard, UtensilsCrossed, Tag } from 'lucide-react-native';

const offers = [
  { Icon: Smartphone,      title: 'Recharge Cashback',  desc: '10% cashback on GP recharge above ৳99',     tag: 'CASHBACK', bg: '#EFF6FF', color: '#2563EB', tagBg: '#DCFCE7', tagColor: '#16A34A' },
  { Icon: Store,           title: 'Merchant Offer',      desc: '৳20 off at partner shops',                  tag: 'OFFER',    bg: '#F5F3FF', color: '#7C3AED', tagBg: '#F3E8FF', tagColor: '#7C3AED' },
  { Icon: Zap,             title: 'Electricity Bill',    desc: 'Free fee on electricity bill',               tag: 'FREE FEE', bg: '#FEFCE8', color: '#CA8A04', tagBg: '#FEF9C3', tagColor: '#854D0E' },
  { Icon: Users,           title: 'Refer & Earn',        desc: 'Earn ৳50 per referral',                     tag: 'REFERRAL', bg: '#EFF6FF', color: '#2563EB', tagBg: '#DBEAFE', tagColor: '#1D4ED8' },
  { Icon: CreditCard,      title: 'Card Cashback',       desc: '2% cashback on card add money',              tag: 'CASHBACK', bg: '#F0FDFA', color: '#0D9488', tagBg: '#DCFCE7', tagColor: '#16A34A' },
  { Icon: UtensilsCrossed, title: 'Food Partners',       desc: 'Up to 30% off at Pathao Food',              tag: 'DISCOUNT', bg: '#FFF7ED', color: '#F97316', tagBg: '#FFEDD5', tagColor: '#C2410C' },
];

export default function Rewards() {
  return (
    <ScrollView className="flex-1 bg-violet-50" showsVerticalScrollIndicator={false}>
      <View className="px-4 pt-14 pb-3 bg-white border-b border-violet-50">
        <Text className="text-xl font-bold text-gray-800">Rewards & Offers</Text>
      </View>
      <View className="p-4 pb-24 gap-3">
        <View className="rounded-2xl p-5" style={{ backgroundColor: '#7C3AED' }}>
          <View className="flex-row items-center gap-2 mb-1">
            <Tag size={14} color="#C4B5FD" />
            <Text className="text-xs text-violet-200">Total Cashback Earned</Text>
          </View>
          <Text className="text-3xl font-extrabold text-white">৳0.00</Text>
          <Text className="text-xs text-violet-200 mt-1">Start transacting to earn!</Text>
        </View>
        <Text className="text-sm font-semibold text-gray-600 mt-1">Available Offers</Text>
        {offers.map((o, i) => (
          <View key={i} className="bg-white rounded-2xl p-4 flex-row gap-3">
            <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: o.bg }}>
              <o.Icon size={22} color={o.color} strokeWidth={1.8} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-0.5 flex-wrap">
                <Text className="font-semibold text-gray-800 text-sm">{o.title}</Text>
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: o.tagBg }}>
                  <Text className="text-xs font-semibold" style={{ color: o.tagColor }}>{o.tag}</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500">{o.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
