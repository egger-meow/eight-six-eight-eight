"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWebhookApiKey = requireWebhookApiKey;
const config_1 = require("../lib/config");
function requireWebhookApiKey(req, res, next) {
    const apiKey = req.headers['x-webhook-key'];
    if (!config_1.config.WEBHOOK_API_KEY) {
        console.warn('Webhook received but WEBHOOK_API_KEY is not configured');
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: '系統尚未設定 Webhook 密鑰',
                message_en: 'Webhook API key not configured on server'
            }
        });
    }
    if (apiKey !== config_1.config.WEBHOOK_API_KEY) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_INVALID_CREDENTIALS',
                message: 'Webhook API key 無效',
                message_en: 'Invalid webhook API key'
            }
        });
    }
    next();
}
//# sourceMappingURL=webhook-auth.js.map