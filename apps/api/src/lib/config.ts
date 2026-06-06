import { z } from 'zod';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3333),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().optional(),
  CSRF_SECRET: z.string().optional(),
  ADMIN_DEFAULT_PASSWORD: z.string().min(8).default('8688bnb'),
  WEBHOOK_API_KEY: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  DATABASE_URL: z.string().url().optional(),
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
