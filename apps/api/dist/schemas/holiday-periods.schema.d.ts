import { z } from 'zod';
export declare const HolidayPeriodCreateSchema: z.ZodObject<{
    name: z.ZodString;
    start_date: z.ZodString;
    end_date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    start_date: string;
    end_date: string;
}, {
    name: string;
    start_date: string;
    end_date: string;
}>;
export declare const HolidayPeriodUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    name?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
//# sourceMappingURL=holiday-periods.schema.d.ts.map