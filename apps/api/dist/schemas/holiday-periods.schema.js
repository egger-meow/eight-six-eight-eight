"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayPeriodUpdateSchema = exports.HolidayPeriodCreateSchema = exports.HolidayPricingTypeSchema = void 0;
const zod_1 = require("zod");
exports.HolidayPricingTypeSchema = zod_1.z.enum(['weekend', 'holiday']);
exports.HolidayPeriodCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    start_date: zod_1.z.string().date(),
    end_date: zod_1.z.string().date(),
    pricing_type: exports.HolidayPricingTypeSchema.default('weekend'),
});
exports.HolidayPeriodUpdateSchema = exports.HolidayPeriodCreateSchema.partial();
//# sourceMappingURL=holiday-periods.schema.js.map