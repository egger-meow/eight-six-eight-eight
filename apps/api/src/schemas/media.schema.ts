import { z } from 'zod';

export const MediaUpdateSchema = z.object({
  alt_text: z.string().max(200).optional(),
  target: z.string().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const MediaReorderSchema = z.object({
  image_ids: z.array(z.number().int()).min(1).max(50),
});
