export type LineMessage = Record<string, any>;
export type BookingCardInput = {
    id: number;
    status: string;
    source: string;
    room: string;
    checkIn: string;
    checkOut: string;
    guestName: string;
    guestCount: number;
    guestPhone: string;
    guestLineId?: string | null;
    totalPrice?: number | null;
    notes?: string | null;
    notificationStatus?: string | null;
    adminUrl?: string;
};
export type ParsedLinePostback = {
    ok: true;
    version: 1;
    action: string;
    params: URLSearchParams;
} | {
    ok: false;
    reason: string;
};
export declare const linePostbacks: {
    dashboard: string;
    bookingMenu: string;
    bookingCreate: string;
    blockedMenu: string;
    roomMenu: string;
    announcement: string;
    bookingSearch: (scope: string) => string;
    bookingAction: (action: string, bookingId: number) => string;
    bookingMore: (bookingId: number) => string;
    bookingRoom: (roomRef: string) => string;
    bookingGuests: (guestCount: number) => string;
    bookingConfirmCreate: string;
    bookingCancelCreate: string;
    addNote: (bookingId: number) => string;
    modifyBooking: (bookingId: number) => string;
    blockFlow: (action: string) => string;
    createBlock: (start: string, end: string, reason: string) => string;
    removeBlock: (blockId: number) => string;
};
export declare function parseLinePostback(data: string | undefined): ParsedLinePostback;
export declare function normalizePhoneForTelUri(phone: string | null | undefined): string | null;
export declare function bookingSummaryText(booking: BookingCardInput): string;
export declare function bookingStatusActions(status: string): string[];
export declare function bookingMoreQuickReply(booking: BookingCardInput): {
    items: any[];
};
export declare function bookingQuickReplyItems(booking: BookingCardInput): any[];
export declare function quickReply(labels: Array<{
    label: string;
    data?: string;
    text?: string;
}>): {
    items: {
        type: string;
        action: {
            type: string;
            label: string;
            data: string;
            text?: undefined;
        } | {
            type: string;
            label: string;
            text: string;
            data?: undefined;
        };
    }[];
};
export declare const bookingMenuQuickReply: {
    items: {
        type: string;
        action: {
            type: string;
            label: string;
            data: string;
            text?: undefined;
        } | {
            type: string;
            label: string;
            text: string;
            data?: undefined;
        };
    }[];
};
export declare const blockedDateQuickReply: {
    items: {
        type: string;
        action: {
            type: string;
            label: string;
            data: string;
            text?: undefined;
        } | {
            type: string;
            label: string;
            text: string;
            data?: undefined;
        };
    }[];
};
export declare const roomQuickReply: {
    items: {
        type: string;
        action: {
            type: string;
            label: string;
            data: string;
            text?: undefined;
        } | {
            type: string;
            label: string;
            text: string;
            data?: undefined;
        };
    }[];
};
export declare function postbackQuickReply(labels: Array<{
    label: string;
    data: string;
}>): {
    items: {
        type: string;
        action: {
            type: string;
            label: string;
            data: string;
        };
    }[];
};
export declare function datePickerAction(label: string, data: string, initial?: string): {
    type: string;
    label: string;
    data: string;
    mode: string;
    initial: string | undefined;
};
export declare function datePickerQuickReply(items: Array<{
    label: string;
    data: string;
    initial?: string;
}>): {
    items: {
        type: string;
        action: {
            type: string;
            label: string;
            data: string;
            mode: string;
            initial: string | undefined;
        };
    }[];
};
export declare function bookingFlexMessage(booking: BookingCardInput): LineMessage;
export declare function bookingCarouselMessage(bookings: BookingCardInput[]): {
    type: string;
    altText: string;
    contents: {
        type: string;
        contents: any[];
    };
};
export declare function commandHelpText(): string;
export declare function textMessage(text: string, quickReplyValue?: any): {
    type: string;
    text: string;
    quickReply: any;
} | {
    type: string;
    text: string;
    quickReply?: undefined;
};
//# sourceMappingURL=line-ui.d.ts.map