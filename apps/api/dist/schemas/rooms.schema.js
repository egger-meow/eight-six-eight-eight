"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomUpdateSchema = exports.RoomCreateSchema = void 0;
const zod_1 = require("zod");
exports.RoomCreateSchema = zod_1.z.object({
    slug: zod_1.z.string().regex(/^[a-z][a-z0-9-]*$/),
    name_zh: zod_1.z.string().min(1).max(100),
    name_en: zod_1.z.string().max(100).optional(),
    capacity: zod_1.z.number().int().min(1).max(10),
    type: zod_1.z.enum(['double', 'quad', 'suite']),
    description: zod_1.z.string().max(2000).optional(),
    amenities: zod_1.z.array(zod_1.z.string().max(50)).max(30).optional(),
    price_weekday: zod_1.z.number().min(0),
    price_weekend: zod_1.z.number().min(0),
    price_holiday: zod_1.z.number().min(0),
    available: zod_1.z.boolean().default(true),
    sort_order: zod_1.z.number().int().min(0).default(0),
});
exports.RoomUpdateSchema = exports.RoomCreateSchema.partial().omit({ slug: true });
//# sourceMappingURL=rooms.schema.js.map