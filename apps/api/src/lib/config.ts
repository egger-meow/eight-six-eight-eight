import { z } from 'zod';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const booleanEnv = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3333),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().optional(),
  CSRF_SECRET: z.string().optional(),
  ADMIN_DEFAULT_PASSWORD: z.string().min(8).default('8688bnb!'),
  WEBHOOK_API_KEY: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  DATABASE_URL: z.string().url().optional(),
  PUBLIC_ADMIN_URL: z.string().url().default('https://admin.8688bnb.com'),
  LINE_CHANNEL_SECRET: z.string().optional(),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional(),
  LINE_ADMIN_OWNER_USER_IDS: z.string().default(''),
  LINE_ADMIN_DEVELOPER_USER_IDS: z.string().default(''),
  LINE_BINDING_CODE_TTL_MINUTES: z.coerce.number().default(30),
  NOTIFICATION_WORKER_ENABLED: booleanEnv.default(true),
  NOTIFICATION_WORKER_INTERVAL_MS: z.coerce.number().default(15000),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: booleanEnv.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('86.88 B&B <no-reply@8688bnb.com>'),
  BOOKING_NOTIFICATION_EMAILS: z.string().default(''),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.format());
  process.exit(1);
}

export const config = env.data;

/**
 * Helper to securely get JWT or CSRF secrets.
 * Fallbacks: Environment -> Random Generation + Warning
 * NEVER use hardcoded fallback strings.
 */
export function getSecureSecret(name: 'JWT_SECRET' | 'CSRF_SECRET'): string {
  if (config[name]) {
    return config[name]!;
  }
  
  console.warn(`⚠️  WARNING: ${name} is not set in environment. Generating ephemeral secret.`);
  console.warn(`⚠️  This means sessions/tokens will be invalidated upon server restart.`);
  
  const ephemeralSecret = crypto.randomBytes(32).toString('hex');
  
  // Save it back to config to keep it consistent during runtime
  config[name] = ephemeralSecret;
  
  return ephemeralSecret;
}
