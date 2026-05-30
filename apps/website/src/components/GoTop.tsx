'use client';

import { useEffect, useState } from 'react';

export default function GoTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      className={`goTopBtn ${visible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="回到頂部"
    >
      <i className="fas fa-chevron-up" />
    </button>
  );
}
