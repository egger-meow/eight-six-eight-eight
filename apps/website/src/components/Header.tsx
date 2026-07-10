'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import { nav } from '@/data/content';
import styles from './Header.module.css';

export default function Header() {
  const { lang, toggle, t } = useLang();
  const pathname = usePathname();
  const isHome = pathname === '/';
  
  const [homeScrolled, setHomeScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = !isHome || homeScrolled;

  useEffect(() => {
    if (!isHome) return;

    const onScroll = () => setHomeScrolled(window.scrollY > 480);
    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial check
    onScroll();
    
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  /* Close drawer on resize to desktop */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 860) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [menuOpen]);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="86.88 B&B 首頁">
          <span className={styles.logoNum}>86.88</span>
          <span className={styles.logoSub}>B&amp;B</span>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav} aria-label="主選單">
          <ul className={styles.navList}>
            {nav.links.map((link) => (
              <li key={link.href}>
                {'external' in link && link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.navItem}
                  >
                    {t(link)}
                  </a>
                ) : (
                  <Link href={link.href} className={styles.navItem}>
                    {t(link)}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Language toggle — desktop */}
          <button
            className={`${styles.langToggle} ${scrolled ? styles.langToggleScrolled : ''}`}
            onClick={toggle}
            aria-label={lang === 'zh' ? 'Switch to English' : '切換中文'}
            title={lang === 'zh' ? 'EN' : '中文'}
          >
            <span className={lang === 'zh' ? styles.langActive : styles.langInactive}>中</span>
            <span className={styles.langDivider}>/</span>
            <span className={lang === 'en' ? styles.langActive : styles.langInactive}>EN</span>
          </button>
        </nav>

        {/* Mobile controls */}
        <div className={styles.mobileControls}>
          {/* Language toggle — mobile */}
          <button
            className={`${styles.langToggle} ${scrolled ? styles.langToggleScrolled : ''} ${styles.langToggleMobile}`}
            onClick={toggle}
            aria-label={lang === 'zh' ? 'Switch to English' : '切換中文'}
          >
            <span className={lang === 'zh' ? styles.langActive : styles.langInactive}>中</span>
            <span className={styles.langDivider}>/</span>
            <span className={lang === 'en' ? styles.langActive : styles.langInactive}>EN</span>
          </button>

          {/* Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? '關閉選單' : '開啟選單'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''} ${scrolled ? styles.barDark : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''} ${scrolled ? styles.barDark : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''} ${scrolled ? styles.barDark : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        id="mobile-navigation"
        className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className={styles.drawerClose}
          onClick={() => setMenuOpen(false)}
          aria-label="關閉選單"
        >
          <span />
          <span />
        </button>
        <ul className={styles.drawerList}>
          {nav.links.map((link) => (
            <li key={link.href}>
              {'external' in link && link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.drawerItem}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(link)}
                </a>
              ) : (
                <Link
                  href={link.href}
                  className={styles.drawerItem}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(link)}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <Link
          href="/booking"
          className={styles.drawerReserve}
          onClick={() => setMenuOpen(false)}
        >
          {t(nav.reserveBtn)}
        </Link>
      </div>
    </>
  );
}
