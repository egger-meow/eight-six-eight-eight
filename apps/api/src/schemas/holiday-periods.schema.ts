import { z } from 'zod';

export const HolidayPricingTypeSchema = z.enum(['weekend', 'holiday']);

export const HolidayPeriodCreateSchema = z.object({
  name: z.string().min(1).max(100),
  start_date: z.string().date(),
  end_date: z.string().date(),
  pricing_type: HolidayPricingTypeSchema.default('weekend'),
});

export const HolidayPeriodUpdateSchema = HolidayPeriodCreateSchema.partial();
