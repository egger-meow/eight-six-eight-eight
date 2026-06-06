import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { config } from '../lib/config';

// Redis Client
export const redisClient = createClient({ url: config.REDIS_URL });
redisClient.on('error', (err) => console.error('Redis Client Error', err));
// We connect asynchronously in the main app startup

// Common error handler for rate limits
const handler = (req: any, res: any) => {
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
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:auth:'
  })
});

// General limit - 200 req / 15 min
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:api:'
  })
});

// Public read limit (looser) - 500 req / 15 min
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:pub:'
  })
});
