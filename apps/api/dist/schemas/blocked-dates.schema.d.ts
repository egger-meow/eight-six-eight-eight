import { z } from 'zod';
export declare const BlockedDateCreateSchema: z.ZodObject<{
    room_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    start_date: z.ZodString;
    end_date: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    start_date: string;
    end_date: string;
    room_id?: number | null | undefined;
}, {
    reason: string;
    start_date: string;
    end_date: string;
    room_id?: number | null | undefined;
}>;
export declare const BlockedDateUpdateSchema: z.ZodObject<{
    room_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
    room_id?: number | null | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    reason?: string | undefined;
    room_id?: number | null | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
//# sourceMappingURL=blocked-dates.schema.d.ts.map