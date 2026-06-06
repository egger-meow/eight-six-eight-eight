import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery } from '../middleware/validate';
import { BookingCreateSchema, BookingUpdateSchema, BookingNoteSchema } from '../schemas/bookings.schema';
import { PaginationQuerySchema, IdParamSchema, DateRangeQuerySchema } from '../schemas/common.schema';

const router = Router();

router.get('/', requireAdmin, validateQuery(PaginationQuerySchema), (req, res) => {
  // TODO: Fetch from DB
  res.json({ success: true, data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } });
});

router.post('/', validate(BookingCreateSchema), (req, res) => {
  // Public endpoint
  // TODO: Save to DB
  res.status(201).json({ success: true, data: { ...req.body, id: 1, status: 'pending' } });
});

router.get('/calendar', requireAdmin, validateQuery(DateRangeQuerySchema), (req, res) => {
  // TODO: Fetch calendar data from DB
  res.json({
    success: true,
    data: {
      from: req.query.from,
      to: req.query.to,
      rooms: []
    }
  });
});

router.get('/:id', requireAdmin, validateQuery(IdParamSchema), (req, res) => {
  // TODO: Fetch from DB
  res.json({ success: true, data: { id: req.params.id } });
});

router.put('/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), validate(BookingUpdateSchema), (req, res) => {
  // TODO: Update DB
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});

router.delete('/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), (req, res) => {
  // TODO: Delete from DB
  res.json({ success: true, data: { message: '預約已刪除' } });
});

router.post('/:id/notes', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), validate(BookingNoteSchema), (req, res) => {
  // TODO: Save to DB
  res.status(201).json({ success: true, data: { id: 1, booking_id: req.params.id, ...req.body } });
});

export default router;
