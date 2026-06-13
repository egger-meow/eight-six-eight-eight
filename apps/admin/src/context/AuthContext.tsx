'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setCsrfToken, getCsrfToken } from '@/lib/api';

export interface AdminUser {
  id: number;
  username: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCsrf: () => Promise<void>;
  csrfToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [csrf, setCsrf] = useState<string | null>(null);

  const refreshCsrf = async () => {
    try {
      const data = await apiFetch('/auth/csrf-token');
      if (data?.data?.csrf_token) {
        setCsrfToken(data.data.csrf_token);
        setCsrf(data.data.csrf_token);
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  };

  const fetchSession = async () => {
    try {
      setLoading(true);
      await refreshCsrf();
      const data = await apiFetch('/auth/me');
      if (data?.data) {
        setUser(data.data);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data?.data?.user) {
      setUser(data.data.user);
      if (data.data.csrf_token) {
        setCsrfToken(data.data.csrf_token);
        setCsrf(data.data.csrf_token);
      }
    } else {
      throw new Error('Login failed');
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    setUser(null);
    setCsrfToken('');
    setCsrf(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshCsrf, csrfToken: csrf || getCsrfToken() }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
