"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./lib/config");
const rate_limit_1 = require("./middleware/rate-limit");
const db_1 = require("@8688bnb/db");
const error_handler_1 = require("./middleware/error-handler");
// Import routers
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const rooms_routes_1 = __importDefault(require("./routes/rooms.routes"));
const bookings_routes_1 = __importDefault(require("./routes/bookings.routes"));
const blocked_dates_routes_1 = __importDefault(require("./routes/blocked-dates.routes"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const pages_routes_1 = __importDefault(require("./routes/pages.routes"));
const news_routes_1 = __importDefault(require("./routes/news.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const webhooks_routes_1 = __importDefault(require("./routes/webhooks.routes"));
const system_routes_1 = __importDefault(require("./routes/system.routes"));
const holiday_periods_routes_1 = __importDefault(require("./routes/holiday-periods.routes"));
const line_admin_routes_1 = __importStar(require("./routes/line-admin.routes"));
const notifications_1 = require("./lib/notifications");
const app = (0, express_1.default)();
if (config_1.config.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.CORS_ORIGIN.split(','),
    credentials: true
}));
app.use('/api/v1/line/admin/webhook', rate_limit_1.generalLimiter, line_admin_routes_1.lineAdminWebhookRouter);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// ── Health Check (No rate limiting needed)
app.get('/api/v1/health', async (req, res) => {
    let dbStatus = 'error';
    try {
        await db_1.db.$queryRaw `SELECT 1`;
        dbStatus = 'ok';
    }
    catch (e) {
        dbStatus = 'error';
    }
    res.json({
        status: dbStatus === 'ok' ? 'ok' : 'error',
        version: '0.1.0',
        uptime_seconds: Math.floor(process.uptime()),
        checks: {
            database: dbStatus,
            redis: rate_limit_1.redisClient.isReady ? 'ok' : 'error'
        }
    });
});
// ── Rate Limiting Application
// Apply stricter auth limits
app.use('/api/v1/auth', rate_limit_1.authLimiter, auth_routes_1.default);
// Apply public limits
app.use('/api/v1/rooms', rate_limit_1.publicLimiter, rooms_routes_1.default);
app.use('/api/v1/pages', rate_limit_1.publicLimiter, pages_routes_1.default);
app.use('/api/v1/news', rate_limit_1.publicLimiter, news_routes_1.default);
app.use('/api/v1/media', rate_limit_1.publicLimiter, media_routes_1.default);
// Apply general API limits
app.use('/api/v1/bookings', rate_limit_1.generalLimiter, bookings_routes_1.default);
app.use('/api/v1/blocked-dates', rate_limit_1.generalLimiter, blocked_dates_routes_1.default);
app.use('/api/v1/dashboard', rate_limit_1.generalLimiter, dashboard_routes_1.default);
app.use('/api/v1/webhooks', rate_limit_1.generalLimiter, webhooks_routes_1.default);
app.use('/api/v1/line', rate_limit_1.generalLimiter, line_admin_routes_1.default);
app.use('/api/v1/system', rate_limit_1.generalLimiter, system_routes_1.default);
app.use('/api/v1/holiday-periods', rate_limit_1.generalLimiter, holiday_periods_routes_1.default);
// Error Handling
app.use(error_handler_1.notFoundHandler);
app.use(error_handler_1.errorHandler);
// Start server
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
if (process.env.NODE_ENV !== 'test') {
    app.listen(config_1.config.API_PORT, HOST, () => {
        console.log(`API Server listening on http://${HOST}:${config_1.config.API_PORT}`);
        console.log(`   Environment: ${config_1.config.NODE_ENV}`);
    });
    void (0, notifications_1.startNotificationWorker)();
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    (0, notifications_1.stopNotificationWorker)();
    await rate_limit_1.redisClient.quit();
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map