import type { Booking, Prisma, Room } from '@8688bnb/db';
type BookingWithRoom = Booking & {
    room?: Room | null;
};
type BookingEventType = 'booking.created' | 'booking.modified' | 'booking.confirmed' | 'booking.cancelled' | 'ota.processing_failed';
type CreateBookingNotificationArgs = {
    tx: Prisma.TransactionClient;
    booking: BookingWithRoom;
    eventType: BookingEventType;
    dedupeKey: string;
    source?: string;
    actorLineAdminId?: number | null;
};
export declare function isLineUserId(value: string): boolean;
export declare function createBookingNotificationEvent(args: CreateBookingNotificationArgs): Promise<number>;
export declare function kickNotificationWorker(): void;
export declare function startNotificationWorker(): Promise<void>;
export declare function stopNotificationWorker(): void;
export declare function processDueNotifications(limit?: number): Promise<void>;
export {};
//# sourceMappingURL=notifications.d.ts.map