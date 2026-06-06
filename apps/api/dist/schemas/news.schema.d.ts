import { z } from 'zod';
export declare const NewsCreateSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    published_at: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    visible: z.ZodDefault<z.ZodBoolean>;
    pinned: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content: string;
    title: string;
    visible: boolean;
    pinned: boolean;
    published_at?: string | null | undefined;
}, {
    content: string;
    title: string;
    published_at?: string | null | undefined;
    visible?: boolean | undefined;
    pinned?: boolean | undefined;
}>;
export declare const NewsUpdateSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    published_at: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    visible: z.ZodOptional<z.ZodBoolean>;
    pinned: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
    title?: string | undefined;
    published_at?: string | null | undefined;
    visible?: boolean | undefined;
    pinned?: boolean | undefined;
}, {
    content?: string | undefined;
    title?: string | undefined;
    published_at?: string | null | undefined;
    visible?: boolean | undefined;
    pinned?: boolean | undefined;
}>;
//# sourceMappingURL=news.schema.d.ts.map