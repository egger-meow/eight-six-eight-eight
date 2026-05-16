'use client';

import { useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { bookingInfoPage } from '@/data/content';
import styles from './page.module.css';

export default function BookingInfo() {
  const { t } = useLang();

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

  return (
    <div className={styles.subPage}>
      {/* SubPage Header */}
      <div className={styles.pageHeader}>
        <div className="container">
          <div className="reveal">
            <span className="section-label" style={{ color: 'var(--color-gold)' }}>RESERVATION</span>
            <h1 className={styles.title}>{t(bookingInfoPage.h1)}</h1>
            <span className="gold-line center" />
          </div>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className={styles.infoGrid}>
            {bookingInfoPage.sections.map((section, idx) => (
              <div 
                key={idx} 
                className={`reveal ${styles.infoCard}`} 
                style={{ transitionDelay: `${idx * 0.1}s` }}
              >
                <h2 className={styles.cardTitle}>
                  <span className={styles.bullet}>•</span>
                  {t(section.title)}
                </h2>
                <ul className={styles.infoList}>
                  {section.items[useLang().lang].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={`reveal ${styles.ctaBox}`} style={{ marginTop: '4rem' }}>
            <a 
              href="http://line.naver.jp/ti/p/~@gps2290j" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-solid"
            >
              <span>LINE 預約訂房 / Contact LINE</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
