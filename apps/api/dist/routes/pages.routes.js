"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const pages_schema_1 = require("../schemas/pages.schema");
const common_schema_1 = require("../schemas/common.schema");
const db_1 = require("@8688bnb/db");
const router = (0, express_1.Router)();
function mapPageToResponse(p) {
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
        const pages = await db_1.db.page.findMany({
            orderBy: { slug: 'asc' }
        });
        res.json({ success: true, data: pages.map(mapPageToResponse) });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:slug', (0, validate_1.validateParams)(common_schema_1.SlugParamSchema), async (req, res, next) => {
    try {
        const page = await db_1.db.page.findUnique({
            where: { slug: req.params.slug }
        });
        if (!page) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '頁面不存在' } });
        }
        res.json({ success: true, data: mapPageToResponse(page) });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:slug', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.SlugParamSchema), (0, validate_1.validate)(pages_schema_1.PageUpdateSchema), async (req, res, next) => {
    try {
        const data = req.body;
        const existingPage = await db_1.db.page.findUnique({
            where: { slug: req.params.slug }
        });
        if (!existingPage) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '頁面不存在' } });
        }
        const updateData = {};
        if (data.title_zh !== undefined)
            updateData.titleZh = data.title_zh;
        if (data.title_en !== undefined)
            updateData.titleEn = data.title_en;
        if (data.content_html !== undefined)
            updateData.contentHtml = data.content_html;
        if (data.meta !== undefined)
            updateData.meta = data.meta;
        if (data.published !== undefined)
            updateData.published = data.published;
        const updated = await db_1.db.page.update({
            where: { slug: req.params.slug },
            data: updateData
        });
        res.json({ success: true, data: mapPageToResponse(updated) });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=pages.routes.js.map