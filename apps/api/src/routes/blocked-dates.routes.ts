import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery } from '../middleware/validate';
import { BlockedDateCreateSchema, BlockedDateUpdateSchema } from '../schemas/blocked-dates.schema';
import { IdParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', requireAdmin, (req, res) => {
  // TODO: Fetch from DB
  res.json({ success: true, data: [] });
});

router.post('/', requireAdmin, doubleCsrfProtection, validate(BlockedDateCreateSchema), (req, res) => {
  // TODO: Save to DB
  res.status(201).json({ success: true, data: { ...req.body, id: 1 } });
});

router.put('/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), validate(BlockedDateUpdateSchema), (req, res) => {
  // TODO: Update DB
  res.json({ success: true, data: { ...req.body, id: req.params.id } });
});

router.delete('/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), (req, res) => {
  // TODO: Delete from DB
  res.json({ success: true, data: { message: '封鎖日期已移除' } });
});

export default router;
