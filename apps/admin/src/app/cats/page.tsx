'use client';

import React, { useEffect, useState } from 'react';
import { Cat, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import styles from './cats.module.css';

const cats = [
  { key: 'tokyo', name: 'Tokyo' },
  { key: 'sakura', name: 'Sakura' },
  { key: 'sake', name: 'Sake' },
  { key: 'dajin', name: '大金' },
  { key: 'dayin', name: '大銀' },
] as const;

type CatKey = typeof cats[number]['key'];
type CatDetails = Record<CatKey, { zh: string; en?: string; tags: Array<{ zh: string; en?: string }> }>;

const defaultTags: Record<CatKey, string[]> = {
  tokyo: ['黏人姊妹', '窗邊巡守', '慢熟溫柔'],
  sakura: ['黏人姊妹', '撒嬌代表', '公共空間常駐'],
  sake: ['唯一男生', '好奇寶寶', '小管家'],
  dajin: ['14歲', '穩重派', '舒服位置達人'],
  dayin: ['午後慵懶', '療癒眼神', '放空專家'],
};

const emptyDetails = Object.fromEntries(cats.map((cat) => [cat.key, { zh: '', tags: defaultTags[cat.key].map((tag) => ({ zh: tag })) }])) as CatDetails;

export default function AdminCatsPage() {
  const [catDetails, setCatDetails] = useState<CatDetails>(emptyDetails);
  const [pageMeta, setPageMeta] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchPage() {
      try {
        const res = await apiFetch('/pages/cats', { skipCache: true });
        const meta = res?.data?.meta || {};
        const savedCats = meta.cats || {};
        setPageMeta(meta);
        setCatDetails(Object.fromEntries(cats.map((cat) => [
          cat.key,
          {
            zh: savedCats[cat.key]?.zh || '',
            en: savedCats[cat.key]?.en || '',
            tags: Array.isArray(savedCats[cat.key]?.tags) && savedCats[cat.key].tags.length > 0
              ? savedCats[cat.key].tags.map((tag: any) => ({ zh: tag.zh || '', en: tag.en || '' })).filter((tag: any) => tag.zh)
              : defaultTags[cat.key].map((tag) => ({ zh: tag })),
          },
        ])) as CatDetails);
      } catch (err: any) {
        setMessage(err.message || '讀取貓咪介紹失敗');
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, []);

  function updateDescription(key: CatKey, value: string) {
    setCatDetails((current) => ({
      ...current,
      [key]: { ...current[key], zh: value },
    }));
  }

  function updateTags(key: CatKey, value: string) {
    const tags = value.split(/[,，\n]/).map((tag) => tag.trim()).filter(Boolean).map((tag) => ({ zh: tag }));
    setCatDetails((current) => ({
      ...current,
      [key]: { ...current[key], tags },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await apiFetch('/pages/cats', {
        method: 'PUT',
        body: JSON.stringify({
          title_zh: '民宿貓貓',
          title_en: 'Resident Cats',
          meta: {
            ...pageMeta,
            cats: catDetails,
          },
          published: true,
        }),
      });
      setMessage('貓咪介紹已儲存');
    } catch (err: any) {
      setMessage(err.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div>
          <p className={styles.eyebrow}>網站內容</p>
          <h2>貓咪介紹</h2>
          <p>這裡的文字會顯示在官網「民宿貓貓」頁面。照片請到「圖片管理」上傳到各貓咪目標。</p>
        </div>
        <Cat size={36} />
      </div>

      {loading ? (
        <div className="card">載入中...</div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          {cats.map((cat) => (
            <section key={cat.key} className={styles.catBlock}>
              <div>
                <h3>{cat.name}</h3>
                <p>圖片目標：<code>cat_{cat.key}</code></p>
              </div>
              <label>
                <span>中文介紹</span>
                <textarea
                  className="input-field"
                  rows={5}
                  value={catDetails[cat.key]?.zh || ''}
                  onChange={(event) => updateDescription(cat.key, event.target.value)}
                  placeholder={`輸入 ${cat.name} 的個性、特色或想讓旅客知道的小故事`}
                />
              </label>
              <label>
                <span>可愛標籤</span>
                <input
                  className="input-field"
                  value={(catDetails[cat.key]?.tags || []).map((tag) => tag.zh).join('，')}
                  onChange={(event) => updateTags(cat.key, event.target.value)}
                  placeholder="例如：黏人姊妹，唯一男生，14歲"
                />
              </label>
            </section>
          ))}

          {message && <div className={message.includes('失敗') ? styles.error : styles.success}>{message}</div>}

          <div className={styles.actions}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} />
              {saving ? '儲存中...' : '儲存貓咪介紹'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
