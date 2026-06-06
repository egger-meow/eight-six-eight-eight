import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery } from '../middleware/validate';
import { RoomCreateSchema, RoomUpdateSchema } from '../schemas/rooms.schema';
import { DateRangeQuerySchema, SlugParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', (req, res) => {
  // TODO: Fetch from DB
  res.json({ success: true, data: [] });
});

router.post('/', requireAdmin, doubleCsrfProtection, validate(RoomCreateSchema), (req, res) => {
  // TODO: Save to DB
  res.status(201).json({ success: true, data: { ...req.body, id: 1 } });
});

router.get('/:slug', validateQuery(SlugParamSchema), (req, res) => {
  // TODO: Fetch from DB
  res.json({ success: true, data: { id: 1, slug: req.params.slug } });
});

router.put('/:slug', requireAdmin, doubleCsrfProtection, validateQuery(SlugParamSchema), validate(RoomUpdateSchema), (req, res) => {
  // TODO: Update DB
  res.json({ success: true, data: { ...req.body, slug: req.params.slug } });
});

router.delete('/:slug', requireAdmin, doubleCsrfProtection, validateQuery(SlugParamSchema), (req, res) => {
  // TODO: Soft delete in DB
  res.json({ success: true, data: { message: '房型已停用' } });
});

router.get('/:slug/availability', validateQuery(SlugParamSchema), validateQuery(DateRangeQuerySchema), (req, res) => {
  // TODO: Check DB bookings & blocked dates
  res.json({
    success: true,
    data: {
      available: true,
      room_slug: req.params.slug,
      from: req.query.from,
      to: req.query.to,
      conflicts: [],
      estimated_price: 3000
    }
  });
});

export default router;
