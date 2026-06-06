"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const blocked_dates_schema_1 = require("../schemas/blocked-dates.schema");
const common_schema_1 = require("../schemas/common.schema");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAdmin, (req, res) => {
    // TODO: Fetch from DB
    res.json({ success: true, data: [] });
});
router.post('/', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validate)(blocked_dates_schema_1.BlockedDateCreateSchema), (req, res) => {
    // TODO: Save to DB
    res.status(201).json({ success: true, data: { ...req.body, id: 1 } });
});
router.put('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (0, validate_1.validate)(blocked_dates_schema_1.BlockedDateUpdateSchema), (req, res) => {
    // TODO: Update DB
    res.json({ success: true, data: { ...req.body, id: req.params.id } });
});
router.delete('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (req, res) => {
    // TODO: Delete from DB
    res.json({ success: true, data: { message: '封鎖日期已移除' } });
});
exports.default = router;
//# sourceMappingURL=blocked-dates.routes.js.map