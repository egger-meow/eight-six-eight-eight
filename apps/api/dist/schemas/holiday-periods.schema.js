"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayPeriodUpdateSchema = exports.HolidayPeriodCreateSchema = void 0;
const zod_1 = require("zod");
exports.HolidayPeriodCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    start_date: zod_1.z.string().date(),
    end_date: zod_1.z.string().date(),
});
exports.HolidayPeriodUpdateSchema = exports.HolidayPeriodCreateSchema.partial();
//# sourceMappingURL=holiday-periods.schema.js.map