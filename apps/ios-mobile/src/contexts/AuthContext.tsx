import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        const response = await apiClient.get('/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = response.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    setUser(userData);
  }

  async function register(email: string, password: string, firstName: string, lastName: string) {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });
    const { user: userData, accessToken, refreshToken } = response.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    setUser(userData);
  }

  async function logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore errors
    }

    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
