import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery } from '../middleware/validate';
import { NewsCreateSchema, NewsUpdateSchema } from '../schemas/news.schema';
import { IdParamSchema, PaginationQuerySchema } from '../schemas/common.schema';
import { db } from '@8688bnb/db';

const router = Router();

router.get('/', validateQuery(PaginationQuerySchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const per_page = Number(req.query.per_page || 10);
    
    // Only return visible news for public endpoint
    const where = { visible: true };
    const [total, news] = await Promise.all([
      db.news.count({ where }),
      db.news.findMany({
        where,
        skip: (page - 1) * per_page,
        take: per_page,
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }]
      })
    ]);

    res.json({
      success: true,
      data: news,
      meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) }
    });
  } catch (error) {
    next(error);
  }
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
