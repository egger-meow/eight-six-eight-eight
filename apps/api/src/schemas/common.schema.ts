import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(20),
});

export const DateRangeQuerySchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
});

export const IdParamSchema = z.object({
  id: z.coerce.number().min(1),
});

export const SlugParamSchema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]*$/),
});
