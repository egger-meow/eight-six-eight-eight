import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { requireWebhookApiKey } from '../middleware/webhook-auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { WebhookIngestSchema, WebhookEventUpdateSchema } from '../schemas/webhooks.schema';
import { IdParamSchema, PaginationQuerySchema } from '../schemas/common.schema';

import { db } from '@8688bnb/db';

const router = Router();

function mapWebhookEventToResponse(e: any) {
  return {
    id: e.id,
    event_type: e.eventType,
    platform: e.platform,
    external_booking_id: e.externalBookingId,
    data: e.data,
    status: e.status,
    error_message: e.errorMessage,
    created_at: e.createdAt.toISOString(),
    updated_at: e.updatedAt.toISOString()
  };
}

// Ingest webhook (authenticated via API key, NOT admin session)
router.post('/ingest', requireWebhookApiKey, validate(WebhookIngestSchema), async (req, res, next) => {
  try {
    const data = req.body;
    
    // Save payload to DB webhook_events table
    const event = await db.webhookEvent.create({
      data: {
        eventType: data.event_type,
        platform: data.platform,
        externalBookingId: data.external_booking_id || null,
        data: data.data || null,
        status: 'received'
      }
    });

    res.json({
      success: true,
      data: {
        event_id: event.id,
        status: event.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin management endpoints
router.get('/events', requireAdmin, validateQuery(PaginationQuerySchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const per_page = Number(req.query.per_page || 20);

    const [total, events] = await Promise.all([
      db.webhookEvent.count(),
      db.webhookEvent.findMany({
        skip: (page - 1) * per_page,
        take: per_page,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      success: true,
      data: events.map(mapWebhookEventToResponse),
      meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/events/:id', requireAdmin, validateParams(IdParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const event = await db.webhookEvent.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '事件不存在' } });
    }
    res.json({ success: true, data: mapWebhookEventToResponse(event) });
  } catch (error) {
    next(error);
  }
});

router.put('/events/:id', requireAdmin, doubleCsrfProtection, validateParams(IdParamSchema), validate(WebhookEventUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    const existingEvent = await db.webhookEvent.findUnique({ where: { id } });
    if (!existingEvent) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '事件不存在' } });
    }

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.error_message !== undefined) updateData.errorMessage = data.error_message;

    const updated = await db.webhookEvent.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: mapWebhookEventToResponse(updated) });
  } catch (error) {
    next(error);
  }
});

export default router;
