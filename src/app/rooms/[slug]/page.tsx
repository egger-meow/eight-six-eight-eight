'use client';

import { useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import { roomsPage } from '@/data/content';
import roomsData from '@/data/rooms.json';
import styles from './page.module.css';

export default function RoomDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { t, lang } = useLang();
  const resolvedParams = use(params);
  const room = roomsData.find((r) => r.slug === resolvedParams.slug);

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  if (!room) {
    notFound();
  }

  return (
    <div className={styles.subPage}>
      {/* SubPage Header */}
      <div className={styles.pageHeader}>
        <div className="container">
          <div className="reveal">
            <span className="section-label" style={{ color: 'var(--color-gold)' }}>ROOM DETAIL</span>
            <h1 className={styles.title}>{room.name_zh}</h1>
            <span className="gold-line center" />
          </div>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className="container">
          {/* Gallery Grid */}
          <div className={`reveal ${styles.gallery}`}>
            {room.images.map((img, i) => (
              <div key={i} className={`${styles.imgWrap} ${i === 0 ? styles.imgMain : ''}`}>
                <Image 
                  src={img} 
                  alt={`${room.name_zh} ${i}`} 
                  fill 
                  sizes={i === 0 ? "(max-width: 768px) 100vw, 800px" : "(max-width: 768px) 50vw, 400px"}
                  style={{ objectFit: 'cover' }}
                  priority={i === 0}
                />
              </div>
            ))}
          </div>

          <div className={styles.detailGrid}>
            <div className={`reveal ${styles.infoCol}`}>
              <h2 className={styles.sectionTitle}>{t({ zh: '房間介紹', en: 'Room Introduction' })}</h2>
              <p className={styles.description}>{room.description}</p>
              
              <div className={styles.roomSpecs}>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>{t({ zh: '容納人數', en: 'Capacity' })}</span>
                  <span className={styles.specValue}>{room.capacity} {t(roomsPage.capacity)}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>{t({ zh: '床型', en: 'Bed Type' })}</span>
                  <span className={styles.specValue}>{room.name_en}</span>
                </div>
              </div>

              <Link href="/rooms" className={styles.backLink}>
                <i className="fas fa-arrow-left" /> {t({ zh: '返回所有房型', en: 'Back to All Rooms' })}
              </Link>
            </div>
            
            <div className={`reveal ${styles.sidebarCol}`}>
              <div className={styles.priceCard}>
                <h3 className={styles.priceTitle}>{t({ zh: '房價資訊', en: 'Pricing' })}</h3>
                <div className={styles.priceList}>
                  <div className={styles.priceRow}>
                    <span>{t(roomsPage.priceLabels.weekday)} (日-四)</span>
                    <strong>NT$ {room.price_weekday.toLocaleString()}</strong>
                  </div>
                  <div className={styles.priceRow}>
                    <span>{t(roomsPage.priceLabels.weekend)} (五-六)</span>
                    <strong>NT$ {room.price_weekend.toLocaleString()}</strong>
                  </div>
                  <div className={styles.priceRow}>
                    <span>{t(roomsPage.priceLabels.holiday)} (連假/過年)</span>
                    <strong>NT$ {room.price_holiday.toLocaleString()}</strong>
                  </div>
                </div>

                <a 
                  href="http://line.naver.jp/ti/p/~@gps2290j" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.bookBtn}
                >
                  {t(roomsPage.bookBtn)}
                </a>
                <p className={styles.bookNote}>{t({ zh: '透過 LINE 預約享最優惠價格', en: 'Book via LINE for the best rate' })}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
