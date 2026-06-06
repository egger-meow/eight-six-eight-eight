import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/stats', requireAdmin, (req, res) => {
  // TODO: Calculate stats from DB
  res.json({
    success: true,
    data: {
      today_check_ins: 0,
      today_check_outs: 0,
      current_occupancy: 0,
      total_rooms: 5,
      occupancy_rate: 0,
      upcoming_bookings_7d: 0,
      pending_bookings: 0,
      monthly_revenue: 0,
      unprocessed_webhooks: 0
    }
  });
});

router.get('/recent-bookings', requireAdmin, (req, res) => {
  // TODO: Fetch from DB
  res.json({ success: true, data: [] });
});

router.get('/occupancy', requireAdmin, (req, res) => {
  // TODO: Calculate from DB
  res.json({ success: true, data: [] });
});

export default router;
