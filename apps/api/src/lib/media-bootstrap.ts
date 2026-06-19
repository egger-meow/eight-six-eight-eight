import { db } from '@8688bnb/db';

type SeedMedia = { url: string; altText: string };

const bundledMedia: Record<string, SeedMedia[]> = {
  homepage_hero: [
    { url: '/images/index-page/dex1.jpg', altText: '86.88民宿 大廳' },
    { url: '/images/index-page/dex2.jpg', altText: '86.88民宿 露台' },
    { url: '/images/index-page/dex3.jpg', altText: '86.88民宿 餐廳' },
    { url: '/images/index-page/dex4.jpg', altText: '86.88民宿 客廳' },
    { url: '/images/exterior/building-1.jpg', altText: '86.88民宿 建築' },
  ],
  homepage_8688: [{ url: '/images/exterior/building-1.jpg', altText: '86.88民宿外觀' }],
  homepage_cats: [{ url: '/images/index-page/rgimg3.jpg', altText: '民宿貓咪' }],
  homepage_bnb: [{ url: '/images/public-spaces/dining-area-1.jpg', altText: '民宿公共空間' }],
  about: [{ url: '/images/public-spaces/3f-lounge-2.jpg', altText: '關於86.88民宿' }],
  rooms_overview: [{ url: '/images/rooms/pastoral-quad/main/main.jpg', altText: '客房介紹' }],
  booking_info: [{ url: '/images/index-page/dex2.jpg', altText: '訂房資訊' }],
  location: [{ url: '/images/exterior/building-2.jpg', altText: '民宿位置' }],
  gallery: [
    { url: '/images/exterior/building-1.jpg', altText: '民宿外觀' },
    { url: '/images/public-spaces/dining-area-1.jpg', altText: '餐廳空間' },
    { url: '/images/public-spaces/dining-area-2.jpg', altText: '交誼空間' },
    { url: '/images/public-spaces/2f-lounge.jpg', altText: '二樓交誼廳' },
    { url: '/images/public-spaces/3f-lounge-1.jpg', altText: '三樓空間' },
    { url: '/images/exterior/building-2.jpg', altText: '建築外觀' },
    { url: '/images/rooms/pastoral-quad/main/main.jpg', altText: '四人房' },
    { url: '/images/rooms/romantic-double/main/main.jpg', altText: '景觀二人房' },
  ],
  'room_pastoral-quad': [
    { url: '/images/rooms/pastoral-quad/main/main.jpg', altText: '田園鄉村 四人房' },
  ],
  'room_romantic-double': [
    { url: '/images/rooms/romantic-double/main/main.jpg', altText: '浪漫情懷 景觀二人房' },
  ],
  'room_rustic-double': [
    { url: '/images/rooms/rustic-double/main/main.jpg', altText: '質樸愜意 二人房' },
  ],
  'room_warm-sweet-double': [
    { url: '/images/rooms/warm-sweet-double/main/room31.jpg', altText: '溫潤甜蜜 二人房' },
  ],
  'room_cozy-country-double': [
    { url: '/images/rooms/cozy-country-double/main/room51.jpg', altText: '鄉村溫馨 二人房' },
  ],
};

export function knownStaticMediaTargets() {
  return Object.keys(bundledMedia);
}

async function createMissingTargetItems(target: string, items: SeedMedia[]) {
  let sortOrder = 0;
  for (const item of items) {
    sortOrder += 10;
    const existing = await db.media.findFirst({ where: { target, url: item.url } });
    if (!existing) {
      await db.media.create({
        data: {
          target,
          filenameOriginal: item.url.split('/').pop() || item.url,
          filenameStored: item.url.split('/').pop() || item.url,
          url: item.url,
          mimeType: 'image/jpeg',
          sizeBytes: 0,
          altText: item.altText,
          sortOrder,
        },
      });
    }
  }
}

export async function bootstrapMediaTarget(target: string) {
  const items = bundledMedia[target];
  if (!items?.length) return;
  const count = await db.media.count({ where: { target } });
  if (count > 0) return;
  await createMissingTargetItems(target, items);
}

export async function bootstrapKnownMediaTargets() {
  await Promise.all(Object.keys(bundledMedia).map((target) => bootstrapMediaTarget(target)));
}
