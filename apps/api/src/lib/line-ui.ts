import { config } from './config';

export type LineMessage = Record<string, any>;

export type BookingCardInput = {
  id: number;
  status: string;
  source: string;
  room: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestCount: number;
  guestPhone: string;
  guestLineId?: string | null;
  totalPrice?: number | null;
  notes?: string | null;
  notificationStatus?: string | null;
  adminUrl?: string;
};

export type ParsedLinePostback =
  | { ok: true; version: 1; action: string; params: URLSearchParams }
  | { ok: false; reason: string };

const postbackActionPattern = /^[a-z][a-z0-9_]{1,40}$/;

export const linePostbacks = {
  dashboard: 'v=1&a=dashboard',
  bookingMenu: 'v=1&a=booking_menu',
  bookingCreate: 'v=1&a=booking_create',
  blockedMenu: 'v=1&a=blocked_menu',
  roomMenu: 'v=1&a=room_menu',
  announcement: 'v=1&a=announcement',
  bookingSearch: (scope: string) => `v=1&a=booking_search&scope=${encodeURIComponent(scope)}`,
  bookingAction: (action: string, bookingId: number) => `v=1&a=${encodeURIComponent(action)}&bid=${bookingId}`,
  bookingMore: (bookingId: number) => `v=1&a=booking_more&bid=${bookingId}`,
  bookingRoom: (roomRef: string) => `v=1&a=booking_room&room=${encodeURIComponent(roomRef)}`,
  bookingGuests: (guestCount: number) => `v=1&a=booking_guests&count=${guestCount}`,
  bookingConfirmCreate: 'v=1&a=booking_confirm_create',
  bookingCancelCreate: 'v=1&a=booking_cancel_create',
  addNote: (bookingId: number) => `v=1&a=add_internal_note&bid=${bookingId}`,
  modifyBooking: (bookingId: number) => `v=1&a=modify_booking&bid=${bookingId}`,
  blockFlow: (action: string) => `v=1&a=${encodeURIComponent(action)}`,
  createBlock: (start: string, end: string, reason: string) => `v=1&a=create_block&room=all&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&reason=${encodeURIComponent(reason).slice(0, 120)}`,
  removeBlock: (blockId: number) => `v=1&a=remove_block&block_id=${blockId}`,
};

export function parseLinePostback(data: string | undefined): ParsedLinePostback {
  if (!data || data.length > 300) return { ok: false, reason: 'invalid_length' };
  const params = new URLSearchParams(data);
  if (params.get('v') !== '1') return { ok: false, reason: 'unsupported_version' };
  const action = params.get('a');
  if (!action || !postbackActionPattern.test(action)) return { ok: false, reason: 'invalid_action' };
  return { ok: true, version: 1, action, params };
}

export function normalizePhoneForTelUri(phone: string | null | undefined) {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed || /[A-Za-z]/.test(trimmed)) return null;
  let normalized = trimmed.replace(/[()\s.-]/g, '');
  if (normalized.startsWith('00')) normalized = `+${normalized.slice(2)}`;
  if (!/^\+?\d{7,15}$/.test(normalized)) return null;
  return normalized;
}

export function bookingSummaryText(booking: BookingCardInput) {
  return [
    `訂房 #${booking.id}`,
    `${booking.room}`,
    `${booking.checkIn} ~ ${booking.checkOut}`,
    `${booking.guestName} / ${booking.guestCount} 人`,
    `電話：${booking.guestPhone}`,
    booking.totalPrice === null || booking.totalPrice === undefined ? null : `金額：${formatMoney(booking.totalPrice)}`,
    booking.notes ? `備註：${shortText(booking.notes, 80)}` : null,
  ].filter(Boolean).join('\n');
}

export function bookingStatusActions(status: string) {
  if (status === 'pending') return ['confirm_booking', 'cancel_booking'];
  if (status === 'confirmed') return ['check_in', 'modify_booking', 'cancel_booking'];
  if (status === 'checked_in') return ['check_out'];
  return [];
}

export function bookingMoreQuickReply(booking: BookingCardInput) {
  const items = bookingQuickReplyItems(booking);
  const statusActions = bookingStatusActions(booking.status);
  const actionLabels: Record<string, string> = {
    confirm_booking: '確認訂房',
    cancel_booking: '取消訂房',
    check_in: '辦理入住',
    check_out: '辦理退房',
    modify_booking: '修改訂房',
  };
  for (const action of statusActions) {
    const label = actionLabels[action];
    if (!label) continue;
    const data = action === 'modify_booking' ? linePostbacks.modifyBooking(booking.id) : linePostbacks.bookingAction(action, booking.id);
    items.push({ type: 'action', action: { type: 'postback', label, data } });
  }
  return { items: items.slice(0, 13) };
}

export function bookingQuickReplyItems(booking: BookingCardInput) {
  const items: any[] = [];
  if (normalizePhoneForTelUri(booking.guestPhone)) {
    items.push({ type: 'action', action: { type: 'clipboard', label: '複製電話', clipboardText: booking.guestPhone } });
  }
  if (booking.guestLineId?.trim()) {
    items.push({ type: 'action', action: { type: 'clipboard', label: '複製 LINE ID', clipboardText: booking.guestLineId.trim() } });
  }
  items.push(
    { type: 'action', action: { type: 'clipboard', label: '複製訂房摘要', clipboardText: bookingSummaryText(booking) } },
    { type: 'action', action: { type: 'postback', label: '新增備註', data: linePostbacks.addNote(booking.id) } },
    { type: 'action', action: { type: 'uri', label: '開啟完整後台', uri: booking.adminUrl || bookingAdminUrl(booking.id) } },
  );
  return items;
}

export function quickReply(labels: Array<{ label: string; data?: string; text?: string }>) {
  return {
    items: labels.map((item) => ({
      type: 'action',
      action: item.data
        ? { type: 'postback', label: item.label, data: item.data }
        : { type: 'message', label: item.label, text: item.text || item.label },
    })),
  };
}

export const bookingMenuQuickReply = quickReply([
  { label: '待確認', data: linePostbacks.bookingSearch('pending') },
  { label: '今日入住', data: linePostbacks.bookingSearch('today_checkin') },
  { label: '七日內訂房', data: linePostbacks.bookingSearch('next_7_days') },
  { label: '搜尋訂房', text: '訂單 ' },
  { label: '返回', data: linePostbacks.dashboard },
]);

export const blockedDateQuickReply = quickReply([
  { label: '查看封鎖', text: '封鎖列表' },
  { label: '封鎖單一房型', data: linePostbacks.blockFlow('block_room_start') },
  { label: '封鎖全部房型', data: linePostbacks.blockFlow('block_all_start') },
  { label: '解除封鎖', text: '解除封鎖 ' },
  { label: '返回', data: linePostbacks.dashboard },
]);

export const roomQuickReply = quickReply([
  { label: '平日房價', text: '房價 ' },
  { label: '週末房價', text: '房價 ' },
  { label: '假日房價', text: '房價 ' },
  { label: '房型開關', text: '房型開關 ' },
  { label: '返回', data: linePostbacks.dashboard },
]);

export function postbackQuickReply(labels: Array<{ label: string; data: string }>) {
  return {
    items: labels.map((item) => ({
      type: 'action',
      action: { type: 'postback', label: item.label, data: item.data },
    })),
  };
}

export function datePickerAction(label: string, data: string, initial?: string) {
  return {
    type: 'datetimepicker',
    label,
    data,
    mode: 'date',
    initial,
  };
}

export function datePickerQuickReply(items: Array<{ label: string; data: string; initial?: string }>) {
  return {
    items: items.map((item) => ({
      type: 'action',
      action: datePickerAction(item.label, item.data, item.initial),
    })),
  };
}

export function bookingFlexMessage(booking: BookingCardInput): LineMessage {
  const tel = normalizePhoneForTelUri(booking.guestPhone);
  const rows = [
    ['狀態', formatStatus(booking.status)],
    ['訂單', `#${booking.id}`],
    ['來源', formatSource(booking.source)],
    ['房型', booking.room],
    ['日期', `${booking.checkIn} ~ ${booking.checkOut}${nightsText(booking.checkIn, booking.checkOut)}`],
    ['房客', booking.guestName],
    ['人數', `${booking.guestCount} 人`],
    ['電話', booking.guestPhone],
    ...(booking.guestLineId?.trim() ? [['LINE ID', booking.guestLineId.trim()]] : []),
    ['金額', formatMoney(booking.totalPrice ?? null)],
    ...(booking.notes ? [['備註', shortText(booking.notes, 90)]] : []),
    ...(booking.notificationStatus ? [['通知', booking.notificationStatus]] : []),
  ];

  const footer: any[] = [
    { type: 'button', action: { type: 'uri', label: '查看詳情', uri: booking.adminUrl || bookingAdminUrl(booking.id) } },
  ];

  if (booking.status === 'pending') {
    footer.unshift({ type: 'button', style: 'primary', action: { type: 'postback', label: '確認訂房', data: linePostbacks.bookingAction('confirm_booking', booking.id) } });
  }
  if (tel) {
    footer.push({ type: 'button', action: { type: 'uri', label: '撥打電話', uri: `tel:${tel}` } });
  }
  footer.push({ type: 'button', action: { type: 'postback', label: '更多操作', data: linePostbacks.bookingMore(booking.id) } });

  return {
    type: 'flex',
    altText: `訂房 #${booking.id} ${formatStatus(booking.status)}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          { type: 'text', text: `訂房 #${booking.id}`, weight: 'bold', size: 'lg' },
          ...rows.map(([label, text]) => ({
            type: 'box',
            layout: 'baseline',
            spacing: 'sm',
            contents: [
              { type: 'text', text: label, color: '#666666', size: 'sm', flex: 2 },
              { type: 'text', text, color: '#111111', size: 'sm', wrap: true, flex: 5 },
            ],
          })),
        ],
      },
      footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: footer.slice(0, 4) },
    },
    quickReply: { items: bookingQuickReplyItems(booking).slice(0, 8) },
  };
}

export function bookingCarouselMessage(bookings: BookingCardInput[]) {
  return {
    type: 'flex',
    altText: `訂房搜尋結果 ${bookings.length} 筆`,
    contents: {
      type: 'carousel',
      contents: bookings.slice(0, 5).map((booking) => bookingFlexMessage(booking).contents),
    },
  };
}

export function commandHelpText() {
  return [
    '可用指令：',
    '儀表板',
    '訂單 <訂單ID/姓名/電話>',
    '確認/取消/入住/退房/未入住 <訂單ID>',
    '備註 <訂單ID> <內容>',
    '新增訂房 <房型slug或ID> <入住> <退房> <人數> <姓名> <電話> [金額] [備註]',
    '修改訂單 <ID> 房型/入住/退房/人數/金額/電話/狀態 <值>',
    '封鎖列表；封鎖 <房型或全部> <開始> <結束> [原因]；解除封鎖 <ID>',
    '房型；房況 <房型> <開始> <結束>；房價 <房型> 平日/假日/過年 <金額>；房型開關 <房型> 開/關',
    '公告；公告更新 <標題>|<內容>',
  ].join('\n');
}

export function textMessage(text: string, quickReplyValue?: any) {
  return quickReplyValue
    ? { type: 'text', text: text.slice(0, 4500), quickReply: quickReplyValue }
    : { type: 'text', text: text.slice(0, 4500) };
}

function bookingAdminUrl(bookingId: number) {
  return `${config.PUBLIC_ADMIN_URL.replace(/\/$/, '')}/bookings?booking=${bookingId}`;
}

function shortText(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function formatMoney(value: number | null) {
  return value === null ? '未填寫' : `NT$ ${value.toLocaleString('zh-TW')}`;
}

function formatSource(value: string) {
  const labels: Record<string, string> = {
    website: '官網',
    line: 'LINE',
    phone: '電話',
    ota: 'OTA',
    walk_in: '現場',
    admin: '後台',
  };
  return labels[value] || value;
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    pending: '待確認',
    confirmed: '已確認',
    cancelled: '已取消',
    checked_in: '已入住',
    checked_out: '已退房',
    no_show: '未入住',
  };
  return labels[value] || value;
}

function nightsText(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Number.isFinite(nights) && nights > 0 ? `（${nights} 晚）` : '';
}
