import { z } from 'zod';
export declare const BookingCreateSchema: z.ZodObject<{
    room_id: z.ZodNumber;
    check_in: z.ZodString;
    check_out: z.ZodString;
    guest_name: z.ZodString;
    guest_phone: z.ZodString;
    guest_email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    guest_count: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    room_id: number;
    check_in: string;
    check_out: string;
    guest_name: string;
    guest_phone: string;
    guest_count: number;
    guest_email?: string | undefined;
    notes?: string | undefined;
}, {
    room_id: number;
    check_in: string;
    check_out: string;
    guest_name: string;
    guest_phone: string;
    guest_count: number;
    guest_email?: string | undefined;
    notes?: string | undefined;
}>;
export declare const BookingUpdateSchema: z.ZodObject<{
    room_id: z.ZodOptional<z.ZodNumber>;
    check_in: z.ZodOptional<z.ZodString>;
    check_out: z.ZodOptional<z.ZodString>;
    guest_name: z.ZodOptional<z.ZodString>;
    guest_phone: z.ZodOptional<z.ZodString>;
    guest_email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    guest_count: z.ZodOptional<z.ZodNumber>;
    total_price: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"]>>;
    notes: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodEnum<["website", "phone", "line", "ota", "walk_in", "admin"]>>;
    ota_platform: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ota_booking_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "cancelled" | "no_show" | "pending" | "confirmed" | "checked_in" | "checked_out" | undefined;
    room_id?: number | undefined;
    check_in?: string | undefined;
    check_out?: string | undefined;
    guest_name?: string | undefined;
    guest_phone?: string | undefined;
    guest_email?: string | undefined;
    guest_count?: number | undefined;
    notes?: string | undefined;
    total_price?: number | undefined;
    source?: "website" | "phone" | "line" | "ota" | "walk_in" | "admin" | undefined;
    ota_platform?: string | null | undefined;
    ota_booking_id?: string | null | undefined;
}, {
    status?: "cancelled" | "no_show" | "pending" | "confirmed" | "checked_in" | "checked_out" | undefined;
    room_id?: number | undefined;
    check_in?: string | undefined;
    check_out?: string | undefined;
    guest_name?: string | undefined;
    guest_phone?: string | undefined;
    guest_email?: string | undefined;
    guest_count?: number | undefined;
    notes?: string | undefined;
    total_price?: number | undefined;
    source?: "website" | "phone" | "line" | "ota" | "walk_in" | "admin" | undefined;
    ota_platform?: string | null | undefined;
    ota_booking_id?: string | null | undefined;
}>;
export declare const BookingNoteSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
//# sourceMappingURL=bookings.schema.d.ts.map