"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageUpdateSchema = void 0;
const zod_1 = require("zod");
exports.PageUpdateSchema = zod_1.z.object({
    title_zh: zod_1.z.string().min(1).max(200).optional(),
    title_en: zod_1.z.string().max(200).optional().nullable(),
    content_html: zod_1.z.string().max(50000).optional(),
    meta: zod_1.z.record(zod_1.z.any()).optional().nullable(),
    published: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=pages.schema.js.map