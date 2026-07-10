'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isLoginPage = pathname.startsWith('/login');

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace('/login');
    }
  }, [isLoginPage, loading, router, user]);

  useEffect(() => {
    if (!loading && user && isLoginPage) {
      router.replace('/');
    }
  }, [isLoginPage, loading, router, user]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="auth-loading-screen">
        <div>驗證登入狀態...</div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
