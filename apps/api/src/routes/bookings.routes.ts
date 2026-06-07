import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery } from '../middleware/validate';
import { BookingCreateSchema, BookingUpdateSchema, BookingNoteSchema } from '../schemas/bookings.schema';
import { PaginationQuerySchema, IdParamSchema, DateRangeQuerySchema } from '../schemas/common.schema';

import { db } from '@8688bnb/db';

const router = Router();

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
      data: bookings,
      meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(BookingCreateSchema), async (req, res, next) => {
  try {
    const data = req.body;
    
    // Check availability
    const conflict = await db.booking.findFirst({
      where: {
        roomId: data.room_id,
        status: { notIn: ['cancelled', 'no_show'] },
        AND: [
          { checkIn: { lt: new Date(data.check_out) } },
          { checkOut: { gt: new Date(data.check_in) } }
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: '該時段已被預訂' } });
    }

    const booking = await db.booking.create({
      data: {
        roomId: data.room_id,
        checkIn: new Date(data.check_in),
        checkOut: new Date(data.check_out),
        guestName: data.guest_name,
        guestPhone: data.guest_phone,
        guestEmail: data.guest_email || null,
        guestCount: data.guest_count,
        notes: data.notes,
      }
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

router.get('/calendar', requireAdmin, validateQuery(DateRangeQuerySchema), async (req, res, next) => {
  try {
    const from = new Date(req.query.from as string);
    const to = new Date(req.query.to as string);

    const rooms = await db.room.findMany({
      include: {
        bookings: {
          where: {
            checkIn: { lte: to },
            checkOut: { gte: from },
          }
        },
        blockedDates: {
          where: {
            startDate: { lte: to },
            endDate: { gte: from },
          }
        }
      }
    });

    res.json({
      success: true,
      data: { from: req.query.from, to: req.query.to, rooms }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAdmin, validateQuery(IdParamSchema), (req, res) => {
  // TODO: Fetch from DB
  res.json({ success: true, data: { id: req.params.id } });
});

router.put('/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), validate(BookingUpdateSchema), (req, res) => {
  // TODO: Update DB
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});

router.delete('/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), (req, res) => {
  // TODO: Delete from DB
  res.json({ success: true, data: { message: '預約已刪除' } });
});

router.post('/:id/notes', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), validate(BookingNoteSchema), (req, res) => {
  // TODO: Save to DB
  res.status(201).json({ success: true, data: { id: 1, booking_id: req.params.id, ...req.body } });
});

export default router;
