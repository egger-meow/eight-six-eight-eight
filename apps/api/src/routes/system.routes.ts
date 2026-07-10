import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { db } from '@8688bnb/db';
import { redisClient } from '../middleware/rate-limit';

const router = Router();

router.get('/info', requireAdmin, async (req, res, next) => {
  try {
    let dbStatus = 'error';
    try {
      await db.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'error';
    }

    const redisStatus = redisClient.isReady ? 'connected' : 'error';

    const [totalRooms, totalBookings, totalMedia, mediaSizeSum] = await Promise.all([
      db.room.count(),
      db.booking.count(),
      db.media.count(),
      db.media.aggregate({ _sum: { sizeBytes: true } })
    ]);

    const storageUsedBytes = mediaSizeSum._sum.sizeBytes || 0;
    const storageUsedMb = parseFloat((storageUsedBytes / (1024 * 1024)).toFixed(2));

    res.json({
      success: true,
      data: {
        version: '0.1.0',
        node_version: process.version,
        uptime_seconds: Math.floor(process.uptime()),
        database_status: dbStatus,
        redis_status: redisStatus,
        total_rooms: totalRooms,
        total_bookings: totalBookings,
        total_media_files: totalMedia,
        storage_used_mb: storageUsedMb
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
