import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('xcash_token');
    const saved = localStorage.getItem('xcash_user');
    if (token && saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = async (phone, pin) => {
    const { data } = await api.post('/auth/login', { phone, pin });
    localStorage.setItem('xcash_token', data.token);
    localStorage.setItem('xcash_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    localStorage.setItem('xcash_token', data.token);
    localStorage.setItem('xcash_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('xcash_token');
    localStorage.removeItem('xcash_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
