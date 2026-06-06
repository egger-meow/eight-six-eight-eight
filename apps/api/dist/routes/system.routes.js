"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/info', auth_1.requireAdmin, (req, res) => {
    res.json({
        success: true,
        data: {
            version: '0.1.0',
            node_version: process.version,
            uptime_seconds: Math.floor(process.uptime()),
            database_status: 'connected', // TODO: Actual check
            redis_status: 'connected', // TODO: Actual check
            total_rooms: 5,
            total_bookings: 0,
            total_media_files: 0,
            storage_used_mb: 0
        }
    });
});
exports.default = router;
//# sourceMappingURL=system.routes.js.map