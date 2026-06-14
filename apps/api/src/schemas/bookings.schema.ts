import { z } from 'zod';

export const BookingCreateSchema = z.object({
  room_id: z.number().int().min(1),
  check_in: z.string().date(),
  check_out: z.string().date(),
  guest_name: z.string().min(1).max(100),
  guest_phone: z.string().min(1).max(30),
  guest_line_id: z.string().max(255).optional().or(z.literal('')),
  guest_count: z.number().int().min(1).max(10),
  notes: z.string().max(1000).optional(),
});

export const BookingUpdateSchema = z.object({
  room_id: z.number().int().min(1).optional(),
  check_in: z.string().date().optional(),
  check_out: z.string().date().optional(),
  guest_name: z.string().min(1).max(100).optional(),
  guest_phone: z.string().min(1).max(30).optional(),
  guest_line_id: z.string().max(255).optional().or(z.literal('')),
  guest_count: z.number().int().min(1).max(10).optional(),
  total_price: z.number().min(0).optional(),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
  notes: z.string().max(1000).optional(),
  source: z.enum(['website', 'phone', 'line', 'ota', 'walk_in', 'admin']).optional(),
  ota_platform: z.string().max(50).optional().nullable(),
  ota_booking_id: z.string().max(100).optional().nullable(),
});

export const BookingNoteSchema = z.object({
  content: z.string().min(1).max(1000),
});
