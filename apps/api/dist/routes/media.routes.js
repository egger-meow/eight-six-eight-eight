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
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const media_schema_1 = require("../schemas/media.schema");
const common_schema_1 = require("../schemas/common.schema");
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
router.get('/', (0, validate_1.validateQuery)(common_schema_1.PaginationQuerySchema), (req, res) => {
    // Public endpoint
    // TODO: Fetch from DB
    res.json({ success: true, data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } });
});
router.get('/targets', auth_1.requireAdmin, (req, res) => {
    // TODO: Fetch available targets and count from DB
    res.json({ success: true, data: [] });
});
router.post('/upload', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
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
router.put('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (0, validate_1.validate)(media_schema_1.MediaUpdateSchema), (req, res) => {
    // TODO: Update DB
    res.json({ success: true, data: { id: req.params.id, ...req.body } });
});
router.delete('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (req, res) => {
    // TODO: Delete from DB and disk
    res.json({ success: true, data: { message: '圖片已刪除' } });
});
router.put('/reorder', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validate)(media_schema_1.MediaReorderSchema), (req, res) => {
    // TODO: Update sort_order in DB
    res.json({ success: true, data: { message: '圖片排序已更新' } });
});
exports.default = router;
//# sourceMappingURL=media.routes.js.map