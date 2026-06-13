"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("@8688bnb/db");
const rate_limit_1 = require("../middleware/rate-limit");
const router = (0, express_1.Router)();
router.get('/info', auth_1.requireAdmin, async (req, res, next) => {
    try {
        let dbStatus = 'error';
        try {
            await db_1.db.$queryRaw `SELECT 1`;
            dbStatus = 'connected';
        }
        catch (e) {
            dbStatus = 'error';
        }
        const redisStatus = rate_limit_1.redisClient.isReady ? 'connected' : 'error';
        const [totalRooms, totalBookings, totalMedia, mediaSizeSum] = await Promise.all([
            db_1.db.room.count(),
            db_1.db.booking.count(),
            db_1.db.media.count(),
            db_1.db.media.aggregate({ _sum: { sizeBytes: true } })
        ]);
        const storageUsedBytes = mediaSizeSum._sum.sizeBytes || 0;
        const storageUsedMb = parseFloat((storageUsedBytes / (1024 * 1024)).toFixed(2));
        res.json({
            success: true,
            data: {
                version: '0.1.0',
                node_version: process.version,
                uptime_seconds: Math.floor(process.uptime()),
                database_status: dbStatus,
                redis_status: redisStatus,
                total_rooms: totalRooms,
                total_bookings: totalBookings,
                total_media_files: totalMedia,
                storage_used_mb: storageUsedMb
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=system.routes.js.map