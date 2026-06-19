import type { Prisma } from '@8688bnb/db';
import { db } from '@8688bnb/db';
type DbClient = Prisma.TransactionClient | typeof db;
export type BookingValidationError = {
    status: number;
    code: string;
    message: string;
};
export declare function findRoomByRef(roomRef: string, client?: DbClient): Promise<{
    id: number;
    slug: string;
    nameZh: string;
    nameEn: string | null;
    capacity: number;
    type: string;
    description: string | null;
    amenities: string[];
    priceWeekday: number;
    priceWeekend: number;
    priceHoliday: number;
    available: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function validateBookingMutation(args: {
    client?: DbClient;
    bookingId?: number;
    roomId: number;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
}): Promise<{
    room: Awaited<ReturnType<typeof db.room.findUnique>> | null;
    error: BookingValidationError | null;
}>;
export {};
//# sourceMappingURL=booking-rules.d.ts.map