import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { requireWebhookApiKey } from '../middleware/webhook-auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery } from '../middleware/validate';
import { WebhookIngestSchema, WebhookEventUpdateSchema } from '../schemas/webhooks.schema';
import { IdParamSchema, PaginationQuerySchema } from '../schemas/common.schema';

const router = Router();

// Ingest webhook (authenticated via API key, NOT admin session)
router.post('/ingest', requireWebhookApiKey, validate(WebhookIngestSchema), (req, res) => {
  // TODO: Save payload to DB webhook_events table
  res.json({
    success: true,
    data: {
      event_id: 1,
      status: 'received'
    }
  });
});

// Admin management endpoints
router.get('/events', requireAdmin, validateQuery(PaginationQuerySchema), (req, res) => {
  // TODO: Fetch from DB
  res.json({ success: true, data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } });
});

router.get('/events/:id', requireAdmin, validateQuery(IdParamSchema), (req, res) => {
  // TODO: Fetch from DB
  res.json({ success: true, data: { id: req.params.id } });
});

router.put('/events/:id', requireAdmin, doubleCsrfProtection, validateQuery(IdParamSchema), validate(WebhookEventUpdateSchema), (req, res) => {
  // TODO: Update status in DB
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});

export default router;
