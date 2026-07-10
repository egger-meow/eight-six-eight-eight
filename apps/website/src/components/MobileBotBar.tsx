'use client';

import { botBar } from '@/data/content';
import { useLang } from '@/context/LanguageContext';

export default function MobileBotBar() {
  const { t } = useLang();
  return (
    <div className="botBar">
      <div className="botBar-inner">
        <a
          href="https://www.facebook.com/86.88bnb/"
          target="_blank"
          rel="noopener noreferrer"
          className="botBar-btn fb"
          aria-label="Facebook"
        >
          <i className="fab fa-facebook-square" />
        </a>
        <a
          href="http://line.naver.jp/ti/p/~@gps2290j"
          target="_blank"
          rel="noopener noreferrer"
          className="botBar-btn line"
          aria-label="LINE"
        >
          <i className="fab fa-line" />
        </a>
        <a href="tel:0920900793" className="botBar-btn tel" aria-label="電話">
          <i className="fas fa-phone-square" />
        </a>
        <a
          href="/booking"
          className="botBar-btn reserve"
          aria-label="立即預訂"
        >
          {t(botBar.reserve)}
        </a>
      </div>
    </div>
  );
}
