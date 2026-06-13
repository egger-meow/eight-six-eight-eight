'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';

export default function BlockedDatesPage() {
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });

  const fetchBlockedDates = async () => {
    try {
      const res = await apiFetch('/blocked-dates');
      if (res?.data) setBlockedDates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/blocked-dates', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          room_id: null // null means all rooms are blocked
        }),
      });
      setIsModalOpen(false);
      setFormData({ start_date: '', end_date: '', reason: '' });
      fetchBlockedDates();
    } catch (err: any) {
      alert(err.message || '新增失敗');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此封鎖日期？')) return;
    try {
      await apiFetch(`/blocked-dates/${id}`, { method: 'DELETE' });
      fetchBlockedDates();
    } catch (err: any) {
      alert('刪除失敗');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)' }}>設定民宿整體休館或不開放預訂的日期。</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          新增封鎖日期
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>日期範圍</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>原因</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>範圍</th>
              <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>載入中...</td></tr>
            ) : blockedDates.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <CalendarOff size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  尚無封鎖日期
                </td>
              </tr>
            ) : (
              blockedDates.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{b.start_date} ~ {b.end_date}</td>
                  <td style={{ padding: '1rem' }}>{b.reason}</td>
                  <td style={{ padding: '1rem' }}>{b.room_id ? `房型 #${b.room_id}` : '全部房間'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
                      onClick={() => handleDelete(b.id)}
                    >
                      <Trash2 size={16} /> 刪除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>新增封鎖日期</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">開始日期</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={formData.start_date}
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">結束日期</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={formData.end_date}
                  onChange={e => setFormData({...formData, end_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">原因 / 備註</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  placeholder="例如：過年休館、內部整修"
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>取消</button>
                <button type="submit" className="btn btn-primary">確定新增</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
