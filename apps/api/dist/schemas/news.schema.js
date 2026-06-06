"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsUpdateSchema = exports.NewsCreateSchema = void 0;
const zod_1 = require("zod");
exports.NewsCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    content: zod_1.z.string().min(1).max(5000),
    published_at: zod_1.z.string().date().optional().nullable(),
    visible: zod_1.z.boolean().default(true),
    pinned: zod_1.z.boolean().default(false),
});
exports.NewsUpdateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    content: zod_1.z.string().max(5000).optional(),
    published_at: zod_1.z.string().date().optional().nullable(),
    visible: zod_1.z.boolean().optional(),
    pinned: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=news.schema.js.map