import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { BlockedDateCreateSchema, BlockedDateUpdateSchema } from '../schemas/blocked-dates.schema';
import { IdParamSchema } from '../schemas/common.schema';

import { db } from '@8688bnb/db';

const router = Router();

function mapBlockedDateToResponse(b: any) {
  return {
    id: b.id,
    room_id: b.roomId,
    start_date: b.startDate.toISOString().split('T')[0],
    end_date: b.endDate.toISOString().split('T')[0],
    reason: b.reason,
    created_at: b.createdAt.toISOString(),
    updated_at: b.updatedAt.toISOString()
  };
}

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const blockedDates = await db.blockedDate.findMany({
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data: blockedDates.map(mapBlockedDateToResponse) });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAdmin, doubleCsrfProtection, validate(BlockedDateCreateSchema), async (req, res, next) => {
  try {
    const data = req.body;
    
    if (data.room_id) {
      const room = await db.room.findUnique({ where: { id: data.room_id } });
      if (!room) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '房型不存在' } });
      }
    }

    const blocked = await db.blockedDate.create({
      data: {
        roomId: data.room_id || null,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        reason: data.reason
      }
    });

    res.status(201).json({ success: true, data: mapBlockedDateToResponse(blocked) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), validate(BlockedDateUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    const existingBlocked = await db.blockedDate.findUnique({ where: { id } });
    if (!existingBlocked) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '封鎖日期不存在' } });
    }

    const updateData: any = {};
    if (data.room_id !== undefined) updateData.roomId = data.room_id;
    if (data.start_date !== undefined) updateData.startDate = new Date(data.start_date);
    if (data.end_date !== undefined) updateData.endDate = new Date(data.end_date);
    if (data.reason !== undefined) updateData.reason = data.reason;

    const updated = await db.blockedDate.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: mapBlockedDateToResponse(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existingBlocked = await db.blockedDate.findUnique({ where: { id } });
    if (!existingBlocked) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '封鎖日期不存在' } });
    }

    await db.blockedDate.delete({ where: { id } });

    res.json({ success: true, data: { message: '封鎖日期已移除' } });
  } catch (error) {
    next(error);
  }
});

export default router;
