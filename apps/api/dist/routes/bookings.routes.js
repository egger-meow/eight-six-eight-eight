"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const bookings_schema_1 = require("../schemas/bookings.schema");
const common_schema_1 = require("../schemas/common.schema");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAdmin, (0, validate_1.validateQuery)(common_schema_1.PaginationQuerySchema), (req, res) => {
    // TODO: Fetch from DB
    res.json({ success: true, data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } });
});
router.post('/', (0, validate_1.validate)(bookings_schema_1.BookingCreateSchema), (req, res) => {
    // Public endpoint
    // TODO: Save to DB
    res.status(201).json({ success: true, data: { ...req.body, id: 1, status: 'pending' } });
});
router.get('/calendar', auth_1.requireAdmin, (0, validate_1.validateQuery)(common_schema_1.DateRangeQuerySchema), (req, res) => {
    // TODO: Fetch calendar data from DB
    res.json({
        success: true,
        data: {
            from: req.query.from,
            to: req.query.to,
            rooms: []
        }
    });
});
router.get('/:id', auth_1.requireAdmin, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (req, res) => {
    // TODO: Fetch from DB
    res.json({ success: true, data: { id: req.params.id } });
});
router.put('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (0, validate_1.validate)(bookings_schema_1.BookingUpdateSchema), (req, res) => {
    // TODO: Update DB
    res.json({ success: true, data: { id: req.params.id, ...req.body } });
});
router.delete('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (req, res) => {
    // TODO: Delete from DB
    res.json({ success: true, data: { message: '預約已刪除' } });
});
router.post('/:id/notes', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (0, validate_1.validate)(bookings_schema_1.BookingNoteSchema), (req, res) => {
    // TODO: Save to DB
    res.status(201).json({ success: true, data: { id: 1, booking_id: req.params.id, ...req.body } });
});
exports.default = router;
//# sourceMappingURL=bookings.routes.js.map