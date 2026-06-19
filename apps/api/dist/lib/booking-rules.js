"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRoomByRef = findRoomByRef;
exports.validateBookingMutation = validateBookingMutation;
const db_1 = require("@8688bnb/db");
async function findRoomByRef(roomRef, client = db_1.db) {
    const id = Number(roomRef);
    if (Number.isInteger(id) && id > 0)
        return client.room.findUnique({ where: { id } });
    return client.room.findUnique({ where: { slug: roomRef } });
}
async function validateBookingMutation(args) {
    const client = args.client || db_1.db;
    if (args.checkOut <= args.checkIn) {
        return { room: null, error: { status: 400, code: 'INVALID_DATE_RANGE', message: '退房日期必須晚於入住日期' } };
    }
    const room = await client.room.findUnique({ where: { id: args.roomId } });
    if (!room) {
        return { room: null, error: { status: 404, code: 'NOT_FOUND', message: '房型不存在' } };
    }
    if (!room.available) {
        return { room, error: { status: 409, code: 'ROOM_UNAVAILABLE', message: '此房型目前未開放預訂' } };
    }
    if (args.guestCount > room.capacity) {
        return { room, error: { status: 400, code: 'CAPACITY_EXCEEDED', message: '入住人數超過房型可容納人數' } };
    }
    const conflict = await client.booking.findFirst({
        where: {
            id: args.bookingId ? { not: args.bookingId } : undefined,
            roomId: args.roomId,
            status: { notIn: ['cancelled', 'no_show'] },
            AND: [
                { checkIn: { lt: args.checkOut } },
                { checkOut: { gt: args.checkIn } },
            ],
        },
    });
    if (conflict) {
        return { room, error: { status: 409, code: 'CONFLICT', message: '該時段已被預訂' } };
    }
    const blockedConflict = await client.blockedDate.findFirst({
        where: {
            OR: [
                { roomId: args.roomId },
                { roomId: null },
            ],
            AND: [
                { startDate: { lte: args.checkOut } },
                { endDate: { gte: args.checkIn } },
            ],
        },
    });
    if (blockedConflict) {
        return { room, error: { status: 409, code: 'BLOCKED_DATE', message: '該時段目前無法預訂' } };
    }
    return { room, error: null };
}
//# sourceMappingURL=booking-rules.js.map