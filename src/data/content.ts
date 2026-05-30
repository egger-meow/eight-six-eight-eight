/**
 * content.ts
 * Single source of truth for all bilingual site content.
 * Add / edit text here — components pull from this data.
 */

export type Lang = 'zh' | 'en';

/* ────────────────────────────────────────────────
   NAV
──────────────────────────────────────────────── */
export const nav = {
  logo: { zh: '86.88民宿', en: '86.88 B&B' },
  links: [
    { href: '/about',        zh: '關於我們', en: 'About Us'      },
    { href: '/rooms',        zh: '客房介紹', en: 'Rooms'         },
    { href: '/booking-info', zh: '訂房資訊', en: 'Booking Info'  },
    { href: '/location',     zh: '民宿位置', en: 'Location'      },
    {
      href: 'http://line.naver.jp/ti/p/~@gps2290j',
      zh: 'LINE 訂房',
      en: 'LINE Reserve',
      external: true,
    },
  ],
  reserveBtn: { zh: '立即預訂', en: 'Reserve Now' },
} as const;

/* ────────────────────────────────────────────────
   SIDE BOX
──────────────────────────────────────────────── */
export const sideBox = {
  title:   { zh: '歡迎蒞臨入住', en: 'Welcome' },
  reserve: { zh: '訂房',        en: 'RESERVE'  },
  mail:    { zh: 'MAIL 洽詢',   en: 'MAIL'     },
} as const;

/* ────────────────────────────────────────────────
   HERO
──────────────────────────────────────────────── */
export const hero = {
  location: { zh: '宜蘭．三星', en: 'Yilan · Sanxing' },
  lines:    ['86.88', 'BNB'],                 // always stylized in EN
  subtitle: {
    zh: '歐風質感精緻渡假｜貓咪陪伴 療癒人心',
    en: 'European-style Boutique B&B · Healing Cat Companions',
  },
  ctaRooms:   { zh: '探索客房', en: 'Explore Rooms'  },
  ctaReserve: { zh: '立即預訂', en: 'Reserve Now'    },
  slides: [
    { src: '/images/index-page/dex1.jpg',     alt: { zh: '86.88民宿 大廳',  en: '86.88 B&B Lobby'    } },
    { src: '/images/index-page/dex2.jpg',     alt: { zh: '86.88民宿 露台',  en: '86.88 B&B Terrace'  } },
    { src: '/images/index-page/dex3.jpg',     alt: { zh: '86.88民宿 餐廳',  en: '86.88 B&B Dining'   } },
    { src: '/images/index-page/dex4.jpg',     alt: { zh: '86.88民宿 客廳',  en: '86.88 B&B Lounge'   } },
    { src: '/images/exterior/building-1.jpg', alt: { zh: '86.88民宿 建築',  en: '86.88 B&B Exterior' } },
  ],
} as const;

/* ────────────────────────────────────────────────
   NEWS / GALLERY
──────────────────────────────────────────────── */
export const newsSection = {
  label:    { zh: '最新消息', en: 'Latest News'  },
  labelEn:  'NEWS',
  items: [
    { src: '/images/exterior/building-1.jpg',             label: { zh: '民宿外觀',  en: 'Exterior'      }, date: '2024-01' },
    { src: '/images/public-spaces/dining-area-1.jpg',     label: { zh: '餐廳空間',  en: 'Dining Area'   }, date: '2024-01' },
    { src: '/images/public-spaces/dining-area-2.jpg',     label: { zh: '交誼空間',  en: 'Common Area'   }, date: '2024-01' },
    { src: '/images/public-spaces/2f-lounge.jpg',         label: { zh: '二樓交誼廳', en: '2F Lounge'    }, date: '2024-01' },
    { src: '/images/public-spaces/3f-lounge-1.jpg',       label: { zh: '三樓空間',  en: '3F Space'      }, date: '2024-01' },
    { src: '/images/exterior/building-2.jpg',             label: { zh: '建築外觀',  en: 'Building'      }, date: '2024-01' },
    { src: '/images/rooms/pastoral-quad/main/main.jpg',   label: { zh: '四人房',    en: 'Quad Room'     }, date: '2024-01' },
    { src: '/images/rooms/romantic-double/main/main.jpg', label: { zh: '景觀二人房', en: 'Scenic Double' }, date: '2024-01' },
  ],
} as const;

/* ────────────────────────────────────────────────
   ABOUT
──────────────────────────────────────────────── */
export const aboutSection = {
  labelEn: 'ABOUT US',
  title:   { zh: '關於86.88民宿', en: 'About 86.88 B&B' },
  body: {
    zh: '宜蘭三星的86.88民宿，歐風質感建築設計，一樓寬敞木質感客廳，還有貓咪的溫情陪伴，讓您在這身心都放鬆。每間房的精緻裝潢，窗外安農溪畔美景，戶外大露台眺望整片星空，享受猶如在國外的輕鬆度假風格，86.88民宿是您來宜蘭的民宿首選！',
    en: 'Nestled in Sanxing, Yilan, 86.88 B&B features elegant European-style architecture, a spacious wooden lounge, and adorable resident cats to soothe your soul. Each room is meticulously decorated with views of the Annon River. The rooftop terrace offers panoramic stargazing — your perfect escape in Yilan.',
  },
  readMore: { zh: '了解更多', en: 'Read More' },
  bgImage: '/images/public-spaces/3f-lounge-2.jpg',
} as const;

/* ────────────────────────────────────────────────
   STAY
──────────────────────────────────────────────── */
export const staySection = {
  labelEn: 'STAY',
  title:   { zh: '客房介紹', en: 'Our Rooms'    },
  detail:  { zh: '瞭解更多', en: 'More Detail'  },
  rooms: [
    {
      slug:    'pastoral-quad',
      image:   '/images/rooms/pastoral-quad/main/main.jpg',
      name:    { zh: '田園鄉村 四人房', en: 'Country Quad'         },
      size:    'large',
    },
    {
      slug:    'romantic-double',
      image:   '/images/rooms/romantic-double/main/main.jpg',
      name:    { zh: '浪漫情懷 景觀二人房', en: 'Scenic Double'    },
      size:    'tall',
    },
    {
      slug:    'rustic-double',
      image:   '/images/rooms/rustic-double/main/main.jpg',
      name:    { zh: '質樸愜意 二人房', en: 'Simple Double'        },
      size:    'sm',
    },
    {
      slug:    'warm-sweet-double',
      image:   '/images/rooms/warm-sweet-double/main/room31.jpg',
      name:    { zh: '溫潤甜蜜 二人房', en: 'Warm Double'          },
      size:    'sm',
    },
    {
      slug:    'cozy-country-double',
      image:   '/images/rooms/cozy-country-double/main/room51.jpg',
      name:    { zh: '鄉村溫馨 二人房', en: 'Country Double'       },
      size:    'sm',
    },
  ],
} as const;

/* ────────────────────────────────────────────────
   FEATURES
──────────────────────────────────────────────── */
export const featuresSection = {
  items: [
    {
      icon: '🏡',
      enTitle: '8688',
      zh: { sub: '宜蘭三星', desc: '位於安農溪畔，擁有歐風質感建築，寬廣的草坪與戶外大露台，盡享田園靜謐時光。' },
      en: { sub: 'Sanxing, Yilan', desc: 'Set along the Annon River with European architecture, lush lawns, and a sprawling rooftop terrace for quiet countryside moments.' },
    },
    {
      icon: '🐈',
      enTitle: 'CATS',
      zh: { sub: '貓咪療癒', desc: '親人可愛的貓咪常駐民宿，陪伴您度過每個美好時刻，療癒身心靈，增添溫馨回憶。' },
      en: { sub: 'Healing Cats', desc: 'Our friendly resident cats are always around to comfort guests, adding warmth and unforgettable memories to every stay.' },
    },
    {
      icon: '🛏️',
      enTitle: 'BNB',
      zh: { sub: '精緻住宿', desc: '多種主題房型精緻裝潢，情侶、家庭、朋友皆宜，每一夜都是難忘的旅遊體驗。' },
      en: { sub: 'Boutique Stays', desc: 'Multiple themed rooms with refined décor — ideal for couples, families, or friends. Every night is a memorable getaway.' },
    },
  ],
} as const;

/* ────────────────────────────────────────────────
   PARALLAX
──────────────────────────────────────────────── */
export const parallax = {
  divider1: { src: '/images/index-page/dex2.jpg',         alt: { zh: '民宿視差背景', en: 'B&B Parallax'  } },
  divider2: { src: '/images/public-spaces/3f-lounge-1.jpg', alt: { zh: '三樓交誼廳',  en: '3F Common Area' } },
} as const;

/* ────────────────────────────────────────────────
   MAP / CONTACT
──────────────────────────────────────────────── */
export const mapSection = {
  labelEn: 'LOCATION',
  title:   { zh: '如何到達', en: 'Getting Here' },
  route: {
    zh: [
      '羅東火車站',
      '往南行 站東路 → 傳藝路三段',
      '右轉 中山路二段 / 台7丙線',
      '右轉 健富路一段 / 宜47鄉道',
      '拱照十二路 → 86.88 B&B 🏡',
    ],
    en: [
      'Luodong Train Station',
      'Head south on Zhandong Rd → Chuanyi Rd Sec. 3',
      'Turn right onto Zhongshan Rd Sec. 2 / Hwy 7C',
      'Turn right onto Jianfu Rd Sec. 1 / County Rd 47',
      'Gongzhao 12th Rd → 86.88 B&B 🏡',
    ],
  },
  contact: [
    { label: { zh: '地址',   en: 'Address'   }, value: { zh: '宜蘭縣三星鄉拱照十二路86號', en: 'No.86, Gongzhao 12th Rd, Sanxing, Yilan' }, href: null },
    { label: { zh: '訂房專線', en: 'Phone'   }, value: { zh: '0920-900-793', en: '0920-900-793' }, href: 'tel:0920900793' },
    { label: { zh: '室話',   en: 'Landline'  }, value: { zh: '039-892-345',  en: '039-892-345'  }, href: 'tel:039892345'  },
    { label: { zh: 'EMAIL',  en: 'Email'     }, value: { zh: '86.88hello@gmail.com', en: '86.88hello@gmail.com' }, href: 'mailto:86.88hello@gmail.com' },
    { label: { zh: 'LINE',   en: 'LINE'      }, value: { zh: '@gps2290j', en: '@gps2290j' }, href: 'http://line.naver.jp/ti/p/~@gps2290j' },
    { label: { zh: '合法編號', en: 'License' }, value: { zh: '1767', en: '1767' }, href: null },
  ],
  mapEmbedSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3625.688903171667!2d121.68133915112652!3d24.668834384066827!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3467e1a4d3aa5a45%3A0x933381d71a4a5d28!2s86.88%20B%26B!5e0!3m2!1szh-TW!2stw!4v1632188957026!5m2!1szh-TW!2stw',
} as const;

/* ────────────────────────────────────────────────
   FOOTER
──────────────────────────────────────────────── */
export const footer = {
  followLabel: 'FOLLOW US',
  social: [
    { label: { zh: 'Facebook', en: 'Facebook'   }, href: 'https://www.facebook.com/86.88bnb/', icon: 'fab fa-facebook',      cls: 'fb'   },
    { label: { zh: 'LINE',     en: 'LINE'        }, href: 'http://line.naver.jp/ti/p/~@gps2290j', icon: 'fab fa-line',      cls: 'line' },
    { label: { zh: '電話',     en: 'Phone Call'  }, href: 'tel:0920900793',                    icon: 'fas fa-phone-square', cls: 'tel'  },
  ],
  copyright: {
    zh: '版權所有',
    en: 'All Rights Reserved',
  },

  address:    { zh: '宜蘭縣三星鄉拱照十二路86號', en: 'No.86, Gongzhao 12th Rd, Sanxing, Yilan' },
  licenseNum: '1767',
} as const;

/* ────────────────────────────────────────────────
   MOBILE BOT BAR
──────────────────────────────────────────────── */
export const botBar = {
  reserve: { zh: '訂房', en: 'RESERVE' },
} as const;

/* ────────────────────────────────────────────────
   ABOUT PAGE
──────────────────────────────────────────────── */
export const aboutPage = {
  metaTitle:  { zh: '關於我們｜86.88民宿', en: 'About Us | 86.88 B&B' },
  h1:         { zh: '關於86.88民宿',         en: 'About 86.88 B&B'      },
  intro: {
    zh: '宜蘭三星的86.88民宿，歐風質感建築設計，一樓寬敞木質感客廳，還有貓咪的溫情陪伴，讓您在這身心都放鬆。每間房的精緻裝潢，窗外安農溪畔美景，戶外大露台眺望整片星空，享受猶如在國外的輕鬆度假風格。',
    en: 'Nestled in Sanxing, Yilan, 86.88 B&B blends European elegance with Taiwanese hospitality. A spacious wooden lounge, adorable resident cats, river views, and a stunning rooftop terrace await you.',
  },
  features: [
    { icon: '🏡', zh: '歐風質感建築', en: 'European Architecture' },
    { icon: '🐈', zh: '貓咪陪伴療癒', en: 'Healing Cat Companions' },
    { icon: '🌊', zh: '安農溪畔美景', en: 'Annon River Views' },
    { icon: '⭐', zh: '星空露台夜景', en: 'Stargazing Terrace' },
    { icon: '🚗', zh: '專屬停車空間', en: 'Private Parking' },
    { icon: '🌿', zh: '寬廣庭院草坪', en: 'Spacious Garden Lawn' },
  ],
} as const;

/* ────────────────────────────────────────────────
   ROOMS PAGE
──────────────────────────────────────────────── */
export const roomsPage = {
  metaTitle: { zh: '客房介紹｜86.88民宿', en: 'Rooms | 86.88 B&B' },
  h1:        { zh: '客房介紹',            en: 'Our Rooms'          },
  subtitle:  { zh: '每間客房都是精心設計的藝術品', en: 'Every room is a carefully crafted masterpiece' },
  priceLabels: {
    weekday: { zh: '平日', en: 'Weekday' },
    weekend: { zh: '假日', en: 'Weekend' },
    holiday: { zh: '連假', en: 'Holiday' },
    unit:    { zh: '元/晚', en: 'TWD/night' },
  },
  capacity:   { zh: '人', en: ' guests' },
  detailBtn:  { zh: '查看詳情', en: 'View Details' },
  bookBtn:    { zh: '立即預訂', en: 'Reserve'       },
} as const;

/* ────────────────────────────────────────────────
   BOOKING INFO PAGE
──────────────────────────────────────────────── */
export const bookingInfoPage = {
  metaTitle: { zh: '訂房資訊｜86.88民宿', en: 'Booking Info | 86.88 B&B' },
  h1:        { zh: '訂房資訊',            en: 'Booking Information'       },
  sections: [
    {
      title: { zh: '訂房方式',     en: 'How to Book'       },
      items: {
        zh: ['透過LINE官方帳號：@gps2290j', '電話訂房：0920-900-793', '電子郵件：86.88hello@gmail.com'],
        en: ['LINE Official Account: @gps2290j', 'Phone: 0920-900-793', 'Email: 86.88hello@gmail.com'],
      },
    },
    {
      title: { zh: '入退房時間',   en: 'Check-in / Check-out' },
      items: {
        zh: ['入住時間：15:00 以後', '退房時間：11:00 以前'],
        en: ['Check-in: After 15:00', 'Check-out: Before 11:00'],
      },
    },
    {
      title: { zh: '取消政策',     en: 'Cancellation Policy'   },
      items: {
        zh: ['入住前7天取消：全額退費', '入住前3-6天取消：收取50%費用', '入住前3天內取消：不予退費'],
        en: ['7+ days before: Full refund', '3-6 days before: 50% charge', 'Within 3 days: No refund'],
      },
    },
    {
      title: { zh: '注意事項',     en: 'House Rules'           },
      items: {
        zh: ['民宿內禁止吸菸', '請愛護可愛的貓咪', '22:00 後請保持安靜', '不可攜帶寵物入住'],
        en: ['No smoking inside', 'Please be gentle with our cats', 'Quiet hours after 22:00', 'No pets allowed'],
      },
    },
  ],
} as const;

/* ────────────────────────────────────────────────
   LOCATION PAGE
──────────────────────────────────────────────── */
export const locationPage = {
  metaTitle: { zh: '民宿位置｜86.88民宿', en: 'Location | 86.88 B&B'          },
  h1:        { zh: '民宿位置',            en: 'Getting Here'                    },
  address:   { zh: '宜蘭縣三星鄉拱照十二路86號', en: 'No.86, Gongzhao 12th Rd, Sanxing, Yilan County' },
  mapEmbedSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3625.688903171667!2d121.68133915112652!3d24.668834384066827!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3467e1a4d3aa5a45%3A0x933381d71a4a5d28!2s86.88%20B%26B!5e0!3m2!1szh-TW!2stw!4v1632188957026!5m2!1szh-TW!2stw',
} as const;
