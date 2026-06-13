import { z } from 'zod';
export declare const MediaUpdateSchema: z.ZodObject<{
    alt_text: z.ZodOptional<z.ZodString>;
    target: z.ZodOptional<z.ZodString>;
    sort_order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sort_order?: number | undefined;
    target?: string | undefined;
    alt_text?: string | undefined;
}, {
    sort_order?: number | undefined;
    target?: string | undefined;
    alt_text?: string | undefined;
}>;
export declare const MediaReorderSchema: z.ZodObject<{
    image_ids: z.ZodArray<z.ZodNumber, "many">;
}, "strip", z.ZodTypeAny, {
    image_ids: number[];
}, {
    image_ids: number[];
}>;
//# sourceMappingURL=media.schema.d.ts.map