"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockedDateUpdateSchema = exports.BlockedDateCreateSchema = void 0;
const zod_1 = require("zod");
exports.BlockedDateCreateSchema = zod_1.z.object({
    room_id: zod_1.z.number().int().min(1).optional().nullable(),
    start_date: zod_1.z.string().date(),
    end_date: zod_1.z.string().date(),
    reason: zod_1.z.string().min(1).max(200),
});
exports.BlockedDateUpdateSchema = zod_1.z.object({
    room_id: zod_1.z.number().int().min(1).optional().nullable(),
    start_date: zod_1.z.string().date().optional(),
    end_date: zod_1.z.string().date().optional(),
    reason: zod_1.z.string().min(1).max(200).optional(),
});
//# sourceMappingURL=blocked-dates.schema.js.map