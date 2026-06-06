"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const webhook_auth_1 = require("../middleware/webhook-auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const webhooks_schema_1 = require("../schemas/webhooks.schema");
const common_schema_1 = require("../schemas/common.schema");
const router = (0, express_1.Router)();
// Ingest webhook (authenticated via API key, NOT admin session)
router.post('/ingest', webhook_auth_1.requireWebhookApiKey, (0, validate_1.validate)(webhooks_schema_1.WebhookIngestSchema), (req, res) => {
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
router.get('/events', auth_1.requireAdmin, (0, validate_1.validateQuery)(common_schema_1.PaginationQuerySchema), (req, res) => {
    // TODO: Fetch from DB
    res.json({ success: true, data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } });
});
router.get('/events/:id', auth_1.requireAdmin, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (req, res) => {
    // TODO: Fetch from DB
    res.json({ success: true, data: { id: req.params.id } });
});
router.put('/events/:id', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validateQuery)(common_schema_1.IdParamSchema), (0, validate_1.validate)(webhooks_schema_1.WebhookEventUpdateSchema), (req, res) => {
    // TODO: Update status in DB
    res.json({ success: true, data: { id: req.params.id, ...req.body } });
});
exports.default = router;
//# sourceMappingURL=webhooks.routes.js.map