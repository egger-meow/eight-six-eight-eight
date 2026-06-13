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
    is_visible: true,
  });

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        // Find the first pinned news or the latest one to act as the main announcement
        const res = await apiFetch('/news?limit=1');
        if (res?.data && res.data.length > 0) {
          setAnnouncement({
            id: res.data[0].id,
            title: res.data[0].title,
            content: res.data[0].content,
            is_visible: res.data[0].is_visible,
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
      if (announcement.id) {
        await apiFetch(`/news/${announcement.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: announcement.title,
            content: announcement.content,
            is_visible: announcement.is_visible,
          }),
        });
      } else {
        const res = await apiFetch('/news', {
          method: 'POST',
          body: JSON.stringify({
            title: announcement.title,
            content: announcement.content,
            is_visible: announcement.is_visible,
            is_pinned: true,
            published_at: new Date().toISOString()
          }),
        });
        if (res?.data?.id) {
          setAnnouncement(prev => ({ ...prev, id: res.data.id }));
        }
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
        此處的內容將會顯示在官方網站的首頁「最新消息 / 公告」區塊。
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">公告標題</label>
          <input 
            type="text" 
            className="input-field" 
            value={announcement.title}
            onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
            required
            placeholder="例如：過年期間營業時間調整"
          />
        </div>

        <div className="form-group">
          <label className="form-label">公告內容</label>
          <textarea 
            className="input-field" 
            value={announcement.content}
            onChange={(e) => setAnnouncement({...announcement, content: e.target.value})}
            rows={10}
            required
            placeholder="請輸入公告內容...支援基本換行"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
          <input 
            type="checkbox" 
            id="is_visible"
            checked={announcement.is_visible}
            onChange={(e) => setAnnouncement({...announcement, is_visible: e.target.checked})}
            style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-gold)' }}
          />
          <label htmlFor="is_visible" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
            顯示於官方網站
          </label>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? '儲存中...' : '發布公告'}
          </button>
        </div>
      </form>
    </div>
  );
}
