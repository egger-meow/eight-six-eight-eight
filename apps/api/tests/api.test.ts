import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { db } from '@8688bnb/db';
import { redisClient } from '../src/middleware/rate-limit';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure DB connection is active
    await db.$connect();
  });

  afterAll(async () => {
    // Cleanup connections so vitest can exit cleanly
    await db.$disconnect();
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });

  describe('Health Check - GET /api/v1/health', () => {
    it('should return 200 OK and health status', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.checks).toBeDefined();
    });
  });

  describe('Rooms API - GET /api/v1/rooms', () => {
    it('should successfully fetch the rooms list from the database', async () => {
      const response = await request(app).get('/api/v1/rooms');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 404 for a room that does not exist', async () => {
      const response = await request(app).get('/api/v1/rooms/invalid-slug-123');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Database Direct Check', () => {
    it('should successfully retrieve the admin user seeded in the DB', async () => {
      const admin = await db.user.findUnique({ where: { username: 'yenfeng' } });
      expect(admin).not.toBeNull();
      expect(admin?.username).toBe('yenfeng');
    });
  });
});
