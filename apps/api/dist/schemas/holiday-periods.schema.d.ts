import { z } from 'zod';
export declare const HolidayPricingTypeSchema: z.ZodEnum<["weekend", "holiday"]>;
export declare const HolidayPeriodCreateSchema: z.ZodObject<{
    name: z.ZodString;
    start_date: z.ZodString;
    end_date: z.ZodString;
    pricing_type: z.ZodDefault<z.ZodEnum<["weekend", "holiday"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    start_date: string;
    end_date: string;
    pricing_type: "weekend" | "holiday";
}, {
    name: string;
    start_date: string;
    end_date: string;
    pricing_type?: "weekend" | "holiday" | undefined;
}>;
export declare const HolidayPeriodUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    pricing_type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["weekend", "holiday"]>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    pricing_type?: "weekend" | "holiday" | undefined;
}, {
    name?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    pricing_type?: "weekend" | "holiday" | undefined;
}>;
//# sourceMappingURL=holiday-periods.schema.d.ts.map