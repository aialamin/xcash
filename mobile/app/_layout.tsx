import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { WalletProvider } from '../context/WalletContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <AuthProvider>
      <WalletProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="send" options={{ presentation: 'modal' }} />
          <Stack.Screen name="request" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-money" options={{ presentation: 'modal' }} />
          <Stack.Screen name="cash-out" options={{ presentation: 'modal' }} />
          <Stack.Screen name="payment" options={{ presentation: 'modal' }} />
          <Stack.Screen name="recharge" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bills" options={{ presentation: 'modal' }} />
          <Stack.Screen name="financial" options={{ presentation: 'modal' }} />
        </Stack>
      </WalletProvider>
    </AuthProvider>
    </SafeAreaProvider>
  );
}
