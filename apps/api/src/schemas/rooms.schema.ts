import { z } from 'zod';

export const RoomCreateSchema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name_zh: z.string().min(1).max(100),
  name_en: z.string().max(100).optional(),
  capacity: z.number().int().min(1).max(10),
  type: z.enum(['double', 'quad', 'suite']),
  description: z.string().max(2000).optional(),
  amenities: z.array(z.string().max(50)).max(30).optional(),
  price_weekday: z.number().min(0),
  price_weekend: z.number().min(0),
  price_holiday: z.number().min(0),
  available: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const RoomUpdateSchema = RoomCreateSchema.partial().omit({ slug: true });
