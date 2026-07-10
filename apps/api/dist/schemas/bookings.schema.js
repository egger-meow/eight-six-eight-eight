"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingNoteSchema = exports.BookingUpdateSchema = exports.BookingCreateSchema = void 0;
const zod_1 = require("zod");
exports.BookingCreateSchema = zod_1.z.object({
    room_id: zod_1.z.number().int().min(1),
    check_in: zod_1.z.string().date(),
    check_out: zod_1.z.string().date(),
    guest_name: zod_1.z.string().min(1).max(100),
    guest_phone: zod_1.z.string().min(1).max(30),
    guest_line_id: zod_1.z.string().max(255).optional().or(zod_1.z.literal('')),
    guest_count: zod_1.z.number().int().min(1).max(10),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.BookingUpdateSchema = zod_1.z.object({
    room_id: zod_1.z.number().int().min(1).optional(),
    check_in: zod_1.z.string().date().optional(),
    check_out: zod_1.z.string().date().optional(),
    guest_name: zod_1.z.string().min(1).max(100).optional(),
    guest_phone: zod_1.z.string().min(1).max(30).optional(),
    guest_line_id: zod_1.z.string().max(255).optional().or(zod_1.z.literal('')),
    guest_count: zod_1.z.number().int().min(1).max(10).optional(),
    total_price: zod_1.z.number().min(0).optional(),
    status: zod_1.z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
    notes: zod_1.z.string().max(1000).optional(),
    source: zod_1.z.enum(['website', 'phone', 'line', 'ota', 'walk_in', 'admin']).optional(),
    ota_platform: zod_1.z.string().max(50).optional().nullable(),
    ota_booking_id: zod_1.z.string().max(100).optional().nullable(),
});
exports.BookingNoteSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(1000),
});
//# sourceMappingURL=bookings.schema.js.map