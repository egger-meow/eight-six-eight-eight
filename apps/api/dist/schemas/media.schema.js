"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaReorderSchema = exports.MediaUpdateSchema = void 0;
const zod_1 = require("zod");
exports.MediaUpdateSchema = zod_1.z.object({
    alt_text: zod_1.z.string().max(200).optional(),
    target: zod_1.z.string().optional(),
    sort_order: zod_1.z.number().int().min(0).optional(),
});
exports.MediaReorderSchema = zod_1.z.object({
    image_ids: zod_1.z.array(zod_1.z.number().int()).min(1).max(50),
});
//# sourceMappingURL=media.schema.js.map