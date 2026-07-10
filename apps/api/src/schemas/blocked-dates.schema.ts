import { z } from 'zod';

export const BlockedDateCreateSchema = z.object({
  room_id: z.number().int().min(1).optional().nullable(),
  start_date: z.string().date(),
  end_date: z.string().date(),
  reason: z.string().min(1).max(200),
});

export const BlockedDateUpdateSchema = z.object({
  room_id: z.number().int().min(1).optional().nullable(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  reason: z.string().min(1).max(200).optional(),
});
