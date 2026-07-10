import { describe, expect, it } from 'vitest';
import {
  announcementQuickReply,
  blockedDateQuickReply,
  bookingFlexMessage,
  bookingMenuQuickReply,
  bookingMoreQuickReply,
  bookingQuickReplyItems,
  bookingStatusActions,
  datePickerQuickReply,
  normalizePhoneForTelUri,
  parseLinePostback,
  roomQuickReply,
} from '../src/lib/line-ui';

const baseBooking = {
  id: 128,
  status: 'pending',
  source: 'website',
  room: '雙人房 (double)',
  checkIn: '2026-07-01',
  checkOut: '2026-07-03',
  guestName: '王小明',
  guestCount: 2,
  guestPhone: '0920-900-793',
  guestLineId: '@guest-line',
  totalPrice: 7200,
  notes: '晚到',
  adminUrl: 'https://admin.8688bnb.com/bookings?booking=128',
};

describe('LINE postback validation', () => {
  it('accepts compact v1 postbacks and rejects malformed payloads', () => {
    expect(parseLinePostback('v=1&a=dashboard')).toMatchObject({ ok: true, action: 'dashboard' });
    expect(parseLinePostback('v=2&a=dashboard')).toMatchObject({ ok: false });
    expect(parseLinePostback('v=1&a=../../secret')).toMatchObject({ ok: false });
    expect(parseLinePostback('x'.repeat(301))).toMatchObject({ ok: false });
  });
});

describe('booking action visibility', () => {
  it('returns actions valid for each booking state', () => {
    expect(bookingStatusActions('pending')).toEqual(['confirm_booking', 'cancel_booking']);
    expect(bookingStatusActions('confirmed')).toEqual(['check_in', 'modify_booking', 'cancel_booking']);
    expect(bookingStatusActions('checked_in')).toEqual(['check_out']);
    expect(bookingStatusActions('checked_out')).toEqual([]);
    expect(bookingStatusActions('cancelled')).toEqual([]);
  });
});

describe('guest contact actions', () => {
  it('normalizes valid phone numbers and rejects unsafe values for tel URIs', () => {
    expect(normalizePhoneForTelUri('0920-900-793')).toBe('0920900793');
    expect(normalizePhoneForTelUri('+886 920 900 793')).toBe('+886920900793');
    expect(normalizePhoneForTelUri('tel:0920900793')).toBeNull();
    expect(normalizePhoneForTelUri('0920abc793')).toBeNull();
  });

  it('includes copy-phone, copy-summary, and real LINE ID copy actions', () => {
    const actions = bookingQuickReplyItems(baseBooking).map((item) => item.action);
    expect(actions).toContainEqual(expect.objectContaining({ type: 'clipboard', label: '複製電話', clipboardText: '0920-900-793' }));
    expect(actions).toContainEqual(expect.objectContaining({ type: 'clipboard', label: '複製 LINE ID', clipboardText: '@guest-line' }));
    expect(actions).toContainEqual(expect.objectContaining({ type: 'clipboard', label: '複製訂房摘要' }));
  });

  it('hides LINE ID copy when the booking has no guest-facing LINE ID', () => {
    const actions = bookingQuickReplyItems({ ...baseBooking, guestLineId: null }).map((item) => item.action.label);
    expect(actions).not.toContain('複製 LINE ID');
  });
});

describe('booking Flex message', () => {
  it('uses valid primary actions for pending bookings', () => {
    const message = bookingFlexMessage(baseBooking);
    const labels = message.contents.footer.contents.map((item: any) => item.action.label);
    expect(labels).toContain('查看詳情');
    expect(labels).toContain('確認訂房');
    expect(labels).toContain('撥打電話');
    expect(labels).toContain('更多操作');
    expect(JSON.stringify(message)).toContain('tel:0920900793');
  });

  it('does not show confirm action for cancelled bookings', () => {
    const message = bookingFlexMessage({ ...baseBooking, status: 'cancelled' });
    const labels = message.contents.footer.contents.map((item: any) => item.action.label);
    expect(labels).not.toContain('確認訂房');
  });
});

describe('contextual quick replies and date pickers', () => {
  it('builds scoped quick replies without attaching unrelated choices', () => {
    expect(bookingMenuQuickReply.items.map((item: any) => item.action.label)).toEqual(['待確認', '未來訂房', '今日入住', '七日內訂房', '開啟後臺', '返回']);
    expect(bookingMenuQuickReply.items.map((item: any) => item.action.type)).toContain('uri');
    expect(announcementQuickReply.items.map((item: any) => item.action.label)).toEqual(['更新公告', '開啟後臺', '返回']);
    expect(blockedDateQuickReply.items.map((item: any) => item.action.label)).toEqual(['查看封鎖', '封鎖單一房型', '封鎖全部房型', '解除封鎖', '返回']);
    expect(roomQuickReply.items.map((item: any) => item.action.label)).toEqual(['平日房價', '週末房價', '假日房價', '房型開關', '返回']);
  });

  it('uses LINE date-picker postback actions for date transitions', () => {
    const quickReply = datePickerQuickReply([{ label: '入住日期', data: 'v=1&a=booking_checkin' }]);
    expect(quickReply.items[0].action).toMatchObject({ type: 'datetimepicker', mode: 'date', data: 'v=1&a=booking_checkin' });
  });
});

describe('guided booking creation postbacks', () => {
  it('uses compact postbacks for room, guest count, and confirmation steps', () => {
    expect(parseLinePostback('v=1&a=booking_room&room=double')).toMatchObject({ ok: true, action: 'booking_room' });
    expect(parseLinePostback('v=1&a=booking_guests&count=2')).toMatchObject({ ok: true, action: 'booking_guests' });
    expect(parseLinePostback('v=1&a=booking_confirm_create')).toMatchObject({ ok: true, action: 'booking_confirm_create' });
    expect(parseLinePostback('v=1&a=booking_cancel_create')).toMatchObject({ ok: true, action: 'booking_cancel_create' });
  });
});


describe('booking more-actions quick replies', () => {
  it('exposes pending booking secondary actions', () => {
    const labels = bookingMoreQuickReply(baseBooking).items.map((item: any) => item.action.label);
    expect(labels).toContain('確認訂房');
    expect(labels).toContain('取消訂房');
    expect(labels).toContain('新增備註');
  });

  it('exposes confirmed booking modify/check-in/cancel actions', () => {
    const labels = bookingMoreQuickReply({ ...baseBooking, status: 'confirmed' }).items.map((item: any) => item.action.label);
    expect(labels).toContain('辦理入住');
    expect(labels).toContain('修改訂房');
    expect(labels).toContain('取消訂房');
  });

  it('exposes check-out only for checked-in bookings and hides mutations for completed bookings', () => {
    expect(bookingMoreQuickReply({ ...baseBooking, status: 'checked_in' }).items.map((item: any) => item.action.label)).toContain('辦理退房');
    const checkedOutLabels = bookingMoreQuickReply({ ...baseBooking, status: 'checked_out' }).items.map((item: any) => item.action.label);
    expect(checkedOutLabels).not.toContain('取消訂房');
    expect(checkedOutLabels).not.toContain('辦理退房');
  });
});
