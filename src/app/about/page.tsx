'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useLang } from '@/context/LanguageContext';
import { aboutPage } from '@/data/content';
import styles from './page.module.css';

export default function About() {
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
            <span className="section-label" style={{ color: 'var(--color-gold)' }}>ABOUT US</span>
            <h1 className={styles.title}>{t(aboutPage.h1)}</h1>
            <span className="gold-line center" />
          </div>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.aboutGrid}>
            <div className={`reveal ${styles.aboutTextCol}`}>
              <h2 className={styles.sectionTitle}>86.88 B&B</h2>
              <p className={styles.description}>{t(aboutPage.intro)}</p>
              
              <div className={styles.featuresGrid}>
                {aboutPage.features.map((feature, i) => (
                  <div key={i} className={styles.featureItem}>
                    <span className={styles.featureIcon}>{feature.icon}</span>
                    <span className={styles.featureText}>{t({ zh: feature.zh, en: feature.en })}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`reveal ${styles.aboutImgCol}`}>
              <div className={styles.imageFrame}>
                <Image 
                  src="/images/index-page/abt3_bg.png" 
                  alt="86.88民宿" 
                  fill 
                  style={{ objectFit: 'cover' }} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Section */}
      <div className={`parallax-section ${styles.parallaxDiv}`} style={{ backgroundImage: 'url(/images/public-spaces/dining-area-1.jpg)' }}>
        <div className={styles.parallaxOverlay} />
      </div>
    </div>
  );
}
