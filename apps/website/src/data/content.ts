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
    { href: '/cats',         zh: '民宿貓貓', en: 'Cats'          },
    { href: '/booking',      zh: '預約訂房', en: 'Reservation'   },
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
    weekday: { zh: '平日價', en: 'Weekday Rate' },
    weekend: { zh: '假日價', en: 'Holiday/Weekend Rate' },
    holiday: { zh: '過年價', en: 'Chinese New Year Rate' },
    unit:    { zh: '元/晚', en: 'TWD/night' },
  },
  priceNotes: {
    weekday: { zh: '週日至週五、連假最後一晚', en: 'Sunday-Friday and the final night of long weekends' },
    weekend: { zh: '週六及指定假日；單日假日使用假日價', en: 'Saturday and configured public holidays; one-day holidays use this rate' },
    holiday: { zh: '春節/過年期間所有晚數', en: 'All nights during Chinese New Year periods' },
  },
  capacity:   { zh: '人', en: ' guests' },
  detailBtn:  { zh: '查看詳情', en: 'View Details' },
  bookBtn:    { zh: '立即預訂', en: 'Reserve'       },
} as const;

/* ────────────────────────────────────────────────
   BOOKING PAGE
──────────────────────────────────────────────── */
export const bookingPage = {
  metaTitle: { zh: '預約訂房｜86.88民宿', en: 'Reservation | 86.88 B&B' },
  label: { zh: 'RESERVATION', en: 'RESERVATION' },
  h1: { zh: '預約訂房', en: 'Reservation' },
  subtitle: {
    zh: '送出預約後由民宿主人確認房況與付款細節',
    en: 'Submit a request and the host will confirm availability and payment details.',
  },
  reservationNotice: {
    zh: '官網預約功能開放中！目前已可於本網站送出預約申請。請注意：送出預約資料後，僅代表申請已送出，尚未等同訂房成功或保留房間。民宿主人將再透過電話或 LINE 與您確認房況、金額與入住細節；待雙方確認並完成訂金匯款後，才視為正式訂房成功。',
    en: 'Online reservation requests are now open. You can submit a request on this website. Please note: submitting the form means your request has been sent; it is not yet a confirmed booking or room hold. The host will confirm availability, price, and stay details by phone or LINE; the booking is official only after both sides confirm and the deposit transfer is completed.',
  },
  unavailableNotice: {
    zh: '線上空房查詢與送出暫時無法使用。您仍可填寫資料後使用 LINE 聯繫民宿主人。',
    en: 'Online availability and submission are temporarily unavailable. You can still prepare the details and contact the host via LINE.',
  },
  sections: {
    dates: { zh: '選擇日期', en: 'Dates' },
    room: { zh: '選擇房型', en: 'Room Type' },
    guest: { zh: '入住資料', en: 'Guest Details' },
    notes: { zh: '備註', en: 'Notes' },
  },
  fields: {
    checkIn: { zh: '入住日期', en: 'Check-in' },
    checkOut: { zh: '退房日期', en: 'Check-out' },
    guestCount: { zh: '入住人數', en: 'Guests' },
    name: { zh: '姓名', en: 'Name' },
    phone: { zh: '電話', en: 'Phone' },
    lineId: { zh: 'LINE ID（選填）', en: 'LINE ID (optional)' },
  },
  placeholders: {
    notes: { zh: '抵達時間、特殊需求或其他想先告知的事項', en: 'Arrival time, special requests, or anything else we should know' },
  },
  summary: {
    title: { zh: '訂房摘要', en: 'Reservation Summary' },
    nights: { zh: '晚數', en: 'Nights' },
    room: { zh: '房型', en: 'Room' },
    guests: { zh: '人數', en: 'Guests' },
    notSelected: { zh: '尚未選擇', en: 'Not selected' },
    price: { zh: '預估總價', en: 'Estimated Total' },
    priceNote: { zh: '實際金額與付款方式以民宿主人確認為準', en: 'Final price and payment method are confirmed by the host.' },
    specialWeekendPriceNote: { zh: '此日期包含指定假日/連假假日價；連假最後一晚依平日價計算。', en: 'This range includes configured public-holiday/long-weekend pricing; the final night of a long weekend is charged at the weekday rate.' },
    holidayPriceNote: { zh: '此日期包含過年價，春節期間所有晚數皆依過年價計算。', en: 'This range includes Chinese New Year pricing; all nights in that period use the Chinese New Year rate.' },
    mixedSpecialPriceNote: { zh: '此日期包含指定假日/連假假日價與過年價，實際金額以民宿主人確認為準。', en: 'This range includes configured public-holiday/long-weekend pricing and Chinese New Year pricing; the host will confirm the final amount.' },
    nightUnit: { zh: '晚', en: 'night' },
    nightUnitPlural: { zh: '晚', en: 'nights' },
    guestUnit: { zh: '人', en: 'guest' },
    guestUnitPlural: { zh: '人', en: 'guests' },
  },
  actions: {
    submit: { zh: '送出線上預約', en: 'Submit Reservation' },
    submitting: { zh: '送出中...', en: 'Submitting...' },
    line: { zh: '使用 LINE 聯繫確認', en: 'Confirm via LINE' },
    confirmSubmit: { zh: '確認送出預約申請', en: 'Submit Request' },
    confirmLine: { zh: '複製並開啟 LINE', en: 'Copy and Open LINE' },
    cancel: { zh: '取消', en: 'Cancel' },
  },
  confirmation: {
    submitTitle: { zh: '確認送出預約資料', en: 'Confirm Reservation Details' },
    lineTitle: { zh: '確認 LINE 訊息內容', en: 'Confirm LINE Message' },
    reservationNote: { zh: '提醒：送出後民宿主人將再透過電話或 LINE 確認房況、金額與入住細節；待雙方確認並完成訂金匯款後，才視為正式訂房成功。', en: 'Reminder: after submission, the host will confirm availability, price, and stay details by phone or LINE. The booking is official only after both sides confirm and the deposit transfer is completed.' },
    contact: { zh: '聯絡資料', en: 'Contact' },
    notes: { zh: '備註', en: 'Notes' },
    emptyNotes: { zh: '未填寫', en: 'None' },
  },
  messages: {
    selectRoom: { zh: '請選擇房型。', en: 'Please select a room type.' },
    invalidDates: { zh: '退房日期必須晚於入住日期。', en: 'Check-out must be later than check-in.' },
    capacity: { zh: '此房型最多可入住', en: 'This room can host up to' },
    capacitySuffix: { zh: '人，請調整人數或選擇其他房型。', en: ' guests. Please adjust the guest count or choose another room.' },
    requiredContact: { zh: '請填寫姓名與電話，方便民宿主人確認訂房。', en: 'Please enter your name and phone number so the host can confirm the reservation.' },
    apiUnavailable: { zh: '線上空房查詢與送出暫時無法使用，請先使用 LINE 聯繫民宿主人。', en: 'Online availability and submission are temporarily unavailable. Please contact the host via LINE.' },
    unavailable: { zh: '此時段目前無法預約，請更換日期或透過 LINE 詢問其他安排。', en: 'This date range is unavailable. Please choose other dates or ask via LINE.' },
    success: { zh: '成功送出預約', en: 'Reservation submitted successfully.' },
    failure: { zh: '訂房送出失敗，請稍後再試或使用 LINE 聯繫。', en: 'Reservation failed. Please try again later or contact us via LINE.' },
    lineCopied: { zh: '訂房資訊已複製，請貼到 LINE 訊息中傳送給民宿主人。', en: 'Reservation details copied. Please paste them into LINE and send them to the host.' },
    lineCopyFailed: { zh: '無法自動複製訂房資訊，請手動複製摘要後使用 LINE 聯繫。', en: 'Could not copy reservation details automatically. Please copy the summary and contact us via LINE.' },
  },
} as const;

/* ────────────────────────────────────────────────
   BOOKING INFO PAGE
──────────────────────────────────────────────── */
export const bookingInfoPage = {
  metaTitle: { zh: '訂房資訊｜86.88民宿', en: 'Booking Info | 86.88 B&B' },
  h1: { zh: '訂房資訊', en: 'Booking Information' },
  intro: {
    zh: '官網預約功能開放中，可於本網站送出預約申請，民宿主人會再確認房況、價格與訂金匯款方式。',
    en: 'Online reservation requests are open. You can submit a request on this website, and the host will confirm availability, price, and deposit transfer details.',
  },
  contacts: [
    { label: { zh: 'LINE', en: 'LINE' }, value: '@gps2290j', href: 'http://line.naver.jp/ti/p/~@gps2290j' },
    { label: { zh: '訂房專線', en: 'Phone' }, value: '0920-900-793', href: 'tel:0920900793' },
    { label: { zh: '電子郵件', en: 'Email' }, value: '86.88hello@gmail.com', href: 'mailto:86.88hello@gmail.com' },
  ],
  sections: [
    {
      title: { zh: '訂房與付款確認', en: 'Reservation & Payment' },
      items: {
        zh: ['請先提供入住日期、退房日期、房型、人數與聯絡方式。', '民宿主人確認仍有空房後，會回覆實際價格與訂金匯款方式。', '待雙方確認並完成訂金匯款後，才視為正式訂房成功。'],
        en: ['Send your check-in date, check-out date, room type, guest count, and contact details first.', 'The host will reply with confirmed availability, final price, and deposit transfer details.', 'A booking is official only after both sides confirm and the deposit transfer is completed.'],
      },
    },
    {
      title: { zh: '入住與退房', en: 'Check-in / Check-out' },
      items: {
        zh: ['入住時間：15:00 以後。', '退房時間：11:00 以前。', '如需提早抵達或延後退房，請事先與民宿主人確認。'],
        en: ['Check-in: after 15:00.', 'Check-out: before 11:00.', 'Please confirm early arrival or late checkout with the host in advance.'],
      },
    },
    {
      title: { zh: '取消與異動', en: 'Cancellation & Changes' },
      items: {
        zh: ['取消、延期或更改房型，請盡早透過 LINE 或電話聯繫。', '退費與保留規則依主人確認與實際訂房平台規定為準。', '天候、交通或其他特殊狀況，請直接與主人討論處理方式。'],
        en: ['For cancellation, postponement, or room changes, contact us by LINE or phone as early as possible.', 'Refund and hold policies follow the host confirmation and the booking platform terms.', 'For weather, transport, or special circumstances, please discuss directly with the host.'],
      },
    },
    {
      title: { zh: '住宿須知', en: 'House Rules' },
      items: {
        zh: ['室內禁止吸菸。', '22:00 後請降低音量，維護住宿品質。', '請愛護民宿空間與貓咪，若有特殊需求請訂房時先告知。', '不可攜帶寵物入住，除非事前取得主人同意。'],
        en: ['No smoking indoors.', 'Please keep noise down after 22:00.', 'Please take care of the property and resident cats; mention special needs when booking.', 'Pets are not allowed unless approved by the host in advance.'],
      },
    },
  ],
  reservationNotice: {
    zh: '送出預約資料後，僅代表申請已送出，尚未等同訂房成功或保留房間。民宿主人將再透過電話或 LINE 與您確認房況、金額與入住細節；待雙方確認並完成訂金匯款後，才視為正式訂房成功。',
    en: 'Submitting reservation details means your request has been sent, but it is not yet a confirmed booking or room hold. The host will confirm availability, price, and stay details by phone or LINE; the booking is official only after both sides confirm and the deposit transfer is completed.',
  },
  contactAction: { zh: '聯繫民宿主人', en: 'Contact Host' },
} as const;

/* ────────────────────────────────────────────────
   CATS PAGE
──────────────────────────────────────────────── */
export const catProfiles = [
  {
    key: 'tokyo',
    target: 'cat_tokyo',
    name: { zh: 'Tokyo', en: 'Tokyo' },
    description: {
      zh: '喜歡在窗邊看風景，熟了以後會用很溫柔的方式陪客人坐一下。',
      en: 'Tokyo likes watching the garden from the window and quietly keeps guests company once familiar.',
    },
    tags: [
      { zh: '黏人姊妹', en: 'clingy sisters' },
      { zh: '窗邊巡守', en: 'window watch' },
      { zh: '慢熟溫柔', en: 'soft-hearted' },
    ],
  },
  {
    key: 'sakura',
    target: 'cat_sakura',
    name: { zh: 'Sakura', en: 'Sakura' },
    description: {
      zh: '個性親人，常常出現在公共空間，用可愛的眼神提醒大家放慢腳步。',
      en: 'Sakura is gentle and friendly, often appearing in shared spaces to remind everyone to slow down.',
    },
    tags: [
      { zh: '黏人姊妹', en: 'clingy sisters' },
      { zh: '撒嬌代表', en: 'cuddle chief' },
      { zh: '公共空間常駐', en: 'lounge regular' },
    ],
  },
  {
    key: 'sake',
    target: 'cat_sake',
    name: { zh: 'Sake', en: 'Sake' },
    description: {
      zh: '對每個角落都充滿好奇，偶爾會像小管家一樣檢查民宿動線。',
      en: 'Sake is curious about every corner and sometimes inspects the B&B like a tiny host.',
    },
    tags: [
      { zh: '唯一男生', en: 'only boy' },
      { zh: '好奇寶寶', en: 'curious one' },
      { zh: '小管家', en: 'tiny host' },
    ],
  },
  {
    key: 'dajin',
    target: 'cat_dajin',
    name: { zh: '大金', en: 'Da Jin' },
    description: {
      zh: '步調穩穩的，喜歡舒服的位置，是民宿裡讓人安心的存在。',
      en: 'Da Jin moves at an easy pace, finds the coziest spots, and brings a grounded calm to the house.',
    },
    tags: [
      { zh: '14歲', en: '14 years old' },
      { zh: '穩重派', en: 'steady soul' },
      { zh: '舒服位置達人', en: 'cozy spot pro' },
    ],
  },
  {
    key: 'dayin',
    target: 'cat_dayin',
    name: { zh: '大銀', en: 'Da Yin' },
    description: {
      zh: '最會享受午後時光，偶爾抬頭看你一眼，就足夠療癒一整天。',
      en: 'Da Yin knows how to enjoy a slow afternoon; one sleepy glance can brighten the whole day.',
    },
    tags: [
      { zh: '午後慵懶', en: 'slow afternoons' },
      { zh: '療癒眼神', en: 'healing gaze' },
      { zh: '放空專家', en: 'daydream pro' },
    ],
  },
] as const;

export const catsPage = {
  metaTitle: { zh: '民宿貓貓｜86.88民宿', en: 'Cats | 86.88 B&B' },
  label: { zh: 'CATS', en: 'CATS' },
  h1: { zh: '民宿貓貓', en: 'Resident Cats' },
  intro: {
    zh: '在86.88民宿，貓咪也是生活風景的一部分。認識 Tokyo、Sakura、Sake、大金與大銀，看看牠們平常最可愛的模樣。',
    en: 'At 86.88 B&B, cats are part of the everyday scenery. Meet Tokyo, Sakura, Sake, Da Jin, and Da Yin.',
  },
  detailLabel: { zh: '貓咪相簿', en: 'Cat Gallery' },
  emptyPhoto: { zh: '尚未上傳照片', en: 'No photos yet' },
  close: { zh: '關閉', en: 'Close' },
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
