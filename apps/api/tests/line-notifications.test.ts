import { describe, expect, it } from 'vitest';
import { __notificationTest } from '../src/lib/notifications';

const payload = {
  booking_id: 128,
  event_type: 'booking.created' as const,
  source: 'website',
  room: '雙人房',
  room_id: 1,
  check_in: '2026-07-01',
  check_out: '2026-07-03',
  guest_name: '王小明',
  guest_phone: '0920-900-793',
  guest_line_id: 'guest_line',
  guest_count: 2,
  total_price: 7200,
  status: 'pending',
  notes_summary: '晚到',
  admin_url: 'https://admin.8688bnb.com/bookings?booking=128',
};

describe('LINE booking notifications', () => {
  it('uses the improved booking card actions without changing provider delivery code', () => {
    const message = __notificationTest.lineFlexMessage(payload);
    const labels = message.contents.footer.contents.map((item: any) => item.action.label);
    expect(labels).toContain('確認訂房');
    expect(labels).toContain('查看詳情');
    expect(labels).toContain('撥打電話');
    expect(labels).toContain('更多操作');
    expect(message.quickReply.items.map((item: any) => item.action.label)).toContain('複製電話');
    expect(JSON.stringify(message)).toContain('tel:0920900793');
  });

  it('preserves existing booking notification channel policy', () => {
    const baseArgs = { tx: {} as any, booking: { id: 1, source: 'website' }, eventType: 'booking.created' as const, dedupeKey: 'k' };
    expect(__notificationTest.channelsForEvent({ ...baseArgs, source: 'website' })).toEqual(['line', 'email']);
    expect(__notificationTest.channelsForEvent({ ...baseArgs, source: 'line', actorLineAdminId: 1 })).toEqual([]);
    expect(__notificationTest.channelsForEvent({ ...baseArgs, eventType: 'booking.modified' as const, source: 'line', actorLineAdminId: 1 })).toEqual(['line']);
  });
});
