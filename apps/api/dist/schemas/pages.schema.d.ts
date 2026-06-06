import { z } from 'zod';
export declare const PageUpdateSchema: z.ZodObject<{
    title_zh: z.ZodOptional<z.ZodString>;
    title_en: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    content_html: z.ZodOptional<z.ZodString>;
    meta: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    published: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title_zh?: string | undefined;
    title_en?: string | null | undefined;
    content_html?: string | undefined;
    meta?: Record<string, any> | null | undefined;
    published?: boolean | undefined;
}, {
    title_zh?: string | undefined;
    title_en?: string | null | undefined;
    content_html?: string | undefined;
    meta?: Record<string, any> | null | undefined;
    published?: boolean | undefined;
}>;
//# sourceMappingURL=pages.schema.d.ts.map