import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery } from '../middleware/validate';
import { NewsCreateSchema, NewsUpdateSchema } from '../schemas/news.schema';
import { IdParamSchema, PaginationQuerySchema } from '../schemas/common.schema';

const router = Router();

router.get('/', validateQuery(PaginationQuerySchema), (req, res) => {
  // Public endpoint
  // TODO: Fetch from DB
  res.json({ success: true, data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } });
});

router.post('/', requireAdmin, doubleCsrfProtection, validate(NewsCreateSchema), (req, res) => {
  // TODO: Save to DB
  res.status(201).json({ success: true, data: { ...req.body, id: 1 } });
});

router.get('/:id', validateQuery(IdParamSchema), (req, res) => {
  // Public endpoint
  // TODO: Fetch from DB
  res.json({ success: true, data: { id: req.params.id } });
});

router.put('/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), validate(NewsUpdateSchema), (req, res) => {
  // TODO: Update DB
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});

router.delete('/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), (req, res) => {
  // TODO: Delete from DB
  res.json({ success: true, data: { message: '消息已刪除' } });
});

export default router;
