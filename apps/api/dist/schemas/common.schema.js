"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlugParamSchema = exports.IdParamSchema = exports.DateRangeQuerySchema = exports.PaginationQuerySchema = void 0;
const zod_1 = require("zod");
exports.PaginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    per_page: zod_1.z.coerce.number().min(1).max(100).default(20),
});
exports.DateRangeQuerySchema = zod_1.z.object({
    from: zod_1.z.string().date(),
    to: zod_1.z.string().date(),
});
exports.IdParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().min(1),
});
exports.SlugParamSchema = zod_1.z.object({
    slug: zod_1.z.string().regex(/^[a-z][a-z0-9-]*$/),
});
//# sourceMappingURL=common.schema.js.map