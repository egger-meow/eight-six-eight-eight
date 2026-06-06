"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const pages_schema_1 = require("../schemas/pages.schema");
const common_schema_1 = require("../schemas/common.schema");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    // Public endpoint
    // TODO: Fetch from DB
    res.json({ success: true, data: [] });
});
router.get('/:slug', (0, validate_1.validateQuery)(common_schema_1.SlugParamSchema), (req, res) => {
    // Public endpoint
    // TODO: Fetch from DB
    res.json({ success: true, data: { slug: req.params.slug } });
});
router.put('/:slug', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.SlugParamSchema), (0, validate_1.validate)(pages_schema_1.PageUpdateSchema), (req, res) => {
    // TODO: Update DB
    res.json({ success: true, data: { slug: req.params.slug, ...req.body } });
});
exports.default = router;
//# sourceMappingURL=pages.routes.js.map