"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/stats', auth_1.requireAdmin, (req, res) => {
    // TODO: Calculate stats from DB
    res.json({
        success: true,
        data: {
            today_check_ins: 0,
            today_check_outs: 0,
            current_occupancy: 0,
            total_rooms: 5,
            occupancy_rate: 0,
            upcoming_bookings_7d: 0,
            pending_bookings: 0,
            monthly_revenue: 0,
            unprocessed_webhooks: 0
        }
    });
});
router.get('/recent-bookings', auth_1.requireAdmin, (req, res) => {
    // TODO: Fetch from DB
    res.json({ success: true, data: [] });
});
router.get('/occupancy', auth_1.requireAdmin, (req, res) => {
    // TODO: Calculate from DB
    res.json({ success: true, data: [] });
});
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map