"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const common_schema_1 = require("../schemas/common.schema");
const db_1 = require("@8688bnb/db");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
function mapBookingToResponse(b) {
    return {
        id: b.id,
        room_id: b.roomId,
        room: b.room ? {
            id: b.room.id,
            slug: b.room.slug,
            name_zh: b.room.nameZh,
            type: b.room.type
        } : undefined,
        source: b.source,
        ota_platform: b.otaPlatform,
        ota_booking_id: b.otaBookingId,
        check_in: b.checkIn.toISOString().split('T')[0],
        check_out: b.checkOut.toISOString().split('T')[0],
        guest_name: b.guestName,
        guest_phone: b.guestPhone,
        guest_line_id: b.guestLineId,
        guest_count: b.guestCount,
        total_price: b.totalPrice,
        status: b.status,
        notes: b.notes,
        created_at: b.createdAt.toISOString(),
        updated_at: b.updatedAt.toISOString()
    };
}
router.get('/stats', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const today = new Date(new Date().toISOString().split('T')[0]);
        const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
        const endOfMonth = new Date(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 23, 59, 59, 999);
        const [todayCheckIns, todayCheckOuts, currentOccupancy, totalRooms, upcomingBookings7d, pendingBookings, monthlyBookings, unprocessedWebhooks] = await Promise.all([
            db_1.db.booking.count({
                where: {
                    checkIn: today,
                    status: { notIn: ['cancelled', 'no_show'] }
                }
            }),
            db_1.db.booking.count({
                where: {
                    checkOut: today,
                    status: { notIn: ['cancelled', 'no_show'] }
                }
            }),
            db_1.db.booking.count({
                where: {
                    checkIn: { lte: today },
                    checkOut: { gt: today },
                    status: { in: ['confirmed', 'checked_in'] }
                }
            }),
            db_1.db.room.count(),
            db_1.db.booking.count({
                where: {
                    checkIn: { gte: today, lte: sevenDaysLater },
                    status: 'confirmed'
                }
            }),
            db_1.db.booking.count({
                where: { status: 'pending' }
            }),
            db_1.db.booking.findMany({
                where: {
                    checkIn: { gte: startOfMonth, lte: endOfMonth },
                    status: { in: ['confirmed', 'checked_in', 'checked_out'] }
                },
                select: { totalPrice: true }
            }),
            db_1.db.webhookEvent.count({
                where: { status: 'received' }
            })
        ]);
        const occupancyRate = totalRooms > 0 ? parseFloat((currentOccupancy / totalRooms).toFixed(2)) : 0;
        const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        res.json({
            success: true,
            data: {
                today_check_ins: todayCheckIns,
                today_check_outs: todayCheckOuts,
                current_occupancy: currentOccupancy,
                total_rooms: totalRooms,
                occupancy_rate: occupancyRate,
                upcoming_bookings_7d: upcomingBookings7d,
                pending_bookings: pendingBookings,
                monthly_revenue: monthlyRevenue,
                unprocessed_webhooks: unprocessedWebhooks
            }
        });
    }
    catch (error) {
        next(error);
    }
});
const LimitQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().min(1).max(20).default(10)
});
router.get('/recent-bookings', auth_1.requireAdmin, (0, validate_1.validateQuery)(LimitQuerySchema), async (req, res, next) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const bookings = await db_1.db.booking.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { room: true }
        });
        res.json({ success: true, data: bookings.map(mapBookingToResponse) });
    }
    catch (error) {
        next(error);
    }
});
router.get('/occupancy', auth_1.requireAdmin, (0, validate_1.validateQuery)(common_schema_1.DateRangeQuerySchema), async (req, res, next) => {
    try {
        const fromStr = req.query.from;
        const toStr = req.query.to;
        const from = new Date(fromStr);
        const to = new Date(toStr);
        const rooms = await db_1.db.room.findMany({
            orderBy: { sortOrder: 'asc' }
        });
        const bookings = await db_1.db.booking.findMany({
            where: {
                status: { notIn: ['cancelled', 'no_show'] },
                AND: [
                    { checkIn: { lt: to } },
                    { checkOut: { gt: from } }
                ]
            }
        });
        const blockedDates = await db_1.db.blockedDate.findMany({
            where: {
                AND: [
                    { startDate: { lte: to } },
                    { endDate: { gte: from } }
                ]
            }
        });
        const datesList = [];
        let curr = new Date(from);
        while (curr <= to) {
            datesList.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        const data = [];
        for (const room of rooms) {
            const roomBookings = bookings.filter((b) => b.roomId === room.id);
            const roomBlocks = blockedDates.filter((b) => b.roomId === room.id || b.roomId === null);
            for (const dateStr of datesList) {
                const d = new Date(dateStr);
                const isOccupied = roomBookings.some((b) => {
                    const start = new Date(b.checkIn);
                    const end = new Date(b.checkOut);
                    return d >= start && d < end;
                });
                const isBlocked = roomBlocks.some((b) => {
                    const start = new Date(b.startDate);
                    const end = new Date(b.endDate);
                    return d >= start && d <= end;
                });
                data.push({
                    date: dateStr,
                    room_id: room.id,
                    room_slug: room.slug,
                    is_occupied: isOccupied,
                    is_blocked: isBlocked
                });
            }
        }
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map