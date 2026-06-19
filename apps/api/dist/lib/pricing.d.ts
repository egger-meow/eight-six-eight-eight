type RoomRates = {
    priceWeekday: number;
    priceWeekend: number;
    priceHoliday: number;
};
export declare function eachStayDate(checkIn: Date, checkOut: Date): Date[];
export declare function calculateStayPrice(room: RoomRates, checkIn: Date, checkOut: Date): Promise<number>;
export {};
//# sourceMappingURL=pricing.d.ts.map