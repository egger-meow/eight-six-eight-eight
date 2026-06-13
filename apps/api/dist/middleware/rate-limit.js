"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicLimiter = exports.generalLimiter = exports.authLimiter = exports.redisClient = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const redis_1 = require("redis");
const config_1 = require("../lib/config");
// Redis Client
exports.redisClient = (0, redis_1.createClient)({ url: config_1.config.REDIS_URL });
exports.redisClient.on('error', (err) => console.error('Redis Client Error', err));
// Connect immediately and save the promise
const redisConnectPromise = exports.redisClient.connect().catch((err) => {
    console.error('Failed to connect to Redis for Rate Limiting:', err);
});
// Common error handler for rate limits
const handler = (req, res) => {
    res.status(429).json({
        success: false,
        error: {
            code: 'RATE_LIMITED',
            message: '請求太頻繁，請稍後再試',
            message_en: 'Too many requests, please try again later'
        }
    });
};
// Auth limit (stricter) - 20 req / 15 min
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
    store: new rate_limit_redis_1.default({
        sendCommand: async (...args) => {
            await redisConnectPromise;
            return exports.redisClient.sendCommand(args);
        },
        prefix: 'rl:auth:'
    })
});
// General limit - 200 req / 15 min
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
    store: new rate_limit_redis_1.default({
        sendCommand: async (...args) => {
            await redisConnectPromise;
            return exports.redisClient.sendCommand(args);
        },
        prefix: 'rl:api:'
    })
});
// Public read limit (looser) - 500 req / 15 min
exports.publicLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
    store: new rate_limit_redis_1.default({
        sendCommand: async (...args) => {
            await redisConnectPromise;
            return exports.redisClient.sendCommand(args);
        },
        prefix: 'rl:pub:'
    })
});
//# sourceMappingURL=rate-limit.js.map