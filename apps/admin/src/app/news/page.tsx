'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function NewsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] = useState({
    id: '',
    title: '最新公告',
    content: '',
    visible: true,
    pinned: true,
    published_at: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await apiFetch('/news?include_hidden=true&per_page=20', { skipCache: true });
        const items = res?.data || [];
        const item = items.find((n: any) => n.pinned) || items[0];
        if (item) {
          setAnnouncement({
            id: String(item.id),
            title: item.title,
            content: item.content,
            visible: item.visible,
            pinned: item.pinned,
            published_at: item.published_at || new Date().toISOString().split('T')[0],
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncement();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: announcement.title,
        content: announcement.content,
        visible: announcement.visible,
        pinned: true,
        published_at: announcement.published_at || null,
      };

      if (announcement.id) {
        await apiFetch(`/news/${announcement.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const res = await apiFetch('/news', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res?.data?.id) setAnnouncement(prev => ({ ...prev, id: String(res.data.id) }));
      }
      alert('公告已更新！');
    } catch (err: any) {
      alert(err.message || '更新失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>載入中...</div>;

  return (
    <div className="card" style={{ maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>更新首頁公告</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        此處會更新目前置頂公告，官方網站首頁會顯示最新一筆公告內容。
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">公告標題</label>
          <input type="text" className="input-field" value={announcement.title} onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })} required />
        </div>

        <div className="form-group">
          <label className="form-label">公告內容</label>
          <textarea className="input-field" value={announcement.content} onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })} rows={10} required style={{ resize: 'vertical' }} />
        </div>

        <div className="form-group">
          <label className="form-label">發布日期</label>
          <input type="date" className="input-field" value={announcement.published_at} onChange={(e) => setAnnouncement({ ...announcement, published_at: e.target.value })} />
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
          <input type="checkbox" id="visible" checked={announcement.visible} onChange={(e) => setAnnouncement({ ...announcement, visible: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-gold)' }} />
          <label htmlFor="visible" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>顯示於官方網站</label>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '儲存中...' : '發布公告'}</button>
        </div>
      </form>
    </div>
  );
}
