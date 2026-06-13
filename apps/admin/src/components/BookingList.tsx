'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, Filter } from 'lucide-react';

interface BookingListProps {
  onBookingClick: (id: string) => void;
}

export default function BookingList({ onBookingClick }: BookingListProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort: 'check_in:desc'
      });
      if (statusFilter) query.append('status', statusFilter);

      const res = await apiFetch(`/bookings?${query.toString()}`);
      if (res?.data) {
        setBookings(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '6px', flex: 1 }}>
          <Search size={18} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="搜尋房客姓名或電話..." 
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
          <option value="cancelled">已取消</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>日期</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>房型</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>房客</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>金額</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>狀態</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>載入中...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>查無訂單</td></tr>
            ) : (
              bookings.map(b => (
                <tr 
                  key={b.id} 
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                  onClick={() => onBookingClick(b.id)}
                >
                  <td style={{ padding: '1rem' }}>{b.check_in} ~ {b.check_out}</td>
                  <td style={{ padding: '1rem' }}>{b.room_id}</td>
                  <td style={{ padding: '1rem' }}>{b.guest_name}</td>
                  <td style={{ padding: '1rem' }}>NT$ {b.total_price}</td>
                  <td style={{ padding: '1rem' }}>{b.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
