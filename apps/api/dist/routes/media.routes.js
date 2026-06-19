"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const media_schema_1 = require("../schemas/media.schema");
const common_schema_1 = require("../schemas/common.schema");
const db_1 = require("@8688bnb/db");
const media_bootstrap_1 = require("../lib/media-bootstrap");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the uploads directory exists in reality
        cb(null, path.join(__dirname, '../../../../uploads/images'));
    },
    filename: (req, file, cb) => {
        // Generate UUID filename
        const ext = path.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        // Basic mimetype check (magic bytes should be checked too for security)
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    }
});
const MediaQuerySchema = common_schema_1.PaginationQuerySchema.extend({
    target: zod_1.z.string().optional()
});
function mapMediaToResponse(m) {
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
router.get('/', (0, validate_1.validateQuery)(MediaQuerySchema), async (req, res, next) => {
    try {
        if (req.query.target) {
            await (0, media_bootstrap_1.bootstrapMediaTarget)(req.query.target);
        }
        else {
            await (0, media_bootstrap_1.bootstrapKnownMediaTargets)();
        }
        const page = Number(req.query.page || 1);
        const per_page = Number(req.query.per_page || 20);
        const target = req.query.target;
        const where = {};
        if (target) {
            where.target = target;
        }
        const [total, mediaItems] = await Promise.all([
            db_1.db.media.count({ where }),
            db_1.db.media.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/targets', auth_1.requireAdmin, async (req, res, next) => {
    try {
        await (0, media_bootstrap_1.bootstrapKnownMediaTargets)();
        const rooms = await db_1.db.room.findMany({ select: { slug: true, nameZh: true, nameEn: true } });
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
            ...rooms.map((r) => ({
                target: `room_${r.slug}`,
                label_zh: `房型相簿 — ${r.nameZh}`,
                label_en: `Room Gallery — ${r.nameEn || r.slug}`
            }))
        ];
        const counts = await db_1.db.media.groupBy({
            by: ['target'],
            _count: { id: true }
        });
        const countsMap = new Map(counts.map((c) => [c.target, c._count.id]));
        const data = targets.map(t => ({
            ...t,
            image_count: countsMap.get(t.target) || 0
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
router.post('/upload', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (req, res, next) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
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
            const media = await db_1.db.media.create({
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
        }
        catch (error) {
            next(error);
        }
    });
});
router.put('/reorder', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validate)(media_schema_1.MediaReorderSchema), async (req, res, next) => {
    try {
        const { image_ids } = req.body;
        await db_1.db.$transaction(image_ids.map((id, idx) => db_1.db.media.update({
            where: { id },
            data: { sortOrder: idx * 10 }
        })));
        res.json({ success: true, data: { message: '圖片排序已更新' } });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), (0, validate_1.validate)(media_schema_1.MediaUpdateSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = req.body;
        const existing = await db_1.db.media.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '圖片不存在' } });
        }
        const updateData = {};
        if (data.alt_text !== undefined)
            updateData.altText = data.alt_text;
        if (data.target !== undefined)
            updateData.target = data.target;
        if (data.sort_order !== undefined)
            updateData.sortOrder = data.sort_order;
        const updated = await db_1.db.media.update({
            where: { id },
            data: updateData
        });
        res.json({ success: true, data: mapMediaToResponse(updated) });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const media = await db_1.db.media.findUnique({ where: { id } });
        if (!media) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '圖片不存在' } });
        }
        await db_1.db.media.delete({ where: { id } });
        if (media.url.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '../../../../uploads/images', media.filenameStored);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Failed to delete file from disk: ${filePath}`, err);
                }
            });
        }
        res.json({ success: true, data: { message: '圖片已刪除' } });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=media.routes.js.map