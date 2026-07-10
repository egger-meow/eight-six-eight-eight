import roomsJson from '@/data/rooms.json';
import { catProfiles, hero, newsSection } from '@/data/content';

export type WebsiteMedia = {
  id?: number;
  target?: string;
  url: string;
  alt_text?: string | null;
  sort_order?: number;
};

export type WebsiteRoom = {
  id: number | string;
  slug: string;
  name_zh: string;
  name_en?: string | null;
  capacity: number;
  type: string;
  description?: string | null;
  price_weekday: number;
  price_weekend: number;
  price_holiday: number;
  available?: boolean;
  sort_order?: number;
  images: WebsiteMedia[];
};

export type WebsiteNews = {
  id: number;
  title: string;
  content: string;
  published_at: string | null;
  visible: boolean;
  pinned: boolean;
};

export type WebsitePage = {
  id?: number;
  slug: string;
  title_zh: string;
  title_en?: string | null;
  content_html?: string | null;
  meta?: Record<string, any> | null;
  published?: boolean;
};

export type AvailabilityResult = {
  available: boolean;
  room_slug: string;
  from: string;
  to: string;
  conflicts: Array<{ type: string; id?: number; status?: string; reason?: string }>;
  estimated_price: number;
  pricing_flags?: {
    special_weekend?: boolean;
    holiday?: boolean;
  };
};

export type BookingPayload = {
  room_id: number;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_phone: string;
  guest_line_id?: string;
  guest_count: number;
  notes?: string;
};

export type BookingResult = BookingPayload & {
  id: number;
  total_price: number | null;
  status: string;
  room?: {
    id: number;
    slug: string;
    name_zh: string;
    type: string;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
};

const fallbackRooms: WebsiteRoom[] = roomsJson.map((room) => ({
  ...room,
  images: room.images.map((url, index) => ({
    url,
    alt_text: room.name_zh,
    sort_order: index * 10,
  })),
}));

const fallbackMedia: Record<string, WebsiteMedia[]> = {
  homepage_hero: hero.slides.map((slide, index) => ({
    url: slide.src,
    alt_text: slide.alt.zh,
    sort_order: index * 10,
  })),
  gallery: newsSection.items.map((item, index) => ({
    url: item.src,
    alt_text: item.label.zh,
    sort_order: index * 10,
  })),
  booking_info: [{ url: '/images/index-page/dex2.jpg', alt_text: '訂房資訊', sort_order: 10 }],
  location: [{ url: '/images/exterior/building-2.jpg', alt_text: '民宿位置', sort_order: 10 }],
  cat_tokyo: [{ url: '/images/index-page/rgimg1.jpg', alt_text: 'Tokyo', sort_order: 10 }],
  cat_sakura: [{ url: '/images/index-page/rgimg2.jpg', alt_text: 'Sakura', sort_order: 10 }],
  cat_sake: [{ url: '/images/index-page/rgimg3.jpg', alt_text: 'Sake', sort_order: 10 }],
  cat_dajin: [{ url: '/images/index-page/rgimg4.jpg', alt_text: '大金', sort_order: 10 }],
  cat_dayin: [{ url: '/images/index-page/rgimg5.jpg', alt_text: '大銀', sort_order: 10 }],
};

export const hasWebsiteApi = Boolean(process.env.NEXT_PUBLIC_API_URL);

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
}

export function mediaUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/images/')) {
    return url;
  }
  if (url.startsWith('/')) {
    const base = apiBaseUrl().replace(/\/api\/v1$/, '');
    return base ? `${base}${url}` : url;
  }
  return url;
}

function fallbackRoomBySlug(slug: string) {
  return fallbackRooms.find((room) => room.slug === slug) || null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !body?.success) {
    throw new Error(body?.error?.message || `API request failed: ${response.status}`);
  }

  return body.data;
}

function normalizeRoom(room: any): WebsiteRoom {
  const fallback = fallbackRoomBySlug(room.slug);
  const images = Array.isArray(room.images) && room.images.length > 0
    ? room.images.map((image: any, index: number) => ({
        ...image,
        url: mediaUrl(typeof image === 'string' ? image : image.url),
        alt_text: image?.alt_text ?? room.name_zh,
        sort_order: image?.sort_order ?? index * 10,
      }))
    : fallback?.images || [];

  return {
    id: room.id,
    slug: room.slug,
    name_zh: room.name_zh,
    name_en: room.name_en,
    capacity: room.capacity,
    type: room.type,
    description: room.description,
    price_weekday: room.price_weekday,
    price_weekend: room.price_weekend,
    price_holiday: room.price_holiday,
    available: room.available,
    sort_order: room.sort_order,
    images,
  };
}

export async function getRooms(): Promise<{ rooms: WebsiteRoom[]; fromApi: boolean }> {
  try {
    const rooms = await request<any[]>('/rooms');
    return { rooms: rooms.map(normalizeRoom), fromApi: true };
  } catch {
    return { rooms: fallbackRooms, fromApi: false };
  }
}

export async function getRoom(slug: string): Promise<{ room: WebsiteRoom | null; fromApi: boolean }> {
  try {
    return { room: normalizeRoom(await request<any>(`/rooms/${slug}`)), fromApi: true };
  } catch {
    return { room: fallbackRoomBySlug(slug), fromApi: false };
  }
}

export async function getMedia(target: string): Promise<{ media: WebsiteMedia[]; fromApi: boolean }> {
  try {
    const media = await request<any[]>(`/media?target=${encodeURIComponent(target)}&per_page=50`);
    return {
      media: media.map((item) => ({ ...item, url: mediaUrl(item.url) })),
      fromApi: true,
    };
  } catch {
    return { media: fallbackMedia[target] || [], fromApi: false };
  }
}

export async function getPage(slug: string): Promise<{ page: WebsitePage | null; fromApi: boolean }> {
  try {
    return { page: await request<WebsitePage>(`/pages/${encodeURIComponent(slug)}`), fromApi: true };
  } catch {
    if (slug === 'cats') {
      return { page: { slug: 'cats', title_zh: '民宿貓貓', title_en: 'Resident Cats', meta: { cats: Object.fromEntries(catProfiles.map((cat) => [cat.key, cat.description])) } }, fromApi: false };
    }
    return { page: null, fromApi: false };
  }
}

export async function getNews(perPage = 8): Promise<{ news: WebsiteNews[]; fromApi: boolean }> {
  try {
    return { news: await request<WebsiteNews[]>(`/news?per_page=${perPage}`), fromApi: true };
  } catch {
    return { news: [], fromApi: false };
  }
}

export async function checkAvailability(
  slug: string,
  from: string,
  to: string
): Promise<AvailabilityResult> {
  return request<AvailabilityResult>(
    `/rooms/${encodeURIComponent(slug)}/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}

export async function checkAllRoomsAvailability(
  rooms: WebsiteRoom[],
  from: string,
  to: string
): Promise<Record<string, AvailabilityResult>> {
  const entries = await Promise.all(
    rooms.map(async (room) => {
      try {
        return [room.slug, await checkAvailability(room.slug, from, to)] as const;
      } catch {
        return [room.slug, null] as const;
      }
    })
  );

  return Object.fromEntries(entries.filter((entry): entry is readonly [string, AvailabilityResult] => Boolean(entry[1])));
}

export async function createBooking(payload: BookingPayload): Promise<BookingResult> {
  return request<BookingResult>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
