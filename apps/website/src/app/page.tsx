'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLang } from '@/context/LanguageContext';
import {
  hero,
  newsSection,
  aboutSection,
  parallax,
  staySection,
  featuresSection,
  mapSection,
} from '@/data/content';
import { getMedia, getNews, getRooms, mediaUrl, type WebsiteMedia, type WebsiteRoom } from '@/lib/api';

type NewsItem = { src: string; label: { zh: string; en: string }; date: string };
type StayItem = { slug: string; image: string; name: { zh: string; en: string }; size: 'large' | 'tall' | 'sm' };
import styles from './page.module.css';

/* ── Scroll reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.classList.add('in-view'); obs.disconnect(); }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ════════════════════════════════════════════════════════════
   HERO SLIDER
   ════════════════════════════════════════════════════════════ */
function HeroSlider() {
  const { t } = useLang();
  const [slides, setSlides] = useState<WebsiteMedia[]>(
    hero.slides.map((slide, index) => ({
      url: slide.src,
      alt_text: slide.alt.zh,
      sort_order: index * 10,
    }))
  );
  const [current, setCurrent] = useState(0);
  const [prev, setPrev]       = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    getMedia('homepage_hero').then(({ media }) => {
      if (mounted && media.length > 0) setSlides(media);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setPrev(current);
      setCurrent((c) => (c + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  return (
    <section className={styles.hero} aria-label={t({ zh: '首頁輪播', en: 'Hero Slideshow' })}>
      {slides.map((slide, i) => (
        <div
          key={slide.url}
          className={`${styles.slide} ${i === current ? styles.slideCurrent : ''} ${i === prev ? styles.slidePrev : ''}`}
        >
          <Image
            src={mediaUrl(slide.url)}
            alt={slide.alt_text || t(hero.location)}
            fill
            priority={i === 0}
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
      ))}

      <div className={styles.heroOverlay} />

      <div className={styles.heroText}>
        <span className="section-label" style={{ color: 'rgba(212,190,150,0.85)' }}>
          {t(hero.location)}
        </span>
        <h1 className={styles.heroH1}>
          {hero.lines.map((line) => (
            <span key={line} className={styles.heroLine}>{line}</span>
          ))}
        </h1>
        <div className={styles.heroSub}>{t(hero.subtitle)}</div>
        <div className={styles.heroCtas}>
          <Link href="/rooms" className="btn" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}>
            <span>{t(hero.ctaRooms)}</span>
          </Link>
          <Link href="/booking" className="btn btn-solid">
            <span>{t(hero.ctaReserve)}</span>
          </Link>
        </div>
      </div>

      <div className={styles.scrollIndicator} aria-hidden="true">
        <span className={styles.scrollLine} />
        <span className={styles.scrollDot} />
      </div>

      <div className={styles.slideDots} role="tablist">
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => { setPrev(current); setCurrent(i); }}
          />
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   NEWS / GALLERY
   ════════════════════════════════════════════════════════════ */
function NewsSection() {
  const { t } = useLang();
  const ref = useReveal();
  const [items, setItems] = useState<NewsItem[]>([...newsSection.items]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getMedia('gallery'), getNews(8)]).then(([mediaResult, newsResult]) => {
      if (!mounted || mediaResult.media.length === 0) return;
      setItems(mediaResult.media.slice(0, 8).map((item, index) => {
        const news = newsResult.news[index];
        const fallback = newsSection.items[index];
        return {
          src: item.url,
          label: {
            zh: news?.title || item.alt_text || fallback?.label.zh || '民宿照片',
            en: news?.title || item.alt_text || fallback?.label.en || 'B&B Photo',
          },
          date: news?.published_at?.slice(0, 7) || fallback?.date || '',
        };
      }));
    });
    return () => { mounted = false; };
  }, []);

  return (
    <section className={styles.newsSection}>
      <div className="container">
        <div className={`reveal ${styles.newsHeader}`} ref={ref}>
          <span className="section-label">{newsSection.labelEn}</span>
          <h2 className="section-title">{t(newsSection.label)}</h2>
          <span className="gold-line center" />
        </div>
        <div className={styles.newsGrid}>
          {items.map((item, i) => (
            <div key={i} className={styles.newsCard} style={{ transitionDelay: `${i * 0.06}s` }}>
              <div className={styles.newsImgWrap}>
                <Image
                  src={mediaUrl(item.src)}
                  alt={t(item.label)}
                  fill
                  sizes="(max-width:600px) 100vw, (max-width:1024px) 33vw, 25vw"
                  style={{ objectFit: 'cover' }}
                  className={styles.newsImg}
                />
                <div className={styles.newsCardOverlay}><span>{t(item.label)}</span></div>
              </div>
              <div className={styles.newsCardInfo}>
                <span className={styles.newsDate}>{item.date}</span>
                <span className={styles.newsLabel}>{t(item.label)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   ABOUT
   ════════════════════════════════════════════════════════════ */
function AboutSection() {
  const { t } = useLang();
  const ref = useReveal();
  const [bgImage, setBgImage] = useState<string>(aboutSection.bgImage);

  useEffect(() => {
    let mounted = true;
    getMedia('about').then(({ media }) => {
      if (mounted && media[0]?.url) setBgImage(media[0].url);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <section className={styles.aboutSection}>
      <div className={styles.aboutBg}>
        <Image
          src={mediaUrl(bgImage)}
          alt={t(aboutSection.title)}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
      </div>
      <div className={styles.aboutOverlay} />
      <div className={`container ${styles.aboutContent}`}>
        <div className={`reveal ${styles.aboutBox}`} ref={ref}>
          <span className="section-label" style={{ color: 'rgba(212,190,150,0.8)' }}>
            {aboutSection.labelEn}
          </span>
          <h2 className={`section-title ${styles.aboutTitle}`}>{t(aboutSection.title)}</h2>
          <span className="gold-line" />
          <p className={styles.aboutText}>{t(aboutSection.body)}</p>
          <Link
            href="/about"
            className="btn"
            style={{ marginTop: '1.5rem', color: '#b89c6e', borderColor: '#b89c6e' }}
          >
            <span>{t(aboutSection.readMore)}</span>
            <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   PARALLAX DIVIDER
   ════════════════════════════════════════════════════════════ */
function ParallaxDivider({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className={`parallax-section ${styles.parallaxDiv}`}
      style={{ backgroundImage: `url(${src})` }}
      aria-label={alt}
    >
      <div className={styles.parallaxOverlay} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   STAY / ROOMS
   ════════════════════════════════════════════════════════════ */
const cellSizeClass: Record<string, string> = {
  large: styles.stayCellLarge,
  tall:  styles.stayCellTall,
  sm:    styles.stayCellSm,
};

function StaySection() {
  const { t } = useLang();
  const ref = useReveal();
  const [rooms, setRooms] = useState<StayItem[]>(() => [...staySection.rooms]);

  useEffect(() => {
    let mounted = true;
    getRooms().then(({ rooms: apiRooms }) => {
      if (!mounted) return;
      const bySlug = new Map<string, WebsiteRoom>(apiRooms.map((room) => [room.slug, room]));
      setRooms(staySection.rooms.map((layoutRoom) => {
        const apiRoom = bySlug.get(layoutRoom.slug);
        return apiRoom
          ? {
              slug: apiRoom.slug,
              image: apiRoom.images[0]?.url || layoutRoom.image,
              name: { zh: apiRoom.name_zh, en: apiRoom.name_en || layoutRoom.name.en },
              size: layoutRoom.size,
            }
          : layoutRoom;
      }));
    });
    return () => { mounted = false; };
  }, []);

  return (
    <section className={styles.staySection}>
      <div className="container">
        <div className={`reveal ${styles.stayHeader}`} ref={ref}>
          <div>
            <span className="section-label">{staySection.labelEn}</span>
            <h2 className="section-title">{t(staySection.title)}</h2>
            <span className="gold-line" />
          </div>
          <Link href="/rooms" className="btn">
            <span>{t(staySection.detail)}</span>
            <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
          </Link>
        </div>
      </div>

      <div className={styles.stayGrid}>
        {rooms.map((room) => (
          <Link
            key={room.slug}
            href={`/rooms/${room.slug}`}
            className={`${styles.stayCell} ${cellSizeClass[room.size]}`}
          >
            <Image
              src={mediaUrl(room.image)}
              alt={t(room.name)}
              fill
              sizes="(max-width:768px) 100vw, 40vw"
              style={{ objectFit: 'cover' }}
            />
            <div className={styles.stayCellLabel}>{t(room.name)}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   FEATURES
   ════════════════════════════════════════════════════════════ */
function FeaturesSection() {
  const { t } = useLang();
  const ref = useReveal();
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={`reveal ${styles.featuresGrid}`} ref={ref}>
          {featuresSection.items.map((f, i) => (
            <div
              key={f.enTitle}
              className={`reveal ${styles.featureCard} reveal-delay-${i + 1}`}
            >
              <div className={styles.featureIcon}>{f.icon}</div>
              <div className={styles.featureEn}>{f.enTitle}</div>
              <h3 className={styles.featureZh}>{t({ zh: f.zh.sub, en: f.en.sub })}</h3>
              <span className="gold-line center" />
              <p className={styles.featureDesc}>{t({ zh: f.zh.desc, en: f.en.desc })}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   MAP / CONTACT
   ════════════════════════════════════════════════════════════ */
function MapSection() {
  const { t, lang } = useLang();
  const ref = useReveal();
  const routeSteps = mapSection.route[lang];
  return (
    <section className={styles.mapSection}>
      <div className="container">
        <div className={`reveal ${styles.mapInfoBox}`} ref={ref}>
          <div>
            <span className="section-label">{mapSection.labelEn}</span>
            <h2 className="section-title">{t(mapSection.title)}</h2>
            <span className="gold-line" />
            <div className={styles.mapRoute}>
              {routeSteps.map((step, i) => (
                <div key={i}>
                  <div className={`${styles.routeStep} ${i === routeSteps.length - 1 ? styles.routeStepDest : ''}`}>
                    {step}
                  </div>
                  {i < routeSteps.length - 1 && (
                    <i className={`fas fa-chevron-down ${styles.routeArrow}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.shopTable}>
            <table>
              <tbody>
                {mapSection.contact.map((row) => (
                  <tr key={row.href ?? t(row.label)}>
                    <td>{t(row.label)}</td>
                    <td>
                      {row.href ? (
                        <a
                          href={row.href}
                          target={row.href.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className={styles.shopLink}
                        >
                          {t(row.value)}
                        </a>
                      ) : (
                        t(row.value)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={styles.mapEmbed}>
        <iframe
          src={mapSection.mapEmbedSrc}
          width="100%"
          height="420"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={t({ zh: '86.88民宿地圖', en: '86.88 B&B Map' })}
        />
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE ASSEMBLY
   ════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { t } = useLang();
  const [dividerImages, setDividerImages] = useState<{ first: string; second: string }>({
    first: parallax.divider1.src,
    second: parallax.divider2.src,
  });

  useEffect(() => {
    let mounted = true;
    getMedia('gallery').then(({ media }) => {
      if (mounted && media.length > 1) {
        setDividerImages({
          first: media[0].url || parallax.divider1.src,
          second: media[1].url || parallax.divider2.src,
        });
      }
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
  }, []);

  return (
    <>
      <HeroSlider />
      <NewsSection />
      <AboutSection />
      <ParallaxDivider src={mediaUrl(dividerImages.first)} alt={t(parallax.divider1.alt)} />
      <StaySection />
      <FeaturesSection />
      <ParallaxDivider src={mediaUrl(dividerImages.second)} alt={t(parallax.divider2.alt)} />
      <MapSection />
    </>
  );
}
