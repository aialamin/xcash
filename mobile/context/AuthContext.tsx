import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User { id: string; name: string; phone: string; role: string; }
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, pin: string, firebaseToken?: string) => Promise<void>;
  register: (form: any, firebaseToken?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY = 'Pocket_token';
const USER_KEY  = 'Pocket_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const userStr = await SecureStore.getItemAsync(USER_KEY);
        if (userStr) setUser(JSON.parse(userStr));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = async (phone: string, pin: string, firebaseToken?: string) => {
    const endpoint = firebaseToken ? '/auth/firebase-login' : '/auth/login';
    const payload  = firebaseToken ? { phone, pin, firebase_token: firebaseToken } : { phone, pin };
    const { data } = await api.post(endpoint, payload);
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (form: any, firebaseToken?: string) => {
    const payload = firebaseToken ? { ...form, firebase_token: firebaseToken } : form;
    const { data } = await api.post('/auth/register', payload);
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
