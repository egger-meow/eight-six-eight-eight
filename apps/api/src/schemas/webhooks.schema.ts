import { z } from 'zod';

export const WebhookIngestSchema = z.object({
  event_type: z.enum(['new_booking', 'modify_booking', 'cancel_booking', 'rate_update', 'inventory_update']),
  platform: z.string().max(50),
  external_booking_id: z.string().max(100).optional(),
  data: z.record(z.any()).optional(),
});

export const WebhookEventUpdateSchema = z.object({
  status: z.enum(['processed', 'ignored', 'failed']),
  error_message: z.string().max(500).optional(),
});
