"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const blocked_dates_schema_1 = require("../schemas/blocked-dates.schema");
const common_schema_1 = require("../schemas/common.schema");
const db_1 = require("@8688bnb/db");
const router = (0, express_1.Router)();
function mapBlockedDateToResponse(b) {
    return {
        id: b.id,
        room_id: b.roomId,
        start_date: b.startDate.toISOString().split('T')[0],
        end_date: b.endDate.toISOString().split('T')[0],
        reason: b.reason,
        created_at: b.createdAt.toISOString(),
        updated_at: b.updatedAt.toISOString()
    };
}
router.get('/', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const blockedDates = await db_1.db.blockedDate.findMany({
            orderBy: { startDate: 'desc' }
        });
        res.json({ success: true, data: blockedDates.map(mapBlockedDateToResponse) });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validate)(blocked_dates_schema_1.BlockedDateCreateSchema), async (req, res, next) => {
    try {
        const data = req.body;
        if (data.room_id) {
            const room = await db_1.db.room.findUnique({ where: { id: data.room_id } });
            if (!room) {
                return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '房型不存在' } });
            }
        }
        const blocked = await db_1.db.blockedDate.create({
            data: {
                roomId: data.room_id || null,
                startDate: new Date(data.start_date),
                endDate: new Date(data.end_date),
                reason: data.reason
            }
        });
        res.status(201).json({ success: true, data: mapBlockedDateToResponse(blocked) });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), (0, validate_1.validate)(blocked_dates_schema_1.BlockedDateUpdateSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = req.body;
        const existingBlocked = await db_1.db.blockedDate.findUnique({ where: { id } });
        if (!existingBlocked) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '封鎖日期不存在' } });
        }
        const updateData = {};
        if (data.room_id !== undefined)
            updateData.roomId = data.room_id;
        if (data.start_date !== undefined)
            updateData.startDate = new Date(data.start_date);
        if (data.end_date !== undefined)
            updateData.endDate = new Date(data.end_date);
        if (data.reason !== undefined)
            updateData.reason = data.reason;
        const updated = await db_1.db.blockedDate.update({
            where: { id },
            data: updateData
        });
        res.json({ success: true, data: mapBlockedDateToResponse(updated) });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const existingBlocked = await db_1.db.blockedDate.findUnique({ where: { id } });
        if (!existingBlocked) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '封鎖日期不存在' } });
        }
        await db_1.db.blockedDate.delete({ where: { id } });
        res.json({ success: true, data: { message: '封鎖日期已移除' } });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=blocked-dates.routes.js.map