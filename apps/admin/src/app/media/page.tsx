'use client';

import React, { useEffect, useRef, useState } from 'react';
import { apiFetch, API_ORIGIN } from '@/lib/api';
import styles from './media.module.css';
import { UploadCloud, Trash2, GripHorizontal, Image as ImageIcon } from 'lucide-react';

const WEBSITE_ORIGIN = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://8688bnb.com').replace(/\/$/, '');
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxFileSize = 10 * 1024 * 1024;

export default function MediaPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('homepage_hero');
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingUpload, setDraggingUpload] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<number | null>(null);
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

  const validateFiles = (files: File[]) => {
    for (const file of files) {
      if (!acceptedTypes.includes(file.type)) {
        alert('只能上傳 JPG、PNG 或 WebP 圖片');
        return false;
      }
      if (file.size > maxFileSize) {
        alert(`${file.name} 超過 10MB，請先壓縮後再上傳`);
        return false;
      }
    }
    return true;
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0 || !validateFiles(files)) return;

    const currentMaxSort = media.reduce((max, item, index) => Math.max(max, Number(item.sort_order ?? index * 10)), 0);

    try {
      setLoading(true);
      for (const [index, file] of files.entries()) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target', selectedTarget);
        formData.append('alt_text', file.name.replace(/\.[^.]+$/, ''));
        formData.append('sort_order', String(currentMaxSort + (index + 1) * 10));
        await apiFetch('/media/upload', { method: 'POST', body: formData });
      }
      await Promise.all([fetchMedia(selectedTarget), fetchTargets()]);
    } catch (err: any) {
      alert(err.message || '上傳失敗');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setDraggingUpload(false);
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await uploadFiles(e.target.files);
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

  const handleDropUpload = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggingUpload(false);
    if (event.dataTransfer.files.length > 0) {
      await uploadFiles(event.dataTransfer.files);
    }
  };

  const handleReorderDrop = async (targetId: number) => {
    if (!draggedImageId || draggedImageId === targetId) return;
    const fromIndex = media.findIndex((item) => item.id === draggedImageId);
    const toIndex = media.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const nextMedia = [...media];
    const [moved] = nextMedia.splice(fromIndex, 1);
    nextMedia.splice(toIndex, 0, moved);
    setMedia(nextMedia);
    setDraggedImageId(null);

    try {
      await apiFetch('/media/reorder', {
        method: 'PUT',
        body: JSON.stringify({ image_ids: nextMedia.map((item) => item.id) }),
      });
      await fetchTargets();
    } catch (err: any) {
      alert(err.message || '排序更新失敗');
      await fetchMedia(selectedTarget);
    }
  };

  const selectedTargetInfo = targets.find(t => t.target === selectedTarget);
  const getTargetLabel = (targetId: string) => targets.find(t => t.target === targetId)?.label_zh || targetId;
  const imageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/images/')) return `${WEBSITE_ORIGIN}${url}`;
    return `${API_ORIGIN}${url}`;
  };

  return (
    <div className={styles.mediaContainer}>
      <div className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>顯示位置</h3>
        <ul className={styles.targetList}>
          {targets.map(t => (
            <li key={t.target}>
              <button className={`${styles.targetBtn} ${selectedTarget === t.target ? styles.active : ''}`} onClick={() => setSelectedTarget(t.target)}>
                <span>{t.label_zh}</span>
                <span className={styles.countBadge}>{t.image_count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.mainArea}>
        <div className={styles.header}>
          <div>
            <h2>{getTargetLabel(selectedTarget)}</h2>
            {selectedTargetInfo?.description_zh && <p>{selectedTargetInfo.description_zh}</p>}
          </div>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud size={18} />
            上傳圖片
          </button>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/jpeg,image/png,image/webp" />
        </div>

        <div
          className={`${styles.dropZone} ${draggingUpload ? styles.dropZoneActive : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDraggingUpload(true); }}
          onDragLeave={() => setDraggingUpload(false)}
          onDrop={handleDropUpload}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <UploadCloud size={24} />
          <div>
            <strong>拖曳圖片到這裡，或點擊選擇多張圖片</strong>
            <span>支援 JPG、PNG、WebP，每張 10MB 以內。新圖片會接在目前排序最後面。</span>
          </div>
        </div>

        {loading ? (
          <div>載入中...</div>
        ) : media.length === 0 ? (
          <div className={styles.emptyState}>
            <ImageIcon size={48} />
            <p>目前沒有圖片，請上傳或拖曳圖片到上方區塊。</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {media.map((item, index) => (
              <div
                key={item.id}
                className={`${styles.imageCard} ${draggedImageId === item.id ? styles.draggingCard : ''}`}
                draggable
                onDragStart={() => setDraggedImageId(item.id)}
                onDragEnd={() => setDraggedImageId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleReorderDrop(item.id)}
              >
                {index === 0 && <div className={styles.primaryBadge}>網站主圖 / 第一張</div>}
                <img src={imageUrl(item.url)} alt={item.alt_text || item.filename_original} className={styles.imagePreview} />
                <div className={styles.imageOverlay}>
                  <button className={styles.iconBtn} title="拖曳圖片可調整排序" type="button">
                    <GripHorizontal size={18} />
                  </button>
                  <button className={`${styles.iconBtn} ${styles.danger}`} title="刪除" type="button" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className={styles.imageMeta}>
                  <strong>#{index + 1}</strong> {item.alt_text || item.filename_original || '無替代文字'}
                  <br />
                  <span>{Math.round((item.size_bytes || 0) / 1024)} KB</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
