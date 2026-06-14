'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './dashboard.module.css';
import {
  DoorOpen,
  CalendarClock,
  CircleDollarSign,
  AlertCircle,
  ClipboardCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  today_check_ins: number;
  today_check_outs: number;
  current_occupancy: number;
  total_rooms: number;
  occupancy_rate: number;
  upcoming_bookings_7d: number;
  pending_bookings: number;
  monthly_revenue: number;
  unprocessed_webhooks: number;
}

interface RecentBooking {
  id: number;
  guest_name: string;
  room?: { name_zh: string };
  room_id: number;
  check_in: string;
  check_out: string;
  status: string;
  source: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          apiFetch('/dashboard/stats'),
          apiFetch('/dashboard/recent-bookings?limit=8')
        ]);

        if (statsRes?.data) setStats(statsRes.data);
        if (bookingsRes?.data) setRecentBookings(bookingsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string, color: string }> = {
      pending: { label: '待確認', color: 'badge-amber' },
      confirmed: { label: '已確認', color: 'badge-green' },
      cancelled: { label: '已取消', color: 'badge-red' },
      checked_in: { label: '已入住', color: 'badge-blue' },
      checked_out: { label: '已退房', color: 'badge-gray' },
      no_show: { label: '未入住', color: 'badge-red' },
    };
    const s = map[status] || { label: status, color: 'badge-gray' };
    return <span className={`${styles.badge} ${styles[s.color]}`}>{s.label}</span>;
  };

  const getSourceBadge = (source: string) => {
    const map: Record<string, string> = {
      website: '官網',
      phone: '電話',
      line: 'LINE',
      ota: 'OTA平台',
      walk_in: '現場',
      admin: '後台新增',
    };
    return <span className={`${styles.badge} ${styles['badge-gray']}`}>{map[source] || source}</span>;
  };

  if (loading) return <div>載入中...</div>;

  return (
    <div>
      <div className={styles.dashboardGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <DoorOpen size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>今日入住 / 退房</h3>
            <p>{stats?.today_check_ins || 0} / {stats?.today_check_outs || 0}</p>
          </div>
        </div>

        <div className={styles.statCard} style={{ borderLeftColor: stats?.pending_bookings ? 'var(--status-amber)' : 'var(--accent-gold)' }}>
          <div className={styles.statIcon} style={{ color: stats?.pending_bookings ? 'var(--status-amber)' : 'var(--accent-gold)', backgroundColor: stats?.pending_bookings ? 'rgba(245, 158, 11, 0.1)' : '' }}>
            <AlertCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>待確認訂單</h3>
            <p>{stats?.pending_bookings || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <CalendarClock size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>未來7天訂單</h3>
            <p>{stats?.upcoming_bookings_7d || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <CircleDollarSign size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>本月營收</h3>
            <p>NT$ {stats?.monthly_revenue?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className="card">
          <div className={styles.cardHeader}>
            <h2>近期訂單</h2>
            <Link href="/bookings" className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
              查看全部
            </Link>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>房客</th>
                  <th>房型</th>
                  <th>日期</th>
                  <th>狀態</th>
                  <th>來源</th>
                  <th>處理</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length > 0 ? (
                  recentBookings.map(b => (
                    <tr
                      key={b.id}
                      className={styles.clickableRow}
                      onClick={() => router.push('/bookings?booking=' + b.id)}
                    >
                      <td>{b.guest_name}</td>
                      <td>{b.room?.name_zh || `房型 #${b.room_id}`}</td>
                      <td>{b.check_in} ~ {b.check_out}</td>
                      <td>{getStatusBadge(b.status)}</td>
                      <td>{getSourceBadge(b.source)}</td>
                      <td>
                        <Link
                          href={'/bookings?booking=' + b.id}
                          className={styles.rowAction}
                          onClick={(event: React.MouseEvent<HTMLAnchorElement>) => event.stopPropagation()}
                        >
                          <ClipboardCheck size={15} />
                          查看
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      尚無近期訂單
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className={styles.cardHeader}>
            <h2>快速功能</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link href="/blocked-dates" className="btn btn-secondary" style={{ width: '100%' }}>
              設定封鎖日期
            </Link>
            <Link href="/news" className="btn btn-secondary" style={{ width: '100%' }}>
              更新首頁公告
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
