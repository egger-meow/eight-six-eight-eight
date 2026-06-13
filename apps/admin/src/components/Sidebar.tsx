'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BedDouble, 
  Newspaper, 
  Image as ImageIcon, 
  Settings, 
  LogOut,
  Building2,
  CalendarOff
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { name: '總覽 Dashboard', href: '/', icon: LayoutDashboard },
  { name: '訂單與行事曆', href: '/bookings', icon: CalendarDays },
  { name: '房型管理', href: '/rooms', icon: BedDouble },
  { name: '封鎖日期', href: '/blocked-dates', icon: CalendarOff },
  { name: '公告管理', href: '/news', icon: Newspaper },
  { name: '圖片管理', href: '/media', icon: ImageIcon },
  { name: '系統設定', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname.startsWith('/login')) return null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <Building2 color="var(--accent-gold)" />
        86.88 B&B
      </div>
      
      <ul className={styles.navList}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <li key={item.href} className={styles.navItem}>
              <Link href={item.href} className={`${styles.navLink} ${isActive ? styles.active : ''}`}>
                <Icon size={20} />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>

      {user && (
        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span>{user.username}</span>
          </div>
          <button onClick={logout} className={styles.logoutBtn} title="登出">
            <LogOut size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}
