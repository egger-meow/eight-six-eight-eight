import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery } from '../middleware/validate';
import { RoomCreateSchema, RoomUpdateSchema } from '../schemas/rooms.schema';
import { DateRangeQuerySchema, SlugParamSchema } from '../schemas/common.schema';

import { db } from '@8688bnb/db';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const rooms = await db.room.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAdmin, doubleCsrfProtection, validate(RoomCreateSchema), (req, res) => {
  // TODO: Save to DB
  res.status(201).json({ success: true, data: { ...req.body, id: 1 } });
});

router.get('/:slug', validateQuery(SlugParamSchema), async (req, res, next) => {
  try {
    const room = await db.room.findUnique({
      where: { slug: req.params.slug }
    });
    if (!room) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
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
