import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery } from '../middleware/validate';
import { MediaUpdateSchema, MediaReorderSchema } from '../schemas/media.schema';
import { IdParamSchema, PaginationQuerySchema } from '../schemas/common.schema';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the uploads directory exists in reality
    cb(null, path.join(__dirname, '../../../../uploads/images'));
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

router.get('/', validateQuery(PaginationQuerySchema), (req, res) => {
  // Public endpoint
  // TODO: Fetch from DB
  res.json({ success: true, data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } });
});

router.get('/targets', requireAdmin, (req, res) => {
  // TODO: Fetch available targets and count from DB
  res.json({ success: true, data: [] });
});

router.post('/upload', requireAdmin, doubleCsrfProtection, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
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
    
    // File successfully uploaded
    // TODO: Save record to DB
    res.status(201).json({
      success: true,
      data: {
        message: '圖片上傳成功',
        media: {
          id: 1,
          target: req.body.target,
          filename_original: req.file?.originalname,
          filename_stored: req.file?.filename,
          url: `/uploads/images/${req.file?.filename}`,
          mime_type: req.file?.mimetype,
          size_bytes: req.file?.size,
          sort_order: req.body.sort_order || 0
        }
      }
    });
  });
});

router.put('/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), validate(MediaUpdateSchema), (req, res) => {
  // TODO: Update DB
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});

router.delete('/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), (req, res) => {
  // TODO: Delete from DB and disk
  res.json({ success: true, data: { message: '圖片已刪除' } });
});

router.put('/reorder', requireAdmin, doubleCsrfProtection, validate(MediaReorderSchema), (req, res) => {
  // TODO: Update sort_order in DB
  res.json({ success: true, data: { message: '圖片排序已更新' } });
});

export default router;
