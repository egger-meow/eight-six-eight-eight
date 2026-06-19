import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { BookingCreateSchema, BookingUpdateSchema, BookingNoteSchema } from '../schemas/bookings.schema';
import { PaginationQuerySchema, IdParamSchema, DateRangeQuerySchema } from '../schemas/common.schema';

import { db } from '@8688bnb/db';
import { calculateStayPrice } from '../lib/pricing';

const router = Router();

function mapBookingToResponse(b: any) {
  return {
    id: b.id,
    room_id: b.roomId,
    room: b.room ? {
      id: b.room.id,
      slug: b.room.slug,
      name_zh: b.room.nameZh,
      type: b.room.type
    } : undefined,
    source: b.source,
    ota_platform: b.otaPlatform,
    ota_booking_id: b.otaBookingId,
    check_in: b.checkIn.toISOString().split('T')[0],
    check_out: b.checkOut.toISOString().split('T')[0],
    guest_name: b.guestName,
    guest_phone: b.guestPhone,
    guest_line_id: b.guestLineId,
    guest_count: b.guestCount,
    total_price: b.totalPrice,
    status: b.status,
    notes: b.notes,
    internal_notes: b.internalNotes ? b.internalNotes.map((n: any) => ({
      id: n.id,
      booking_id: n.bookingId,
      content: n.content,
      created_at: n.createdAt.toISOString()
    })) : undefined,
    created_at: b.createdAt.toISOString(),
    updated_at: b.updatedAt.toISOString()
  };
}

router.get('/', requireAdmin, validateQuery(PaginationQuerySchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const per_page = Number(req.query.per_page || 20);
    
    const [total, bookings] = await Promise.all([
      db.booking.count(),
      db.booking.findMany({
        skip: (page - 1) * per_page,
        take: per_page,
        orderBy: { createdAt: 'desc' },
        include: { room: true }
      })
    ]);

    res.json({
      success: true,
      data: bookings.map(mapBookingToResponse),
      meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(BookingCreateSchema), async (req, res, next) => {
  try {
    const data = req.body;
    
    // Check room exists
    const room = await db.room.findUnique({ where: { id: data.room_id } });
    if (!room) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '房型不存在' } });
    }

    const checkInDate = new Date(data.check_in);
    const checkOutDate = new Date(data.check_out);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE_RANGE', message: '退房日期必須晚於入住日期' } });
    }

    if (!room.available) {
      return res.status(409).json({ success: false, error: { code: 'ROOM_UNAVAILABLE', message: '此房型目前未開放預訂' } });
    }

    if (data.guest_count > room.capacity) {
      return res.status(400).json({ success: false, error: { code: 'CAPACITY_EXCEEDED', message: '入住人數超過房型可容納人數' } });
    }

    // Check availability
    const conflict = await db.booking.findFirst({
      where: {
        roomId: data.room_id,
        status: { notIn: ['cancelled', 'no_show'] },
        AND: [
          { checkIn: { lt: checkOutDate } },
          { checkOut: { gt: checkInDate } }
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: '該時段已被預訂' } });
    }

    const blockedConflict = await db.blockedDate.findFirst({
      where: {
        OR: [
          { roomId: data.room_id },
          { roomId: null }
        ],
        AND: [
          { startDate: { lte: checkOutDate } },
          { endDate: { gte: checkInDate } }
        ]
      }
    });

    if (blockedConflict) {
      return res.status(409).json({ success: false, error: { code: 'BLOCKED_DATE', message: '該時段目前無法預訂' } });
    }

    const totalPrice = await calculateStayPrice(room, checkInDate, checkOutDate);

    const booking = await db.booking.create({
      data: {
        roomId: data.room_id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guestName: data.guest_name,
        guestPhone: data.guest_phone,
        guestLineId: data.guest_line_id || null,
        guestCount: data.guest_count,
        notes: data.notes || null,
        totalPrice,
        status: 'pending',
        source: 'website'
      },
      include: { room: true }
    });

    res.status(201).json({ success: true, data: mapBookingToResponse(booking) });
  } catch (error) {
    next(error);
  }
});

router.get('/calendar', requireAdmin, validateQuery(DateRangeQuerySchema), async (req, res, next) => {
  try {
    const fromStr = req.query.from as string;
    const toStr = req.query.to as string;
    const from = new Date(fromStr);
    const to = new Date(toStr);

    const roomFilterId = req.query.room_id ? Number(req.query.room_id) : undefined;

    // Fetch all rooms
    const rooms = await db.room.findMany({
      where: roomFilterId ? { id: roomFilterId } : undefined,
      orderBy: { sortOrder: 'asc' }
    });

    // Fetch all active bookings for the range
    const bookings = await db.booking.findMany({
      where: {
        status: { notIn: ['cancelled', 'no_show'] },
        AND: [
          { checkIn: { lt: to } },
          { checkOut: { gt: from } }
        ]
      }
    });

    // Fetch all blocked dates for the range
    const blockedDates = await db.blockedDate.findMany({
      where: {
        AND: [
          { startDate: { lte: to } },
          { endDate: { gte: from } }
        ]
      }
    });

    // Generate list of dates from `from` to `to` inclusive
    const datesList: string[] = [];
    let curr = new Date(from);
    while (curr <= to) {
      datesList.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    // Build the calendar rooms array
    const roomsData = rooms.map((room: any) => {
      const roomBookings = bookings.filter((b: any) => b.roomId === room.id);
      const roomBlocks = blockedDates.filter((b: any) => b.roomId === room.id || b.roomId === null);

      const days = datesList.map(dateStr => {
        const d = new Date(dateStr);

        // Find if blocked on this date
        const block = roomBlocks.find((b: any) => {
          const start = new Date(b.startDate);
          const end = new Date(b.endDate);
          return d >= start && d <= end;
        });

        // Find if booked on this date (checkIn <= d < checkOut)
        const booking = roomBookings.find((b: any) => {
          const start = new Date(b.checkIn);
          const end = new Date(b.checkOut);
          return d >= start && d < end;
        });

        let status = 'available';
        if (block) {
          status = 'blocked';
        } else if (booking) {
          status = booking.status === 'checked_in' ? 'checked_in' : 'booked';
        }

        return {
          date: dateStr,
          room_id: room.id,
          room_slug: room.slug,
          room_name_zh: room.nameZh,
          status,
          booking: (status === 'booked' || status === 'checked_in') && booking ? {
            id: booking.id,
            guest_name: booking.guestName,
            guest_count: booking.guestCount,
            check_in: booking.checkIn.toISOString().split('T')[0],
            check_out: booking.checkOut.toISOString().split('T')[0],
            status: booking.status,
            source: booking.source
          } : null,
          blocked_info: status === 'blocked' && block ? {
            reason: block.reason
          } : null
        };
      });

      return {
        room_id: room.id,
        room_slug: room.slug,
        room_name_zh: room.nameZh,
        days
      };
    });

    res.json({
      success: true,
      data: {
        from: fromStr,
        to: toStr,
        rooms: roomsData
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAdmin, validateParams(IdParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        room: true,
        internalNotes: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '預約不存在' } });
    }

    res.json({ success: true, data: mapBookingToResponse(booking) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), validate(BookingUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    const existingBooking = await db.booking.findUnique({ where: { id } });
    if (!existingBooking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '預約不存在' } });
    }

    const updateData: any = {};
    if (data.room_id !== undefined) updateData.roomId = data.room_id;
    if (data.check_in !== undefined) updateData.checkIn = new Date(data.check_in);
    if (data.check_out !== undefined) updateData.checkOut = new Date(data.check_out);
    if (data.guest_name !== undefined) updateData.guestName = data.guest_name;
    if (data.guest_phone !== undefined) updateData.guestPhone = data.guest_phone;
    if (data.guest_line_id !== undefined) updateData.guestLineId = data.guest_line_id || null;
    if (data.guest_count !== undefined) updateData.guestCount = data.guest_count;
    if (data.total_price !== undefined) updateData.totalPrice = data.total_price;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.ota_platform !== undefined) updateData.otaPlatform = data.ota_platform;
    if (data.ota_booking_id !== undefined) updateData.otaBookingId = data.ota_booking_id;

    if (updateData.roomId || updateData.checkIn || updateData.checkOut) {
      const roomId = updateData.roomId || existingBooking.roomId;
      const checkIn = updateData.checkIn || existingBooking.checkIn;
      const checkOut = updateData.checkOut || existingBooking.checkOut;

      const conflict = await db.booking.findFirst({
        where: {
          id: { not: id },
          roomId,
          status: { notIn: ['cancelled', 'no_show'] },
          AND: [
            { checkIn: { lt: checkOut } },
            { checkOut: { gt: checkIn } }
          ]
        }
      });

      if (conflict) {
        return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: '該時段已被預訂' } });
      }
    }

    const updatedBooking = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        room: true,
        internalNotes: { orderBy: { createdAt: 'desc' } }
      }
    });

    res.json({ success: true, data: mapBookingToResponse(updatedBooking) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existingBooking = await db.booking.findUnique({ where: { id } });
    if (!existingBooking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '預約不存在' } });
    }

    await db.booking.delete({ where: { id } });

    res.json({ success: true, data: { message: '預約已刪除' } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/notes', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), validate(BookingNoteSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body;

    const existingBooking = await db.booking.findUnique({ where: { id } });
    if (!existingBooking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '預約不存在' } });
    }

    const note = await db.bookingNote.create({
      data: {
        bookingId: id,
        content
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: note.id,
        booking_id: note.bookingId,
        content: note.content,
        created_at: note.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});
export default router;
