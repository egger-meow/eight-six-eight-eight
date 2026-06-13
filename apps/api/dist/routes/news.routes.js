"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const news_schema_1 = require("../schemas/news.schema");
const common_schema_1 = require("../schemas/common.schema");
const db_1 = require("@8688bnb/db");
const router = (0, express_1.Router)();
function mapNewsToResponse(n) {
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
router.get('/', (0, validate_1.validateQuery)(common_schema_1.PaginationQuerySchema), async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1);
        const per_page = Number(req.query.per_page || 10);
        // Only return visible news for public endpoint
        const where = { visible: true };
        const [total, news] = await Promise.all([
            db_1.db.news.count({ where }),
            db_1.db.news.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validate)(news_schema_1.NewsCreateSchema), async (req, res, next) => {
    try {
        const data = req.body;
        const news = await db_1.db.news.create({
            data: {
                title: data.title,
                content: data.content,
                publishedAt: data.published_at ? new Date(data.published_at) : null,
                visible: data.visible !== undefined ? data.visible : true,
                pinned: data.pinned !== undefined ? data.pinned : false
            }
        });
        res.status(201).json({ success: true, data: mapNewsToResponse(news) });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', (0, validate_1.validateParams)(common_schema_1.IdParamSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const news = await db_1.db.news.findUnique({ where: { id } });
        if (!news) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '消息不存在' } });
        }
        res.json({ success: true, data: mapNewsToResponse(news) });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), (0, validate_1.validate)(news_schema_1.NewsUpdateSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = req.body;
        const existingNews = await db_1.db.news.findUnique({ where: { id } });
        if (!existingNews) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '消息不存在' } });
        }
        const updateData = {};
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.content !== undefined)
            updateData.content = data.content;
        if (data.published_at !== undefined)
            updateData.publishedAt = data.published_at ? new Date(data.published_at) : null;
        if (data.visible !== undefined)
            updateData.visible = data.visible;
        if (data.pinned !== undefined)
            updateData.pinned = data.pinned;
        const updated = await db_1.db.news.update({
            where: { id },
            data: updateData
        });
        res.json({ success: true, data: mapNewsToResponse(updated) });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const existingNews = await db_1.db.news.findUnique({ where: { id } });
        if (!existingNews) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '消息不存在' } });
        }
        await db_1.db.news.delete({ where: { id } });
        res.json({ success: true, data: { message: '消息已刪除' } });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=news.routes.js.map