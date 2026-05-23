'use client';

import { useLang } from '@/context/LanguageContext';
import { bookingInfoPage } from '@/data/content';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './page.module.css';

export default function BookingInfo() {
  const { t, lang } = useLang();

  return (
    <div className={styles.subPage}>
      {/* SubPage Header */}
      <div className={styles.pageHeader}>
        <div className="container">
          <ScrollReveal>
            <span className="section-label" style={{ color: 'var(--color-gold)' }}>RESERVATION</span>
            <h1 className={styles.title}>{t(bookingInfoPage.h1)}</h1>
            <span className="gold-line center" />
          </ScrollReveal>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className={styles.infoGrid}>
            {bookingInfoPage.sections.map((section, idx) => (
              <ScrollReveal 
                key={idx} 
                className={styles.infoCard} 
                delay={`${idx * 0.1}s`}
              >
                <h2 className={styles.cardTitle}>
                  <span className={styles.bullet}>•</span>
                  {t(section.title)}
                </h2>
                <ul className={styles.infoList}>
                  {section.items[lang].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className={styles.ctaBox} style={{ marginTop: '4rem' }}>
            <a 
              href="http://line.naver.jp/ti/p/~@gps2290j" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-solid"
            >
              <span>LINE 預約訂房 / Contact LINE</span>
            </a>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
