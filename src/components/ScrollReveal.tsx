'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: string;
  style?: React.CSSProperties;
}

export default function ScrollReveal({ children, className = '', delay, style }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(delay ? { transitionDelay: delay } : {}),
  };

  return (
    <div 
      ref={ref} 
      className={`${className} reveal ${visible ? 'in-view' : ''}`}
      style={combinedStyle}
    >
      {children}
    </div>
  );
}
