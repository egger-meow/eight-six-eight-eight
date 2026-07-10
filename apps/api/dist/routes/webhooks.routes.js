"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const webhook_auth_1 = require("../middleware/webhook-auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const webhooks_schema_1 = require("../schemas/webhooks.schema");
const common_schema_1 = require("../schemas/common.schema");
const db_1 = require("@8688bnb/db");
const router = (0, express_1.Router)();
function mapWebhookEventToResponse(e) {
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
router.post('/ingest', webhook_auth_1.requireWebhookApiKey, (0, validate_1.validate)(webhooks_schema_1.WebhookIngestSchema), async (req, res, next) => {
    try {
        const data = req.body;
        // Save payload to DB webhook_events table
        const event = await db_1.db.webhookEvent.create({
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
    }
    catch (error) {
        next(error);
    }
});
// Admin management endpoints
router.get('/events', auth_1.requireAdmin, (0, validate_1.validateQuery)(common_schema_1.PaginationQuerySchema), async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1);
        const per_page = Number(req.query.per_page || 20);
        const [total, events] = await Promise.all([
            db_1.db.webhookEvent.count(),
            db_1.db.webhookEvent.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/events/:id', auth_1.requireAdmin, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const event = await db_1.db.webhookEvent.findUnique({ where: { id } });
        if (!event) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '事件不存在' } });
        }
        res.json({ success: true, data: mapWebhookEventToResponse(event) });
    }
    catch (error) {
        next(error);
    }
});
router.put('/events/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateParams)(common_schema_1.IdParamSchema), (0, validate_1.validate)(webhooks_schema_1.WebhookEventUpdateSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = req.body;
        const existingEvent = await db_1.db.webhookEvent.findUnique({ where: { id } });
        if (!existingEvent) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '事件不存在' } });
        }
        const updateData = {};
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.error_message !== undefined)
            updateData.errorMessage = data.error_message;
        const updated = await db_1.db.webhookEvent.update({
            where: { id },
            data: updateData
        });
        res.json({ success: true, data: mapWebhookEventToResponse(updated) });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=webhooks.routes.js.map