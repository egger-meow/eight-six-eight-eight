"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eachStayDate = eachStayDate;
exports.calculateStayPrice = calculateStayPrice;
const db_1 = require("@8688bnb/db");
function dateOnly(date) {
    return date.toISOString().split('T')[0];
}
function eachStayDate(checkIn, checkOut) {
    const dates = [];
    const current = new Date(checkIn);
    while (current < checkOut) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
async function calculateStayPrice(room, checkIn, checkOut) {
    const stayDates = eachStayDate(checkIn, checkOut);
    if (stayDates.length === 0)
        return 0;
    let periods = [];
    try {
        periods = await db_1.db.holidayPeriod.findMany({
            where: {
                startDate: { lte: stayDates[stayDates.length - 1] },
                endDate: { gte: stayDates[0] },
            },
        });
    }
    catch (error) {
        if (error?.code !== 'P2021')
            throw error;
    }
    const holidayDates = new Set();
    for (const period of periods) {
        const current = new Date(period.startDate);
        const end = new Date(period.endDate);
        while (current <= end) {
            holidayDates.add(dateOnly(current));
            current.setDate(current.getDate() + 1);
        }
    }
    return stayDates.reduce((total, date) => {
        if (holidayDates.has(dateOnly(date)))
            return total + room.priceHoliday;
        const day = date.getDay();
        return total + (day === 5 || day === 6 ? room.priceWeekend : room.priceWeekday);
    }, 0);
}
//# sourceMappingURL=pricing.js.map