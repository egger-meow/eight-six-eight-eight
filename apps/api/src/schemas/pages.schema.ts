import { z } from 'zod';

export const PageUpdateSchema = z.object({
  title_zh: z.string().min(1).max(200).optional(),
  title_en: z.string().max(200).optional().nullable(),
  content_html: z.string().max(50000).optional(),
  meta: z.record(z.any()).optional().nullable(),
  published: z.boolean().optional(),
});
