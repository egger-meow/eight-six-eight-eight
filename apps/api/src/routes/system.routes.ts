import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/info', requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      version: '0.1.0',
      node_version: process.version,
      uptime_seconds: Math.floor(process.uptime()),
      database_status: 'connected', // TODO: Actual check
      redis_status: 'connected', // TODO: Actual check
      total_rooms: 5,
      total_bookings: 0,
      total_media_files: 0,
      storage_used_mb: 0
    }
  });
});

export default router;
