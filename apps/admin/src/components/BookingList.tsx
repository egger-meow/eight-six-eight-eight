'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { Search } from 'lucide-react';

interface BookingListProps {
  refreshKey: number;
  onBookingClick: (id: number) => void;
}

const statusLabels: Record<string, string> = {
  pending: '待確認',
  confirmed: '已確認',
  checked_in: '已入住',
  checked_out: '已退房',
  cancelled: '已取消',
  no_show: '未入住',
};

export default function BookingList({ refreshKey, onBookingClick }: BookingListProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/bookings?page=1&per_page=100');
        setBookings(res?.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [refreshKey]);

  const visibleBookings = useMemo(() => {
    const now = new Date();
    const q = search.trim().toLowerCase();
    return bookings
      .filter(b => !statusFilter || b.status === statusFilter)
      .filter(b => !q || [b.guest_name, b.guest_phone, b.room?.name_zh].some((value) => String(value || '').toLowerCase().includes(q)))
      .sort((a, b) => {
        const aDiff = Math.abs(new Date(a.check_in).getTime() - now.getTime());
        const bDiff = Math.abs(new Date(b.check_in).getTime() - now.getTime());
        return aDiff - bDiff;
      });
  }, [bookings, search, statusFilter]);

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '6px', flex: '1 1 260px' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="搜尋房客姓名、電話或房型..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
          />
        </div>
        <select
          className="input-field"
          style={{ width: '150px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">所有狀態</option>
          <option value="pending">待確認</option>
          <option value="confirmed">已確認</option>
          <option value="checked_in">已入住</option>
          <option value="checked_out">已退房</option>
          <option value="cancelled">已取消</option>
          <option value="no_show">未入住</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>入住日期</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>房型</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>房客</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>金額</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>狀態</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>載入中...</td></tr>
            ) : visibleBookings.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>查無訂單</td></tr>
            ) : (
              visibleBookings.map(b => (
                <tr
                  key={b.id}
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                  onClick={() => onBookingClick(b.id)}
                >
                  <td style={{ padding: '1rem' }}>{b.check_in} ~ {b.check_out}</td>
                  <td style={{ padding: '1rem' }}>{b.room?.name_zh || `房型 #${b.room_id}`}</td>
                  <td style={{ padding: '1rem' }}>{b.guest_name}<br /><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{b.guest_phone}</span></td>
                  <td style={{ padding: '1rem' }}>NT$ {(b.total_price || 0).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>{statusLabels[b.status] || b.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
