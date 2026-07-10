import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { PageUpdateSchema } from '../schemas/pages.schema';
import { SlugParamSchema } from '../schemas/common.schema';

import { db, type Prisma } from '@8688bnb/db';

const router = Router();

const defaultPages: Record<string, { titleZh: string; titleEn: string; meta?: Prisma.InputJsonValue }> = {
  cats: {
    titleZh: '民宿貓貓',
    titleEn: 'Resident Cats',
    meta: { cats: {} },
  },
};

async function ensurePage(slug: string) {
  const fallback = defaultPages[slug];
  if (!fallback) return null;
  return db.page.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      titleZh: fallback.titleZh,
      titleEn: fallback.titleEn,
      meta: fallback.meta,
    },
  });
}

function mapPageToResponse(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    title_zh: p.titleZh,
    title_en: p.titleEn,
    content_html: p.contentHtml,
    meta: p.meta,
    published: p.published,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString()
  };
}

router.get('/', async (req, res, next) => {
  try {
    const pages = await db.page.findMany({
      orderBy: { slug: 'asc' }
    });
    res.json({ success: true, data: pages.map(mapPageToResponse) });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', validateParams(SlugParamSchema), async (req, res, next) => {
  try {
    const page = await db.page.findUnique({
      where: { slug: req.params.slug }
    }) || await ensurePage(req.params.slug);
    if (!page) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '頁面不存在' } });
    }
    res.json({ success: true, data: mapPageToResponse(page) });
  } catch (error) {
    next(error);
  }
});

router.put('/:slug', requireAdmin, doubleCsrfProtection, validateParams(SlugParamSchema), validate(PageUpdateSchema), async (req, res, next) => {
  try {
    const data = req.body;
    const existingPage = await db.page.findUnique({
      where: { slug: req.params.slug }
    }) || await ensurePage(req.params.slug);
    if (!existingPage) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '頁面不存在' } });
    }

    const updateData: any = {};
    if (data.title_zh !== undefined) updateData.titleZh = data.title_zh;
    if (data.title_en !== undefined) updateData.titleEn = data.title_en;
    if (data.content_html !== undefined) updateData.contentHtml = data.content_html;
    if (data.meta !== undefined) updateData.meta = data.meta;
    if (data.published !== undefined) updateData.published = data.published;

    const updated = await db.page.update({
      where: { slug: req.params.slug },
      data: updateData
    });

    res.json({ success: true, data: mapPageToResponse(updated) });
  } catch (error) {
    next(error);
  }
});

export default router;
