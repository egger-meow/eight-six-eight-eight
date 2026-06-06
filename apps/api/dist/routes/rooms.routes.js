"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const rooms_schema_1 = require("../schemas/rooms.schema");
const common_schema_1 = require("../schemas/common.schema");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    // TODO: Fetch from DB
    res.json({ success: true, data: [] });
});
router.post('/', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validate)(rooms_schema_1.RoomCreateSchema), (req, res) => {
    // TODO: Save to DB
    res.status(201).json({ success: true, data: { ...req.body, id: 1 } });
});
router.get('/:slug', (0, validate_1.validateQuery)(common_schema_1.SlugParamSchema), (req, res) => {
    // TODO: Fetch from DB
    res.json({ success: true, data: { id: 1, slug: req.params.slug } });
});
router.put('/:slug', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.SlugParamSchema), (0, validate_1.validate)(rooms_schema_1.RoomUpdateSchema), (req, res) => {
    // TODO: Update DB
    res.json({ success: true, data: { ...req.body, slug: req.params.slug } });
});
router.delete('/:slug', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.SlugParamSchema), (req, res) => {
    // TODO: Soft delete in DB
    res.json({ success: true, data: { message: '房型已停用' } });
});
router.get('/:slug/availability', (0, validate_1.validateQuery)(common_schema_1.SlugParamSchema), (0, validate_1.validateQuery)(common_schema_1.DateRangeQuerySchema), (req, res) => {
    // TODO: Check DB bookings & blocked dates
    res.json({
        success: true,
        data: {
            available: true,
            room_slug: req.params.slug,
            from: req.query.from,
            to: req.query.to,
            conflicts: [],
            estimated_price: 3000
        }
    });
});
exports.default = router;
//# sourceMappingURL=rooms.routes.js.map