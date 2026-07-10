"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eachStayDate = eachStayDate;
exports.calculateStayPricingDetails = calculateStayPricingDetails;
exports.calculateStayPrice = calculateStayPrice;
const db_1 = require("@8688bnb/db");
function dateOnly(date) {
    return date.toISOString().split('T')[0];
}
function inferPricingTypeFromName(name) {
    return /春節|除夕|農曆/.test(name) ? 'holiday' : 'weekend';
}
function periodType(period) {
    return period.pricingType === 'holiday' ? 'holiday' : 'weekend';
}
async function findLegacyPricingPeriods(firstStayDate, lastStayDate) {
    const rows = await db_1.db.$queryRawUnsafe('SELECT name, "startDate", "endDate" FROM "HolidayPeriod" WHERE "startDate" <= $1 AND "endDate" >= $2 ORDER BY "startDate" ASC, id ASC', lastStayDate, firstStayDate);
    return rows
        .map((row) => ({
        startDate: row.startDate,
        endDate: row.endDate,
        pricingType: inferPricingTypeFromName(row.name),
    }))
        .sort((a, b) => periodType(a).localeCompare(periodType(b)) || a.startDate.getTime() - b.startDate.getTime());
}
function isFinalDateInMultiDayWeekendPeriod(date, period) {
    return periodType(period) === 'weekend' && dateOnly(period.startDate) !== dateOnly(period.endDate) && dateOnly(date) === dateOnly(period.endDate);
}
function rateForSpecialDate(room, date, periods) {
    const matchingPeriod = periods.find((period) => date >= period.startDate && date <= period.endDate);
    if (!matchingPeriod)
        return null;
    if (periodType(matchingPeriod) === 'holiday')
        return room.priceHoliday;
    return isFinalDateInMultiDayWeekendPeriod(date, matchingPeriod) ? room.priceWeekday : room.priceWeekend;
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
async function calculateStayPricingDetails(room, checkIn, checkOut) {
    const stayDates = eachStayDate(checkIn, checkOut);
    if (stayDates.length === 0) {
        return { totalPrice: 0, hasSpecialWeekendRate: false, hasHolidayRate: false };
    }
    let periods = [];
    try {
        periods = await db_1.db.holidayPeriod.findMany({
            where: {
                startDate: { lte: stayDates[stayDates.length - 1] },
                endDate: { gte: stayDates[0] },
            },
            orderBy: [{ pricingType: 'asc' }, { startDate: 'asc' }, { id: 'asc' }],
        });
    }
    catch (error) {
        if (error?.code === 'P2022') {
            periods = await findLegacyPricingPeriods(stayDates[0], stayDates[stayDates.length - 1]);
        }
        else if (error?.code !== 'P2021') {
            throw error;
        }
    }
    return stayDates.reduce((details, date) => {
        const matchingPeriod = periods.find((period) => date >= period.startDate && date <= period.endDate);
        const specialRate = rateForSpecialDate(room, date, periods);
        if (matchingPeriod && periodType(matchingPeriod) === 'holiday') {
            details.hasHolidayRate = true;
        }
        else if (matchingPeriod && !isFinalDateInMultiDayWeekendPeriod(date, matchingPeriod)) {
            details.hasSpecialWeekendRate = true;
        }
        details.totalPrice += specialRate ?? (date.getDay() === 6 ? room.priceWeekend : room.priceWeekday);
        return details;
    }, { totalPrice: 0, hasSpecialWeekendRate: false, hasHolidayRate: false });
}
async function calculateStayPrice(room, checkIn, checkOut) {
    const details = await calculateStayPricingDetails(room, checkIn, checkOut);
    return details.totalPrice;
}
//# sourceMappingURL=pricing.js.map