'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/context/LanguageContext';
import { bookingInfoPage } from '@/data/content';
import { getMedia, type WebsiteMedia } from '@/lib/api';
import styles from './page.module.css';

export default function BookingInfo() {
  const { t, lang } = useLang();
  const [heroImage, setHeroImage] = useState<WebsiteMedia | null>(null);

  useEffect(() => {
    let mounted = true;
    getMedia('booking_info').then(({ media }) => {
      if (mounted) setHeroImage(media[0] || null);
    }).catch(() => undefined);
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
  }, []);

  return (
    <div className={styles.subPage}>
      <div className={styles.pageHeader}>
        <div className="container">
          <div className="reveal">
            <span className="section-label" style={{ color: 'var(--color-gold)' }}>RESERVATION</span>
            <h1 className={styles.title}>{t(bookingInfoPage.h1)}</h1>
            <span className="gold-line center" />
            <p className={styles.intro}>{t(bookingInfoPage.intro)}</p>
          </div>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className="container">
          <div className={`reveal ${styles.editorialIntro}`}>
            <div>
              <div className={styles.notice}>{t(bookingInfoPage.testNotice)}</div>
            </div>
            {heroImage && (
              <figure className={styles.heroPhoto}>
                <img src={heroImage.url} alt={heroImage.alt_text || t(bookingInfoPage.h1)} />
                <figcaption>Booking Info</figcaption>
              </figure>
            )}
          </div>

          <div className={`reveal ${styles.contactBand}`}> 
            {bookingInfoPage.contacts.map((contact) => (
              <a key={contact.href} href={contact.href} target={contact.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={styles.contactLink}>
                <span>{t(contact.label)}</span>
                <strong>{contact.value}</strong>
              </a>
            ))}
          </div>

          <div className={styles.infoList}>
            {bookingInfoPage.sections.map((section, idx) => (
              <section key={idx} className={`reveal ${styles.infoSection}`} style={{ transitionDelay: `${idx * 0.08}s` }}>
                <h2>{t(section.title)}</h2>
                <ul>
                  {section.items[lang].map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>
            ))}
          </div>

          <div className={`reveal ${styles.ctaBox}`}>
            <a href="http://line.naver.jp/ti/p/~@gps2290j" target="_blank" rel="noopener noreferrer" className="btn btn-solid">
              <span>{t(bookingInfoPage.contactAction)}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
