'use client';

import { useLang } from '@/context/LanguageContext';
import { footer } from '@/data/content';
import styles from './Footer.module.css';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className={styles.footer}>
      {/* Follow Us */}
      <div className={styles.followSection}>
        <div className="container">
          <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>
            {footer.followLabel}
          </span>
          <div className={styles.socialRow}>
            {footer.social.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target={item.href.startsWith('tel') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className={styles.socialItem}
                aria-label={t(item.label)}
              >
                <div className={`${styles.socialIcon} ${styles[item.cls]}`}>
                  <i className={item.icon} />
                </div>
                <span>{t(item.label)}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className={styles.copyright}>
        <div className="container">
          <p>
            COPYRIGHT &copy; {new Date().getFullYear()}&nbsp;
            {footer.links.map((link, i) => (
              <span key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.copyrightLink}
                >
                  {t(link.label)}
                </a>
                {i < footer.links.length - 1 && <span style={{ opacity: 0.3 }}> · </span>}
              </span>
            ))}
          </p>
          <p style={{ marginTop: '0.4rem', opacity: 0.45 }}>
            86.88 B&amp;B · {t(footer.address)} · {t(footer.copyright)} · #{footer.licenseNum}
          </p>
        </div>
      </div>
    </footer>
  );
}
