"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const bookings_schema_1 = require("../schemas/bookings.schema");
const common_schema_1 = require("../schemas/common.schema");
const db_1 = require("@8688bnb/db");
const pricing_1 = require("../lib/pricing");
const notifications_1 = require("../lib/notifications");
const booking_rules_1 = require("../lib/booking-rules");
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
        internal_notes: b.internalNotes ? b.internalNotes.map((n) => ({
            id: n.id,
            booking_id: n.bookingId,
            content: n.content,
            created_at: n.createdAt.toISOString()
        })) : undefined,
        created_at: b.createdAt.toISOString(),
        updated_at: b.updatedAt.toISOString()
    };
}
router.get('/', auth_1.requireAdmin, (0, validate_1.validateQuery)(common_schema_1.PaginationQuerySchema), async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1);
        const per_page = Number(req.query.per_page || 20);
        const [total, bookings] = await Promise.all([
            db_1.db.booking.count(),
            db_1.db.booking.findMany({
                skip: (page - 1) * per_page,
                take: per_page,
                orderBy: { createdAt: 'desc' },
                include: { room: true }
            })
        ]);
        res.json({
            success: true,
            data: bookings.map(mapBookingToResponse),
            meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', (0, validate_1.validate)(bookings_schema_1.BookingCreateSchema), async (req, res, next) => {
    try {
        const data = req.body;
        const checkInDate = new Date(data.check_in);
        const checkOutDate = new Date(data.check_out);
        const validation = await (0, booking_rules_1.validateBookingMutation)({
            roomId: data.room_id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guestCount: data.guest_count,
        });
        if (validation.error) {
            return res.status(validation.error.status).json({ success: false, error: { code: validation.error.code, message: validation.error.message } });
        }
        const room = validation.room;
        const totalPrice = await (0, pricing_1.calculateStayPrice)(room, checkInDate, checkOutDate);
        let notificationEventId = null;
        const booking = await db_1.db.$transaction(async (tx) => {
            const created = await tx.booking.create({
                data: {
                    roomId: data.room_id,
                    checkIn: checkInDate,
                    checkOut: checkOutDate,
                    guestName: data.guest_name,
                    guestPhone: data.guest_phone,
                    guestLineId: data.guest_line_id || null,
                    guestCount: data.guest_count,
                    notes: data.notes || null,
                    totalPrice,
                    status: 'pending',
                    source: 'website'
                },
                include: { room: true }
            });
            notificationEventId = await (0, notifications_1.createBookingNotificationEvent)({
                tx,
                booking: created,
                eventType: 'booking.created',
                dedupeKey: `booking.created:${created.id}`,
                source: 'website',
            });
            return created;
        });
        if (notificationEventId)
            (0, notifications_1.kickNotificationWorker)();
        res.status(201).json({ success: true, data: mapBookingToResponse(booking) });
    }
    catch (error) {
        next(error);
    }
});
router.get('/calendar', auth_1.requireAdmin, (0, validate_1.validateQuery)(common_schema_1.DateRangeQuerySchema), async (req, res, next) => {
    try {
        const fromStr = req.query.from;
        const toStr = req.query.to;
        const from = new Date(fromStr);
        const to = new Date(toStr);
        const roomFilterId = req.query.room_id ? Number(req.query.room_id) : undefined;
        // Fetch all rooms
        const rooms = await db_1.db.room.findMany({
            where: roomFilterId ? { id: roomFilterId } : undefined,
            orderBy: { sortOrder: 'asc' }
        });
        // Fetch all active bookings for the range
        const bookings = await db_1.db.booking.findMany({
            where: {
                status: { notIn: ['cancelled', 'no_show'] },
                AND: [
                    { checkIn: { lt: to } },
                    { checkOut: { gt: from } }
                ]
            }
        });
        // Fetch all blocked dates for the range
        const blockedDates = await db_1.db.blockedDate.findMany({
            where: {
                AND: [
                    { startDate: { lte: to } },
                    { endDate: { gte: from } }
                ]
            }
        });
        // Generate list of dates from `from` to `to` inclusive
        const datesList = [];
        let curr = new Date(from);
        while (curr <= to) {
            datesList.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        // Build the calendar rooms array
        const roomsData = rooms.map((room) => {
            const roomBookings = bookings.filter((b) => b.roomId === room.id);
            const roomBlocks = blockedDates.filter((b) => b.roomId === room.id || b.roomId === null);
            const days = datesList.map(dateStr => {
                const d = new Date(dateStr);
                // Find if blocked on this date
                const block = roomBlocks.find((b) => {
                    const start = new Date(b.startDate);
                    const end = new Date(b.endDate);
                    return d >= start && d <= end;
                });
                // Find if booked on this date (checkIn <= d < checkOut)
                const booking = roomBookings.find((b) => {
                    const start = new Date(b.checkIn);
                    const end = new Date(b.checkOut);
                    return d >= start && d < end;
                });
                let status = 'available';
                if (block) {
                    status = 'blocked';
                }
                else if (booking) {
                    status = booking.status === 'checked_in' ? 'checked_in' : 'booked';
                }
                return {
                    date: dateStr,
                    room_id: room.id,
                    room_slug: room.slug,
                    room_name_zh: room.nameZh,
                    status,
                    booking: (status === 'booked' || status === 'checked_in') && booking ? {
                        id: booking.id,
                        guest_name: booking.guestName,
                        guest_count: booking.guestCount,
                        check_in: booking.checkIn.toISOString().split('T')[0],
                        check_out: booking.checkOut.toISOString().split('T')[0],
                        status: booking.status,
                        source: booking.source
                    } : null,
                    blocked_info: status === 'blocked' && block ? {
                        reason: block.reason
                    } : null
                };
            });
            return {
                room_id: room.id,
                room_slug: room.slug,
                room_name_zh: room.nameZh,
                days
            };
        });
        res.json({
            success: true,
            data: {
                from: fromStr,
                to: toStr,
                rooms: roomsData
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', auth_1.requireAdmin, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const booking = await db_1.db.booking.findUnique({
            where: { id },
            include: {
                room: true,
                internalNotes: { orderBy: { createdAt: 'desc' } }
            }
        });
        if (!booking) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '預約不存在' } });
        }
        res.json({ success: true, data: mapBookingToResponse(booking) });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), (0, validate_1.validate)(bookings_schema_1.BookingUpdateSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = req.body;
        const existingBooking = await db_1.db.booking.findUnique({ where: { id } });
        if (!existingBooking) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '預約不存在' } });
        }
        const updateData = {};
        if (data.room_id !== undefined)
            updateData.roomId = data.room_id;
        if (data.check_in !== undefined)
            updateData.checkIn = new Date(data.check_in);
        if (data.check_out !== undefined)
            updateData.checkOut = new Date(data.check_out);
        if (data.guest_name !== undefined)
            updateData.guestName = data.guest_name;
        if (data.guest_phone !== undefined)
            updateData.guestPhone = data.guest_phone;
        if (data.guest_line_id !== undefined)
            updateData.guestLineId = data.guest_line_id || null;
        if (data.guest_count !== undefined)
            updateData.guestCount = data.guest_count;
        if (data.total_price !== undefined)
            updateData.totalPrice = data.total_price;
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        if (data.source !== undefined)
            updateData.source = data.source;
        if (data.ota_platform !== undefined)
            updateData.otaPlatform = data.ota_platform;
        if (data.ota_booking_id !== undefined)
            updateData.otaBookingId = data.ota_booking_id;
        if (updateData.roomId || updateData.checkIn || updateData.checkOut || updateData.guestCount) {
            const roomId = updateData.roomId || existingBooking.roomId;
            const checkIn = updateData.checkIn || existingBooking.checkIn;
            const checkOut = updateData.checkOut || existingBooking.checkOut;
            const guestCount = updateData.guestCount || existingBooking.guestCount;
            const validation = await (0, booking_rules_1.validateBookingMutation)({ bookingId: id, roomId, checkIn, checkOut, guestCount });
            if (validation.error) {
                return res.status(validation.error.status).json({ success: false, error: { code: validation.error.code, message: validation.error.message } });
            }
        }
        let notificationEventId = null;
        const eventType = data.status === 'confirmed' && existingBooking.status !== 'confirmed'
            ? 'booking.confirmed'
            : data.status === 'cancelled' && existingBooking.status !== 'cancelled'
                ? 'booking.cancelled'
                : 'booking.modified';
        const updatedBooking = await db_1.db.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id },
                data: updateData,
                include: {
                    room: true,
                    internalNotes: { orderBy: { createdAt: 'desc' } }
                }
            });
            notificationEventId = await (0, notifications_1.createBookingNotificationEvent)({
                tx,
                booking: updated,
                eventType,
                dedupeKey: `${eventType}:${id}:${Date.now()}`,
                source: updated.source,
            });
            return updated;
        });
        if (notificationEventId)
            (0, notifications_1.kickNotificationWorker)();
        res.json({ success: true, data: mapBookingToResponse(updatedBooking) });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const existingBooking = await db_1.db.booking.findUnique({ where: { id }, include: { room: true } });
        if (!existingBooking) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '預約不存在' } });
        }
        let notificationEventId = null;
        await db_1.db.$transaction(async (tx) => {
            notificationEventId = await (0, notifications_1.createBookingNotificationEvent)({
                tx,
                booking: { ...existingBooking, status: 'cancelled' },
                eventType: 'booking.cancelled',
                dedupeKey: `booking.cancelled:${id}:delete:${Date.now()}`,
                source: existingBooking.source,
            });
            await tx.booking.delete({ where: { id } });
        });
        if (notificationEventId)
            (0, notifications_1.kickNotificationWorker)();
        res.json({ success: true, data: { message: '預約已刪除' } });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/notes', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), (0, validate_1.validate)(bookings_schema_1.BookingNoteSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { content } = req.body;
        const existingBooking = await db_1.db.booking.findUnique({ where: { id } });
        if (!existingBooking) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '預約不存在' } });
        }
        const note = await db_1.db.bookingNote.create({
            data: {
                bookingId: id,
                content
            }
        });
        res.status(201).json({
            success: true,
            data: {
                id: note.id,
                booking_id: note.bookingId,
                content: note.content,
                created_at: note.createdAt.toISOString()
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=bookings.routes.js.map