"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const news_schema_1 = require("../schemas/news.schema");
const common_schema_1 = require("../schemas/common.schema");
const router = (0, express_1.Router)();
router.get('/', (0, validate_1.validateQuery)(common_schema_1.PaginationQuerySchema), (req, res) => {
    // Public endpoint
    // TODO: Fetch from DB
    res.json({ success: true, data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } });
});
router.post('/', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validate)(news_schema_1.NewsCreateSchema), (req, res) => {
    // TODO: Save to DB
    res.status(201).json({ success: true, data: { ...req.body, id: 1 } });
});
router.get('/:id', (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (req, res) => {
    // Public endpoint
    // TODO: Fetch from DB
    res.json({ success: true, data: { id: req.params.id } });
});
router.put('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (0, validate_1.validate)(news_schema_1.NewsUpdateSchema), (req, res) => {
    // TODO: Update DB
    res.json({ success: true, data: { id: req.params.id, ...req.body } });
});
router.delete('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (req, res) => {
    // TODO: Delete from DB
    res.json({ success: true, data: { message: '消息已刪除' } });
});
exports.default = router;
//# sourceMappingURL=news.routes.js.map