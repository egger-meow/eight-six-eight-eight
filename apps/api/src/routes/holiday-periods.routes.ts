import { Router } from 'express';
import { db } from '@8688bnb/db';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateParams } from '../middleware/validate';
import { IdParamSchema } from '../schemas/common.schema';
import { HolidayPeriodCreateSchema, HolidayPeriodUpdateSchema } from '../schemas/holiday-periods.schema';

const router = Router();

function mapHolidayPeriodToResponse(period: any) {
  return {
    id: period.id,
    name: period.name,
    start_date: period.startDate.toISOString().split('T')[0],
    end_date: period.endDate.toISOString().split('T')[0],
    created_at: period.createdAt.toISOString(),
    updated_at: period.updatedAt.toISOString(),
  };
}

function validRange(startDate: Date, endDate: Date) {
  return endDate >= startDate;
}

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const periods = await db.holidayPeriod.findMany({ orderBy: [{ startDate: 'asc' }, { id: 'asc' }] });
    res.json({ success: true, data: periods.map(mapHolidayPeriodToResponse) });
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return res.json({ success: true, data: [], meta: { setup_required: true } });
    }
    next(error);
  }
});

router.post('/', requireAdmin, doubleCsrfProtection, validate(HolidayPeriodCreateSchema), async (req, res, next) => {
  try {
    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);
    if (!validRange(startDate, endDate)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE_RANGE', message: '結束日期不可早於開始日期' } });
    }
    const period = await db.holidayPeriod.create({ data: { name: req.body.name, startDate, endDate } });
    res.status(201).json({ success: true, data: mapHolidayPeriodToResponse(period) });
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return res.status(409).json({ success: false, error: { code: 'SETUP_REQUIRED', message: '節慶日期資料表尚未建立，請先套用資料庫 schema。' } });
    }
    next(error);
  }
});

router.put('/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), validate(HolidayPeriodUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.holidayPeriod.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '假日區間不存在' } });
    const startDate = req.body.start_date ? new Date(req.body.start_date) : existing.startDate;
    const endDate = req.body.end_date ? new Date(req.body.end_date) : existing.endDate;
    if (!validRange(startDate, endDate)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE_RANGE', message: '結束日期不可早於開始日期' } });
    }
    const period = await db.holidayPeriod.update({
      where: { id },
      data: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.start_date !== undefined ? { startDate } : {}),
        ...(req.body.end_date !== undefined ? { endDate } : {}),
      },
    });
    res.json({ success: true, data: mapHolidayPeriodToResponse(period) });
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return res.status(409).json({ success: false, error: { code: 'SETUP_REQUIRED', message: '節慶日期資料表尚未建立，請先套用資料庫 schema。' } });
    }
    next(error);
  }
});

router.delete('/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.holidayPeriod.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '假日區間不存在' } });
    await db.holidayPeriod.delete({ where: { id } });
    res.json({ success: true, data: { message: '假日區間已刪除' } });
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return res.status(409).json({ success: false, error: { code: 'SETUP_REQUIRED', message: '節慶日期資料表尚未建立，請先套用資料庫 schema。' } });
    }
    next(error);
  }
});

export default router;
