import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './lib/config';
import { redisClient, authLimiter, generalLimiter, publicLimiter } from './middleware/rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

// Import routers
import authRouter from './routes/auth.routes';
import roomsRouter from './routes/rooms.routes';
import bookingsRouter from './routes/bookings.routes';
import blockedDatesRouter from './routes/blocked-dates.routes';
import mediaRouter from './routes/media.routes';
import pagesRouter from './routes/pages.routes';
import newsRouter from './routes/news.routes';
import dashboardRouter from './routes/dashboard.routes';
import webhooksRouter from './routes/webhooks.routes';
import systemRouter from './routes/system.routes';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN.split(','),
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to Redis for Rate Limiting
redisClient.connect().then(() => {
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
      redis: redisClient.isReady ? 'ok' : 'error'
    }
  });
});

// ── Rate Limiting Application
// Apply stricter auth limits
app.use('/api/v1/auth', authLimiter, authRouter);

// Apply public limits
app.use('/api/v1/rooms', publicLimiter, roomsRouter);
app.use('/api/v1/pages', publicLimiter, pagesRouter);
app.use('/api/v1/news', publicLimiter, newsRouter);
app.use('/api/v1/media', publicLimiter, mediaRouter);

// Apply general API limits
app.use('/api/v1/bookings', generalLimiter, bookingsRouter);
app.use('/api/v1/blocked-dates', generalLimiter, blockedDatesRouter);
app.use('/api/v1/dashboard', generalLimiter, dashboardRouter);
app.use('/api/v1/webhooks', generalLimiter, webhooksRouter);
app.use('/api/v1/system', generalLimiter, systemRouter);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.API_PORT, '127.0.0.1', () => {
  console.log(`🚀 API Server listening on http://127.0.0.1:${config.API_PORT}`);
  console.log(`   Environment: ${config.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await redisClient.quit();
  process.exit(0);
});
