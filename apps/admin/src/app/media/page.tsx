'use client';

import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './media.module.css';
import { UploadCloud, Trash2, GripHorizontal } from 'lucide-react';

export default function MediaPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('homepage_hero');
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTargets = async () => {
    try {
      const res = await apiFetch('/media/targets');
      if (res?.data) {
        setTargets(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMedia = async (target: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/media?target=${target}`);
      if (res?.data) {
        setMedia(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  useEffect(() => {
    fetchMedia(selectedTarget);
  }, [selectedTarget]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('檔案不能超過 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', selectedTarget);
    formData.append('alt_text', file.name.split('.')[0]);

    try {
      setLoading(true);
      await apiFetch('/media/upload', {
        method: 'POST',
        body: formData,
      });
      fetchMedia(selectedTarget);
      fetchTargets(); // update counts
    } catch (err: any) {
      alert(err.message || '上傳失敗');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這張圖片嗎？')) return;
    try {
      await apiFetch(`/media/${id}`, { method: 'DELETE' });
      fetchMedia(selectedTarget);
      fetchTargets();
    } catch (err: any) {
      alert('刪除失敗');
    }
  };

  const getTargetLabel = (slug: string) => {
    const target = targets.find(t => t.slug === slug);
    return target ? target.label_zh : slug;
  };

  return (
    <div className={styles.mediaContainer}>
      <div className={styles.sidebar}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>顯示位置</h3>
        <ul className={styles.targetList}>
          {targets.map(t => (
            <li key={t.slug}>
              <button 
                className={`${styles.targetBtn} ${selectedTarget === t.slug ? styles.active : ''}`}
                onClick={() => setSelectedTarget(t.slug)}
              >
                {t.label_zh}
                <span className={styles.countBadge}>{t.image_count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.mainArea}>
        <div className={styles.header}>
          <h2>{getTargetLabel(selectedTarget)}</h2>
          <button className="btn btn-primary" onClick={handleUploadClick}>
            <UploadCloud size={18} />
            上傳圖片
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept="image/jpeg, image/png, image/webp"
          />
        </div>

        {loading ? (
          <div>載入中...</div>
        ) : media.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ImageIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>目前沒有圖片，點擊右上角按鈕上傳。</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {media.map((item, index) => (
              <div key={item.id} className={styles.imageCard}>
                <img 
                  src={`http://localhost:3333${item.file_url}`} 
                  alt={item.alt_text} 
                  className={styles.imagePreview} 
                  onError={(e) => {
                    // Fallback for docker environment vs local
                    e.currentTarget.src = item.file_url.replace('/api/v1/media', 'http://api:3333/api/v1/media');
                  }}
                />
                <div className={styles.imageOverlay}>
                  <button className={styles.iconBtn} title="拖曳排序 (未實作)">
                    <GripHorizontal size={18} />
                  </button>
                  <button 
                    className={`${styles.iconBtn} ${styles.danger}`} 
                    title="刪除"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className={styles.imageMeta}>
                  {item.alt_text || '無替代文字'}
                  <br />
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                    {item.width}x{item.height} • {Math.round(item.file_size / 1024)} KB
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Just for the empty state icon
function ImageIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  );
}
