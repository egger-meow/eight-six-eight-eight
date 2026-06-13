'use client';

import React, { useEffect, useState, useRef } from 'react';
import { apiFetch, API_ORIGIN } from '@/lib/api';
import styles from './media.module.css';
import { UploadCloud, Trash2, GripHorizontal, Image as ImageIcon } from 'lucide-react';

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
        if (!res.data.some((t: any) => t.target === selectedTarget) && res.data[0]?.target) {
          setSelectedTarget(res.data[0].target);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMedia = async (target: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/media?target=${encodeURIComponent(target)}&per_page=100`);
      setMedia(res?.data || []);
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
    formData.append('alt_text', file.name.replace(/\.[^.]+$/, ''));

    try {
      setLoading(true);
      await apiFetch('/media/upload', { method: 'POST', body: formData });
      await Promise.all([fetchMedia(selectedTarget), fetchTargets()]);
    } catch (err: any) {
      alert(err.message || '上傳失敗');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這張圖片嗎？')) return;
    try {
      await apiFetch(`/media/${id}`, { method: 'DELETE' });
      await Promise.all([fetchMedia(selectedTarget), fetchTargets()]);
    } catch (err: any) {
      alert(err.message || '刪除失敗');
    }
  };

  const getTargetLabel = (targetId: string) => targets.find(t => t.target === targetId)?.label_zh || targetId;
  const imageUrl = (url: string) => url.startsWith('http') ? url : `${API_ORIGIN}${url}`;

  return (
    <div className={styles.mediaContainer}>
      <div className={styles.sidebar}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>顯示位置</h3>
        <ul className={styles.targetList}>
          {targets.map(t => (
            <li key={t.target}>
              <button className={`${styles.targetBtn} ${selectedTarget === t.target ? styles.active : ''}`} onClick={() => setSelectedTarget(t.target)}>
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
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud size={18} />
            上傳圖片
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/jpeg,image/png,image/webp" />
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
            {media.map(item => (
              <div key={item.id} className={styles.imageCard}>
                <img src={imageUrl(item.url)} alt={item.alt_text || item.filename_original} className={styles.imagePreview} />
                <div className={styles.imageOverlay}>
                  <button className={styles.iconBtn} title="排序功能會使用 API reorder，尚未接拖曳互動" type="button">
                    <GripHorizontal size={18} />
                  </button>
                  <button className={`${styles.iconBtn} ${styles.danger}`} title="刪除" type="button" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className={styles.imageMeta}>
                  {item.alt_text || item.filename_original || '無替代文字'}
                  <br />
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                    {Math.round((item.size_bytes || 0) / 1024)} KB
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
