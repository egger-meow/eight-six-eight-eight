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
  
  const [scrolled, setScrolled] = useState(!isHome);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }

    const onScroll = () => setScrolled(window.scrollY > 480);
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

  return (
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
          aria-label="開啟選單"
          aria-expanded={menuOpen}
        >
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''} ${scrolled ? styles.barDark : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''} ${scrolled ? styles.barDark : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''} ${scrolled ? styles.barDark : ''}`} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}>
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
          href="http://line.naver.jp/ti/p/~@gps2290j"
          className={styles.drawerReserve}
          onClick={() => setMenuOpen(false)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t(nav.reserveBtn)}
        </Link>
      </div>
    </header>
  );
}
