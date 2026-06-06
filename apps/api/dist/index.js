"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const config_1 = require("./lib/config");
const rate_limit_1 = require("./middleware/rate-limit");
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
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.CORS_ORIGIN.split(','),
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Connect to Redis for Rate Limiting
rate_limit_1.redisClient.connect().then(() => {
    console.log('📦 Redis connected for Rate Limiting');
}).catch(console.error);
// ── Health Check (No rate limiting needed)
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '0.1.0',
        uptime_seconds: Math.floor(process.uptime()),
        checks: {
            database: 'ok', // TODO: real check
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
app.use('/api/v1/system', rate_limit_1.generalLimiter, system_routes_1.default);
// Error Handling
app.use(error_handler_1.notFoundHandler);
app.use(error_handler_1.errorHandler);
// Start server
app.listen(config_1.config.API_PORT, '127.0.0.1', () => {
    console.log(`🚀 API Server listening on http://127.0.0.1:${config_1.config.API_PORT}`);
    console.log(`   Environment: ${config_1.config.NODE_ENV}`);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await rate_limit_1.redisClient.quit();
    process.exit(0);
});
//# sourceMappingURL=index.js.map