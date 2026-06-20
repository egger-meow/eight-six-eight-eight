import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { MediaUpdateSchema, MediaReorderSchema } from '../schemas/media.schema';
import { IdParamSchema, PaginationQuerySchema } from '../schemas/common.schema';

import { db } from '@8688bnb/db';
import { bootstrapKnownMediaTargets, bootstrapMediaTarget } from '../lib/media-bootstrap';
import { z } from 'zod';

const router = Router();

const uploadImageDirectory = path.join(process.cwd(), 'uploads', 'images');
fs.mkdirSync(uploadImageDirectory, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadImageDirectory, { recursive: true });
    cb(null, uploadImageDirectory);
  },
  filename: (req, file, cb) => {
    // Generate UUID filename
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Basic mimetype check (magic bytes should be checked too for security)
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const MediaQuerySchema = PaginationQuerySchema.extend({
  target: z.string().optional()
});

function mapMediaToResponse(m: any) {
  return {
    id: m.id,
    target: m.target,
    filename_original: m.filenameOriginal,
    filename_stored: m.filenameStored,
    url: m.url,
    mime_type: m.mimeType,
    size_bytes: m.sizeBytes,
    alt_text: m.altText,
    sort_order: m.sortOrder,
    created_at: m.createdAt.toISOString(),
    updated_at: m.updatedAt.toISOString()
  };
}

router.get('/', validateQuery(MediaQuerySchema), async (req, res, next) => {
  try {
    if (req.query.target) {
      await bootstrapMediaTarget(req.query.target as string);
    } else {
      await bootstrapKnownMediaTargets();
    }
    const page = Number(req.query.page || 1);
    const per_page = Number(req.query.per_page || 20);
    const target = req.query.target as string | undefined;

    const where: any = {};
    if (target) {
      where.target = target;
    }

    const [total, mediaItems] = await Promise.all([
      db.media.count({ where }),
      db.media.findMany({
        where,
        skip: (page - 1) * per_page,
        take: per_page,
        orderBy: { sortOrder: 'asc' }
      })
    ]);

    res.json({
      success: true,
      data: mediaItems.map(mapMediaToResponse),
      meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/targets', requireAdmin, async (req, res, next) => {
  try {
    await bootstrapKnownMediaTargets();
    const rooms = await db.room.findMany({ select: { slug: true, nameZh: true, nameEn: true } });
    const targets = [
      { target: 'homepage_hero', label_zh: '首頁輪播', label_en: 'Homepage Hero Carousel' },
      { target: 'homepage_8688', label_zh: '首頁86.88', label_en: 'Homepage 86.88 Section' },
      { target: 'homepage_cats', label_zh: '首頁貓咪', label_en: 'Homepage Cats Section' },
      { target: 'homepage_bnb', label_zh: '首頁民宿', label_en: 'Homepage BnB Section' },
      { target: 'about', label_zh: '關於我們', label_en: 'About Us Page' },
      { target: 'rooms_overview', label_zh: '房型列表', label_en: 'Rooms Overview Page' },
      { target: 'booking_info', label_zh: '訂房資訊', label_en: 'Booking Info Page' },
      { target: 'location', label_zh: '民宿位置', label_en: 'Location Page' },
      { target: 'gallery', label_zh: '相簿', label_en: 'General Gallery' },
      { target: 'brand', label_zh: '品牌標識', label_en: 'Brand Assets' },
      ...rooms.map((r: any) => ({
        target: `room_${r.slug}`,
        label_zh: `房型相簿 — ${r.nameZh}`,
        label_en: `Room Gallery — ${r.nameEn || r.slug}`
      }))
    ];

    const counts = await db.media.groupBy({
      by: ['target'],
      _count: { id: true }
    });

    const countsMap = new Map(counts.map((c: any) => [c.target, c._count.id]));
    const data = targets.map(t => ({
      ...t,
      image_count: countsMap.get(t.target) || 0
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post('/upload', requireAdmin, doubleCsrfProtection, (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: { code: 'UPLOAD_FILE_TOO_LARGE', message: '檔案大小超過 10MB 上限' }
        });
      }
      return res.status(400).json({
        success: false,
        error: { code: 'UPLOAD_INVALID_TYPE', message: err.message || '檔案上傳失敗' }
      });
    }

    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'UPLOAD_FAILED', message: '未提供檔案' }
        });
      }

      const target = req.body.target || 'gallery';
      const altText = req.body.alt_text || null;
      const sortOrder = req.body.sort_order ? Number(req.body.sort_order) : 0;

      const media = await db.media.create({
        data: {
          target,
          filenameOriginal: file.originalname,
          filenameStored: file.filename,
          url: `/uploads/images/${file.filename}`,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          altText,
          sortOrder
        }
      });

      res.status(201).json({
        success: true,
        data: {
          message: '圖片上傳成功',
          media: mapMediaToResponse(media)
        }
      });
    } catch (error) {
      next(error);
    }
  });
});

router.put('/reorder', requireAdmin, doubleCsrfProtection, validate(MediaReorderSchema), async (req, res, next) => {
  try {
    const { image_ids } = req.body;

    await db.$transaction(
      image_ids.map((id: number, idx: number) =>
        db.media.update({
          where: { id },
          data: { sortOrder: idx * 10 }
        })
      )
    );

    res.json({ success: true, data: { message: '圖片排序已更新' } });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), validate(MediaUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    const existing = await db.media.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '圖片不存在' } });
    }

    const updateData: any = {};
    if (data.alt_text !== undefined) updateData.altText = data.alt_text;
    if (data.target !== undefined) updateData.target = data.target;
    if (data.sort_order !== undefined) updateData.sortOrder = data.sort_order;

    const updated = await db.media.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: mapMediaToResponse(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const media = await db.media.findUnique({ where: { id } });
    if (!media) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '圖片不存在' } });
    }

    await db.media.delete({ where: { id } });

    if (media.url.startsWith('/uploads/')) {
      const filePath = path.join(uploadImageDirectory, media.filenameStored);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Failed to delete file from disk: ${filePath}`, err);
        }
      });
    }

    res.json({ success: true, data: { message: '圖片已刪除' } });
  } catch (error) {
    next(error);
  }
});
export default router;
