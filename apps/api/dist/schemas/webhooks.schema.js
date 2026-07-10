"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookEventUpdateSchema = exports.WebhookIngestSchema = void 0;
const zod_1 = require("zod");
exports.WebhookIngestSchema = zod_1.z.object({
    event_type: zod_1.z.enum(['new_booking', 'modify_booking', 'cancel_booking', 'rate_update', 'inventory_update']),
    platform: zod_1.z.string().max(50),
    external_booking_id: zod_1.z.string().max(100).optional(),
    data: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.WebhookEventUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(['processed', 'ignored', 'failed']),
    error_message: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=webhooks.schema.js.map