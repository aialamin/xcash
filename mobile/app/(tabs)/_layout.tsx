import { Tabs, Redirect } from 'expo-router';
import { Home, ClipboardList, Gift, Bell, User } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#166534" size="large" /></View>;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#166534',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        borderTopColor: '#DCFCE7',
        height: 60 + insets.bottom,
        paddingBottom: insets.bottom + 4,
        paddingTop: 8,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <Home size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color, focused }) => <ClipboardList size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} /> }} />
      <Tabs.Screen name="rewards" options={{ title: 'Rewards', tabBarIcon: ({ color, focused }) => <Gift size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts', tabBarIcon: ({ color, focused }) => <Bell size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <User size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} /> }} />
    </Tabs>
  );
}
