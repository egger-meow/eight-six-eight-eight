import { z } from 'zod';
export declare const WebhookIngestSchema: z.ZodObject<{
    event_type: z.ZodEnum<["new_booking", "modify_booking", "cancel_booking", "rate_update", "inventory_update"]>;
    platform: z.ZodString;
    external_booking_id: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    event_type: "new_booking" | "modify_booking" | "cancel_booking" | "rate_update" | "inventory_update";
    platform: string;
    data?: Record<string, any> | undefined;
    external_booking_id?: string | undefined;
}, {
    event_type: "new_booking" | "modify_booking" | "cancel_booking" | "rate_update" | "inventory_update";
    platform: string;
    data?: Record<string, any> | undefined;
    external_booking_id?: string | undefined;
}>;
export declare const WebhookEventUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<["processed", "ignored", "failed"]>;
    error_message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "processed" | "ignored" | "failed";
    error_message?: string | undefined;
}, {
    status: "processed" | "ignored" | "failed";
    error_message?: string | undefined;
}>;
//# sourceMappingURL=webhooks.schema.d.ts.map