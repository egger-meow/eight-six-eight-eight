'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLang } from '@/context/LanguageContext';
import { roomsPage } from '@/data/content';
import { getRooms, mediaUrl, type WebsiteRoom } from '@/lib/api';
import styles from './page.module.css';

export default function Rooms() {
  const { t } = useLang();
  const [rooms, setRooms] = useState<WebsiteRoom[]>([]);

  useEffect(() => {
    let mounted = true;
    getRooms().then(({ rooms }) => {
      if (mounted) setRooms(rooms.filter((room) => room.available !== false));
    });
    return () => { mounted = false; };
  }, []);

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
  }, [rooms.length]);

  return (
    <div className={styles.subPage}>
      <div className={styles.pageHeader}>
        <div className="container">
          <div className="reveal">
            <span className="section-label" style={{ color: 'var(--color-gold)' }}>OUR ROOMS</span>
            <h1 className={styles.title}>{t(roomsPage.h1)}</h1>
            <span className="gold-line center" />
            <p className={styles.subtitle}>{t(roomsPage.subtitle)}</p>
          </div>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.roomGrid}>
            {rooms.map((room, idx) => (
              <div
                key={room.id}
                className={`reveal ${styles.roomCard}`}
                style={{ transitionDelay: `${idx * 0.1}s` }}
              >
                <Link href={`/rooms/${room.slug}`} className={styles.imgLink}>
                  <div className={styles.roomImgWrap}>
                    <Image
                      src={mediaUrl(room.images[0]?.url)}
                      alt={room.images[0]?.alt_text || room.name_zh}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className={styles.imgOverlay}>
                      <span>{t(roomsPage.detailBtn)}</span>
                    </div>
                  </div>
                </Link>
                <div className={styles.roomInfo}>
                  <div className={styles.roomHeader}>
                    <h2 className={styles.roomName}>{room.name_zh}</h2>
                    <span className={styles.capacity}>
                      {room.capacity}{t(roomsPage.capacity)}
                    </span>
                  </div>
                  <div className={styles.priceRow}>
                    <div className={styles.priceItem}>
                      <span className={styles.priceLabel}>{t(roomsPage.priceLabels.weekday)}</span>
                      <span className={styles.priceValue}>NT${room.price_weekday.toLocaleString()}</span>
                    </div>
                    <div className={styles.priceDivider} />
                    <div className={styles.priceItem}>
                      <span className={styles.priceLabel}>{t(roomsPage.priceLabels.weekend)}</span>
                      <span className={styles.priceValue}>NT${room.price_weekend.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <Link href={`/rooms/${room.slug}`} className={styles.detailLink}>
                      {t(roomsPage.detailBtn)}
                    </Link>
                    <Link href={`/booking?room=${room.slug}`} className={styles.bookLink}>
                      {t(roomsPage.bookBtn)}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
