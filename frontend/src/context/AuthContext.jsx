import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cricket_vault_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('cricket_vault_token')) {
        setUser(null);
        setLoading(false);
        return;
      }
      const me = await api.getMe();
      setUser(me);
    } catch (err) {
      console.error('Failed to authenticate token:', err);
      localStorage.removeItem('cricket_vault_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('cricket_vault_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const login = async (credentials) => {
    const data = await api.login(credentials);
    return handleAuthSuccess(data);
  };

  const register = async (playerData) => {
    const data = await api.register(playerData);
    return handleAuthSuccess(data);
  };

  const logout = () => {
    localStorage.removeItem('cricket_vault_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const updateUser = (data) => {
    setUser((prev) => (prev ? { ...prev, ...data } : data));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        role: user?.role || null,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
