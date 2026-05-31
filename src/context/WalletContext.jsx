import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);

  const fetchWallet = useCallback(async () => {
    try {
      const { data } = await api.get('/wallet/balance');
      setWallet(data);
    } catch {}
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, fetchWallet, setWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
