import { db } from '@8688bnb/db';

type RoomRates = {
  priceWeekday: number;
  priceWeekend: number;
  priceHoliday: number;
};

function dateOnly(date: Date) {
  return date.toISOString().split('T')[0];
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

  let periods: Array<{ startDate: Date; endDate: Date }> = [];
  try {
    periods = await db.holidayPeriod.findMany({
      where: {
        startDate: { lte: stayDates[stayDates.length - 1] },
        endDate: { gte: stayDates[0] },
      },
    });
  } catch (error: any) {
    if (error?.code !== 'P2021') throw error;
  }

  const holidayDates = new Set<string>();
  for (const period of periods) {
    const current = new Date(period.startDate);
    const end = new Date(period.endDate);
    while (current <= end) {
      holidayDates.add(dateOnly(current));
      current.setDate(current.getDate() + 1);
    }
  }

  return stayDates.reduce((total, date) => {
    if (holidayDates.has(dateOnly(date))) return total + room.priceHoliday;
    const day = date.getDay();
    return total + (day === 5 || day === 6 ? room.priceWeekend : room.priceWeekday);
  }, 0);
}
