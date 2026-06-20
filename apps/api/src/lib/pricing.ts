import { db } from '@8688bnb/db';

type RoomRates = {
  priceWeekday: number;
  priceWeekend: number;
  priceHoliday: number;
};

type PricingType = 'weekend' | 'holiday';

type PricingPeriod = {
  startDate: Date;
  endDate: Date;
  pricingType: string | null;
};

type LegacyPricingPeriodRow = {
  name: string;
  startDate: Date;
  endDate: Date;
};

function dateOnly(date: Date) {
  return date.toISOString().split('T')[0];
}

function inferPricingTypeFromName(name: string): PricingType {
  return /春節|除夕|農曆/.test(name) ? 'holiday' : 'weekend';
}

function periodType(period: PricingPeriod): PricingType {
  return period.pricingType === 'holiday' ? 'holiday' : 'weekend';
}

async function findLegacyPricingPeriods(firstStayDate: Date, lastStayDate: Date): Promise<PricingPeriod[]> {
  const rows = await db.$queryRawUnsafe<LegacyPricingPeriodRow[]>(
    'SELECT name, "startDate", "endDate" FROM "HolidayPeriod" WHERE "startDate" <= $1 AND "endDate" >= $2 ORDER BY "startDate" ASC, id ASC',
    lastStayDate,
    firstStayDate,
  );

  return rows
    .map((row) => ({
      startDate: row.startDate,
      endDate: row.endDate,
      pricingType: inferPricingTypeFromName(row.name),
    }))
    .sort((a, b) => periodType(a).localeCompare(periodType(b)) || a.startDate.getTime() - b.startDate.getTime());
}

function isFinalDateInMultiDayWeekendPeriod(date: Date, period: PricingPeriod) {
  return periodType(period) === 'weekend' && dateOnly(period.startDate) !== dateOnly(period.endDate) && dateOnly(date) === dateOnly(period.endDate);
}

function rateForSpecialDate(room: RoomRates, date: Date, periods: PricingPeriod[]) {
  const matchingPeriod = periods.find((period) => date >= period.startDate && date <= period.endDate);
  if (!matchingPeriod) return null;
  if (periodType(matchingPeriod) === 'holiday') return room.priceHoliday;
  return isFinalDateInMultiDayWeekendPeriod(date, matchingPeriod) ? room.priceWeekday : room.priceWeekend;
}

export function eachStayDate(checkIn: Date, checkOut: Date) {
  const dates: Date[] = [];
  const current = new Date(checkIn);
  while (current < checkOut) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function calculateStayPrice(room: RoomRates, checkIn: Date, checkOut: Date) {
  const stayDates = eachStayDate(checkIn, checkOut);
  if (stayDates.length === 0) return 0;

  let periods: PricingPeriod[] = [];
  try {
    periods = await db.holidayPeriod.findMany({
      where: {
        startDate: { lte: stayDates[stayDates.length - 1] },
        endDate: { gte: stayDates[0] },
      },
      orderBy: [{ pricingType: 'asc' }, { startDate: 'asc' }, { id: 'asc' }],
    });
  } catch (error: any) {
    if (error?.code === 'P2022') {
      periods = await findLegacyPricingPeriods(stayDates[0], stayDates[stayDates.length - 1]);
    } else if (error?.code !== 'P2021') {
      throw error;
    }
  }

  return stayDates.reduce((total, date) => {
    const specialRate = rateForSpecialDate(room, date, periods);
    if (specialRate !== null) return total + specialRate;
    return total + (date.getDay() === 6 ? room.priceWeekend : room.priceWeekday);
  }, 0);
}
