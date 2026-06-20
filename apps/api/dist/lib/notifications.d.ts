import type { Booking, Prisma, Room } from '@8688bnb/db';
type BookingWithRoom = Booking & {
    room?: Room | null;
};
type NotificationChannel = 'line' | 'email';
type BookingEventType = 'booking.created' | 'booking.modified' | 'booking.confirmed' | 'booking.cancelled' | 'ota.processing_failed';
type CreateBookingNotificationArgs = {
    tx: Prisma.TransactionClient;
    booking: BookingWithRoom;
    eventType: BookingEventType;
    dedupeKey: string;
    source?: string;
    actorLineAdminId?: number | null;
};
type BookingNotificationPayload = {
    booking_id: number;
    event_type: BookingEventType;
    source: string;
    room: string;
    room_id: number;
    check_in: string;
    check_out: string;
    guest_name: string;
    guest_phone: string;
    guest_line_id: string | null;
    guest_count: number;
    total_price: number | null;
    status: string;
    notes_summary: string | null;
    admin_url: string;
};
export declare function isLineUserId(value: string): boolean;
declare function channelsForEvent(args: CreateBookingNotificationArgs): NotificationChannel[];
export declare function createBookingNotificationEvent(args: CreateBookingNotificationArgs): Promise<number>;
export declare function kickNotificationWorker(): void;
export declare function startNotificationWorker(): Promise<void>;
export declare function stopNotificationWorker(): void;
export declare function processDueNotifications(limit?: number): Promise<void>;
declare function lineFlexMessage(payload: BookingNotificationPayload): import("./line-ui").LineMessage;
export declare const __notificationTest: {
    lineFlexMessage: typeof lineFlexMessage;
    channelsForEvent: typeof channelsForEvent;
};
export {};
//# sourceMappingURL=notifications.d.ts.map