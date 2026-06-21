'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLang } from '@/context/LanguageContext';
import { catProfiles, catsPage } from '@/data/content';
import { getMedia, getPage, type WebsiteMedia } from '@/lib/api';
import styles from './page.module.css';

type CatKey = typeof catProfiles[number]['key'];
type CatMediaMap = Record<string, WebsiteMedia[]>;
type CatDetails = Record<string, { zh?: string; en?: string; tags?: Array<{ zh?: string; en?: string }> }>;

const rotations = ['-3deg', '2deg', '-1deg', '3deg', '-2deg'];

export default function CatsPage() {
  const { t, lang } = useLang();
  const [mediaByCat, setMediaByCat] = useState<CatMediaMap>({});
  const [catDetails, setCatDetails] = useState<CatDetails>({});
  const [selectedCat, setSelectedCat] = useState<CatKey | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCats() {
      const [pageResult, mediaResults] = await Promise.all([
        getPage('cats'),
        Promise.all(catProfiles.map(async (cat) => [cat.key, (await getMedia(cat.target)).media] as const)),
      ]);

      if (!mounted) return;
      setCatDetails((pageResult.page?.meta?.cats || {}) as CatDetails);
      setMediaByCat(Object.fromEntries(mediaResults));
    }

    loadCats().catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedCat) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedCat(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCat]);

  const selectedProfile = useMemo(
    () => catProfiles.find((cat) => cat.key === selectedCat) || null,
    [selectedCat]
  );

  const catDescription = (key: string) => {
    const profile = catProfiles.find((cat) => cat.key === key);
    const saved = catDetails[key];
    return lang === 'en'
      ? saved?.en || saved?.zh || (profile ? t(profile.description) : '')
      : saved?.zh || (profile ? t(profile.description) : '');
  };

  const catTags = (key: string) => {
    const profile = catProfiles.find((cat) => cat.key === key);
    const savedTags = catDetails[key]?.tags;
    const tags = Array.isArray(savedTags) && savedTags.length > 0 ? savedTags : profile?.tags || [];
    return tags.map((tag) => lang === 'en' ? tag.en || tag.zh || '' : tag.zh || tag.en || '').filter(Boolean);
  };

  return (
    <div className={styles.subPage}>
      <div className={styles.pageHeader}>
        <div className="container">
          <span className="section-label" style={{ color: 'var(--color-gold)' }}>{t(catsPage.label)}</span>
          <h1 className={styles.title}>{t(catsPage.h1)}</h1>
          <span className="gold-line center" />
          <p className={styles.intro}>{t(catsPage.intro)}</p>
        </div>
      </div>

      <section className={styles.catsSection}>
        <div className="container">
          <div className={styles.catWall}>
            {catProfiles.map((cat, index) => {
              const photos = mediaByCat[cat.key] || [];
              const primary = photos[0];
              return (
                <button
                  key={cat.key}
                  type="button"
                  className={`${styles.catFrame} ${styles[`frame${index + 1}`]}`}
                  style={{ transform: `rotate(${rotations[index]})` }}
                  onClick={() => setSelectedCat(cat.key)}
                >
                  <span className={styles.photoWrap}>
                    {primary ? <img src={primary.url} alt={primary.alt_text || t(cat.name)} /> : <span>{t(catsPage.emptyPhoto)}</span>}
                  </span>
                  <strong>{t(cat.name)}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {selectedProfile && (
        <div className={styles.detailOverlay} role="dialog" aria-modal="true" aria-label={t(selectedProfile.name)}>
          <div className={styles.detailBox}>
            <button type="button" className={styles.closeBtn} onClick={() => setSelectedCat(null)} aria-label={t(catsPage.close)}>
              <span aria-hidden="true">×</span>
            </button>
            <div className={styles.detailHeader}>
              <span>{t(catsPage.detailLabel)}</span>
              <h2>{t(selectedProfile.name)}</h2>
              <p>{catDescription(selectedProfile.key)}</p>
              <div className={styles.tagStrip} aria-label={lang === 'en' ? 'Cat tags' : '貓咪標籤'}>
                {catTags(selectedProfile.key).map((tag) => (
                  <span key={tag} className={styles.catTag}>{tag}</span>
                ))}
              </div>
            </div>
            <div className={styles.detailGallery}>
              {(mediaByCat[selectedProfile.key] || []).length > 0 ? (
                mediaByCat[selectedProfile.key].map((item) => (
                  <img key={item.id || item.url} src={item.url} alt={item.alt_text || t(selectedProfile.name)} />
                ))
              ) : (
                <div className={styles.emptyState}>{t(catsPage.emptyPhoto)}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
