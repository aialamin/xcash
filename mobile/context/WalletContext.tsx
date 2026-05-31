import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '../services/api';

interface Wallet { id: string; balance: number; currency: string; }
interface WalletContextType { wallet: Wallet | null; fetchWallet: () => Promise<void>; }

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      const { data } = await api.get('/wallet/balance');
      setWallet(data);
    } catch {}
  }, []);

  return <WalletContext.Provider value={{ wallet, fetchWallet }}>{children}</WalletContext.Provider>;
}

export const useWallet = () => useContext(WalletContext);
