import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { NewsCreateSchema, NewsUpdateSchema } from '../schemas/news.schema';
import { IdParamSchema, PaginationQuerySchema } from '../schemas/common.schema';
import { db } from '@8688bnb/db';

const router = Router();

function mapNewsToResponse(n: any) {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    published_at: n.publishedAt ? n.publishedAt.toISOString().split('T')[0] : null,
    visible: n.visible,
    pinned: n.pinned,
    created_at: n.createdAt.toISOString(),
    updated_at: n.updatedAt.toISOString()
  };
}

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
      data: news.map(mapNewsToResponse),
      meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAdmin, doubleCsrfProtection, validate(NewsCreateSchema), async (req, res, next) => {
  try {
    const data = req.body;
    const news = await db.news.create({
      data: {
        title: data.title,
        content: data.content,
        publishedAt: data.published_at ? new Date(data.published_at) : null,
        visible: data.visible !== undefined ? data.visible : true,
        pinned: data.pinned !== undefined ? data.pinned : false
      }
    });
    res.status(201).json({ success: true, data: mapNewsToResponse(news) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const news = await db.news.findUnique({ where: { id } });
    if (!news) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '消息不存在' } });
    }
    res.json({ success: true, data: mapNewsToResponse(news) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), validate(NewsUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    const existingNews = await db.news.findUnique({ where: { id } });
    if (!existingNews) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '消息不存在' } });
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.published_at !== undefined) updateData.publishedAt = data.published_at ? new Date(data.published_at) : null;
    if (data.visible !== undefined) updateData.visible = data.visible;
    if (data.pinned !== undefined) updateData.pinned = data.pinned;

    const updated = await db.news.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: mapNewsToResponse(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existingNews = await db.news.findUnique({ where: { id } });
    if (!existingNews) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '消息不存在' } });
    }

    await db.news.delete({ where: { id } });

    res.json({ success: true, data: { message: '消息已刪除' } });
  } catch (error) {
    next(error);
  }
});

export default router;
