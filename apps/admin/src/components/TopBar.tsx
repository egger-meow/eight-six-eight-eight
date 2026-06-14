'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import styles from './TopBar.module.css';

const routeTitles: Record<string, string> = {
  '/': '總覽',
  '/bookings': '訂單與行事曆',
  '/blocked-dates': '封鎖日期',
  '/news': '公告管理',
  '/media': '圖片管理',
  '/settings': '系統設定',
};

export default function TopBar() {
  const pathname = usePathname();
  if (pathname.startsWith('/login')) return null;

  // Find the matching title
  const getTitle = () => {
    if (routeTitles[pathname]) return routeTitles[pathname];
    const baseRoute = Object.keys(routeTitles).find(r => r !== '/' && pathname.startsWith(r));
    return baseRoute ? routeTitles[baseRoute] : '管理後台';
  };

  const today = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <header className={styles.topBar}>
      <h1 className={styles.title}>{getTitle()}</h1>
      
      <div className={styles.actions}>
        <div className={styles.date}>{today}</div>
      </div>
    </header>
  );
}
