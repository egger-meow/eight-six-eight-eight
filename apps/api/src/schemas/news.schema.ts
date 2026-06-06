import { z } from 'zod';

export const NewsCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  published_at: z.string().date().optional().nullable(),
  visible: z.boolean().default(true),
  pinned: z.boolean().default(false),
});

export const NewsUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(5000).optional(),
  published_at: z.string().date().optional().nullable(),
  visible: z.boolean().optional(),
  pinned: z.boolean().optional(),
});
