'use client';

import { useLang } from '@/context/LanguageContext';
import { sideBox } from '@/data/content';

export default function SideBox() {
  const { t } = useLang();
  return (
    <aside className="sideBox" aria-label="快速聯絡">
      <span className="sideBox-title">{t(sideBox.title)}</span>
      <a
        className="sideBox-btn"
        href="http://line.naver.jp/ti/p/~@gps2290j"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t(sideBox.reserve)}
      </a>
      <a className="sideBox-btn" href="mailto:86.88hello@gmail.com">
        {t(sideBox.mail)}
      </a>
      <div className="sideBox-icons">
        <a
          href="https://www.facebook.com/86.88bnb/"
          target="_blank"
          rel="noopener noreferrer"
          className="sideBox-icon fb"
          aria-label="Facebook"
        >
          <i className="fab fa-facebook" />
        </a>
        <a
          href="http://line.naver.jp/ti/p/~@gps2290j"
          target="_blank"
          rel="noopener noreferrer"
          className="sideBox-icon line"
          aria-label="LINE"
        >
          <i className="fab fa-line" />
        </a>
        <a href="tel:0920900793" className="sideBox-icon tel" aria-label="電話">
          <i className="fas fa-phone-square" />
        </a>
      </div>
    </aside>
  );
}
