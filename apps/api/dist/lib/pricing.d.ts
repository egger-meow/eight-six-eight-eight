type RoomRates = {
    priceWeekday: number;
    priceWeekend: number;
    priceHoliday: number;
};
type StayPricingDetails = {
    totalPrice: number;
    hasSpecialWeekendRate: boolean;
    hasHolidayRate: boolean;
};
export declare function eachStayDate(checkIn: Date, checkOut: Date): Date[];
export declare function calculateStayPricingDetails(room: RoomRates, checkIn: Date, checkOut: Date): Promise<StayPricingDetails>;
export declare function calculateStayPrice(room: RoomRates, checkIn: Date, checkOut: Date): Promise<number>;
export {};
//# sourceMappingURL=pricing.d.ts.map