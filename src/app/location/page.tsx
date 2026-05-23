'use client';

import { useLang } from '@/context/LanguageContext';
import { locationPage } from '@/data/content';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './page.module.css';

export default function Location() {
  const { t } = useLang();

  return (
    <div className={styles.subPage}>
      {/* SubPage Header */}
      <div className={styles.pageHeader}>
        <div className="container">
          <ScrollReveal>
            <span className="section-label" style={{ color: 'var(--color-gold)' }}>LOCATION</span>
            <h1 className={styles.title}>{t(locationPage.h1)}</h1>
            <span className="gold-line center" />
          </ScrollReveal>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.locationGrid}>
            <ScrollReveal className={styles.infoCol}>
              <h2 className={styles.sectionTitle}>86.88 B&B</h2>
              <div className={styles.contactInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Address</span>
                  <span className={styles.infoValue}>{t(locationPage.address)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Phone</span>
                  <a href="tel:0920900793" className={styles.infoLink}>0920-900-793</a>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>LINE</span>
                  <a href="http://line.naver.jp/ti/p/~@gps2290j" target="_blank" rel="noopener noreferrer" className={styles.infoLink}>@gps2290j</a>
                </div>
              </div>
              
              <div className={styles.instructionBox}>
                <p>
                  86.88民宿位於風景優美的宜蘭三星鄉，鄰近安農溪畔。
                  遠離塵囂，享受靜謐的鄉村風光，是您放鬆身心的最佳選擇。
                  建議開車前往，民宿備有停車位供旅客使用。
                </p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal className={styles.mapCol}>
              <div className={styles.mapFrame}>
                <iframe 
                  src={locationPage.mapEmbedSrc} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Map"
                ></iframe>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
