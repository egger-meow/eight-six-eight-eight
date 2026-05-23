# Synology Deployment & Architecture Suggestions

This document details the issues encountered during deployment on Synology DSM with Node 20, the code fixes applied to resolve them, and recommendations for global deployment and remote content management.

---

## 1. Diagnostics: Why Cards Were Empty on Synology (Node 20) vs. Windows 11 (Node 24)

### A. React Hydration & Intersection Observer Race Condition (The Primary Bug)
In subpages such as `/rooms`, `/booking-info`, `/about`, and `/location`, the codebase previously queried the DOM directly inside `useEffect` using `document.querySelectorAll('.reveal')` to bind scroll animations:
```typescript
useEffect(() => {
  const reveals = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => { ... }, { threshold: 0.1 });
  reveals.forEach((el) => obs.observe(el));
  return () => obs.disconnect();
}, []);
```
* **The Problem:** Direct DOM query selectors inside `useEffect` are an anti-pattern in React because React updates the DOM asynchronously.
* **Synology NAS Performance:** A Synology NAS CPU (typically Celeron J4025/J4125 on DS220+/DS420+) has limited single-core performance compared to a Windows 11 PC. In development or heavy load environments, Next.js takes significantly longer to hydrate pages.
* **The Race Condition:** On the NAS, `useEffect` fired *before* the dynamic lists (e.g. `{roomsData.map(...)}`) were fully hydrated into the DOM. Consequently, `document.querySelectorAll('.reveal')` returned an empty list, and the scroll observer was never bound. Because `.reveal` elements start at `opacity: 0` in CSS, the lack of an observer left them permanently invisible (the "empty card" symptom).
* **Windows 11 Behavior:** The fast Windows 11 PC hydrated instantly, meaning elements were already in the DOM when `useEffect` ran, masking the bug.

### B. Rules of Hooks Violation
In `/booking-info/page.tsx`, the code invoked a hook nested inside a `.map` loop:
`{section.items[useLang().lang].map(...)`
React requires hooks to be called at the top level of components. Violating this rule causes React to crash or fail hydration on client navigation, terminating execution of subsequent hooks and scripts (including the scroll animation).

---

## 2. Applied Code Fixes

To resolve these errors, we replaced direct DOM queries with **React-compliant Ref Callback Observers** or individual refs, and corrected hook usage.

### A. Scroll Reveal Component (`src/components/ScrollReveal.tsx`)
We introduced a clean, reusable React wrapper that handles scroll-observation using React refs, completely eliminating race conditions:
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: string;
}

export default function ScrollReveal({ children, className = '', delay }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`${className} reveal ${visible ? 'in-view' : ''}`}
      style={delay ? { transitionDelay: delay } : undefined}
    >
      {children}
    </div>
  );
}
```

### B. Corrected Hook Usage
We refactored `booking-info/page.tsx` to read the language from the top-level scope context before rendering loops.

---

## 3. Production Deployment on Synology NAS (Docker + Cloudflare)

### A. Infrastructure Requirements
* **RAM Upgrade:** Synology 220+ and 420+ ship with 2GB of RAM. It is highly recommended to install a DDR4 non-ECC SODIMM (4GB or 8GB) to upgrade the NAS to at least 6GB–10GB. Running Next.js, Nginx, and other containers on 2GB RAM will trigger Out-Of-Memory (OOM) silent crashes.
* **Production Build:** Never run `npm run dev` in production on the NAS. Instead, run `npm run build` on your Windows 11 PC (or via GitHub Actions) and package it into a Docker image, or build it once on the NAS and run `npm run start`.

### B. Architecture Checklist for Worldwide Public Access
To expose your website safely without opening ports or buying static IPs:

1. **Domain Setup:** 
   * Purchase a custom domain and delegate its DNS to **Cloudflare** (Free DNS service).
2. **Cloudflare Tunnel (`cloudflared`):**
   * Run the official `cloudflare/cloudflared` container on Synology Docker.
   * Add your Tunnel Token as an environment variable (`TUNNEL_TOKEN`).
   * This creates a secure outbound channel from your NAS to Cloudflare's edge.
3. **Reverse Proxy (Nginx Proxy Manager):**
   * Use Nginx Proxy Manager (NPM) as the gateway container inside the NAS.
   * Route external domains via NPM to your local Next.js application port (default `3000`).
   * This lets you host multiple services (like the Website, the CMS, or Synology DSM itself) on the same domain or subdomains.
4. **HTTPS/SSL:**
   * Cloudflare provides SSL certificates automatically at the proxy level. Users see a secure lock icon (`https://`) instantly.

---

## 4. Easy Content Management for the Hotel Boss

To allow the boss to update room rates, descriptions, and policies easily from a browser or phone without writing code:

### Option 1: Google Sheets API (Recommended - Easiest & Free)
* **Concept:** Store room data and pricing inside a private Google Sheet.
* **Next.js Integration:** Use the Google API client in Next.js to fetch Sheet rows during build/request time.
* **Caching:** Enable Next.js **Incremental Static Regeneration (ISR)**:
  `export const revalidate = 600; // updates every 10 minutes`
* **Admin Experience:** The boss edits room details or prices on the Google Sheets mobile app. Within 10 minutes, the website pulls the new values automatically. Zero maintenance needed.

### Option 2: Self-Hosted Headless CMS (Payload / Strapi / Directus)
* **Concept:** Deploy an administrative container (e.g., Payload CMS using PostgreSQL/SQLite) alongside the website on your NAS.
* **Integration:** Next.js fetches data from the local CMS REST/GraphQL endpoint.
* **Admin Experience:** The boss gets a dedicated website dashboard (e.g. `admin.8688bnb.com`) with rich text editors, image upload widgets, and draft/publish controls.
