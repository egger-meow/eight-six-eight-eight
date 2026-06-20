"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomQuickReply = exports.blockedDateQuickReply = exports.bookingMenuQuickReply = exports.linePostbacks = void 0;
exports.parseLinePostback = parseLinePostback;
exports.normalizePhoneForTelUri = normalizePhoneForTelUri;
exports.bookingSummaryText = bookingSummaryText;
exports.bookingStatusActions = bookingStatusActions;
exports.bookingMoreQuickReply = bookingMoreQuickReply;
exports.bookingQuickReplyItems = bookingQuickReplyItems;
exports.quickReply = quickReply;
exports.postbackQuickReply = postbackQuickReply;
exports.datePickerAction = datePickerAction;
exports.datePickerQuickReply = datePickerQuickReply;
exports.bookingFlexMessage = bookingFlexMessage;
exports.bookingCarouselMessage = bookingCarouselMessage;
exports.commandHelpText = commandHelpText;
exports.textMessage = textMessage;
const config_1 = require("./config");
const postbackActionPattern = /^[a-z][a-z0-9_]{1,40}$/;
exports.linePostbacks = {
    dashboard: 'v=1&a=dashboard',
    bookingMenu: 'v=1&a=booking_menu',
    bookingCreate: 'v=1&a=booking_create',
    blockedMenu: 'v=1&a=blocked_menu',
    roomMenu: 'v=1&a=room_menu',
    announcement: 'v=1&a=announcement',
    bookingSearch: (scope) => `v=1&a=booking_search&scope=${encodeURIComponent(scope)}`,
    bookingAction: (action, bookingId) => `v=1&a=${encodeURIComponent(action)}&bid=${bookingId}`,
    bookingMore: (bookingId) => `v=1&a=booking_more&bid=${bookingId}`,
    bookingRoom: (roomRef) => `v=1&a=booking_room&room=${encodeURIComponent(roomRef)}`,
    bookingGuests: (guestCount) => `v=1&a=booking_guests&count=${guestCount}`,
    bookingConfirmCreate: 'v=1&a=booking_confirm_create',
    bookingCancelCreate: 'v=1&a=booking_cancel_create',
    addNote: (bookingId) => `v=1&a=add_internal_note&bid=${bookingId}`,
    modifyBooking: (bookingId) => `v=1&a=modify_booking&bid=${bookingId}`,
    blockFlow: (action) => `v=1&a=${encodeURIComponent(action)}`,
    createBlock: (start, end, reason) => `v=1&a=create_block&room=all&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&reason=${encodeURIComponent(reason).slice(0, 120)}`,
    removeBlock: (blockId) => `v=1&a=remove_block&block_id=${blockId}`,
};
function parseLinePostback(data) {
    if (!data || data.length > 300)
        return { ok: false, reason: 'invalid_length' };
    const params = new URLSearchParams(data);
    if (params.get('v') !== '1')
        return { ok: false, reason: 'unsupported_version' };
    const action = params.get('a');
    if (!action || !postbackActionPattern.test(action))
        return { ok: false, reason: 'invalid_action' };
    return { ok: true, version: 1, action, params };
}
function normalizePhoneForTelUri(phone) {
    if (!phone)
        return null;
    const trimmed = phone.trim();
    if (!trimmed || /[A-Za-z]/.test(trimmed))
        return null;
    let normalized = trimmed.replace(/[()\s.-]/g, '');
    if (normalized.startsWith('00'))
        normalized = `+${normalized.slice(2)}`;
    if (!/^\+?\d{7,15}$/.test(normalized))
        return null;
    return normalized;
}
function bookingSummaryText(booking) {
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
function bookingStatusActions(status) {
    if (status === 'pending')
        return ['confirm_booking', 'cancel_booking'];
    if (status === 'confirmed')
        return ['check_in', 'modify_booking', 'cancel_booking'];
    if (status === 'checked_in')
        return ['check_out'];
    return [];
}
function bookingMoreQuickReply(booking) {
    const items = bookingQuickReplyItems(booking);
    const statusActions = bookingStatusActions(booking.status);
    const actionLabels = {
        confirm_booking: '確認訂房',
        cancel_booking: '取消訂房',
        check_in: '辦理入住',
        check_out: '辦理退房',
        modify_booking: '修改訂房',
    };
    for (const action of statusActions) {
        const label = actionLabels[action];
        if (!label)
            continue;
        const data = action === 'modify_booking' ? exports.linePostbacks.modifyBooking(booking.id) : exports.linePostbacks.bookingAction(action, booking.id);
        items.push({ type: 'action', action: { type: 'postback', label, data } });
    }
    return { items: items.slice(0, 13) };
}
function bookingQuickReplyItems(booking) {
    const items = [];
    if (normalizePhoneForTelUri(booking.guestPhone)) {
        items.push({ type: 'action', action: { type: 'clipboard', label: '複製電話', clipboardText: booking.guestPhone } });
    }
    if (booking.guestLineId?.trim()) {
        items.push({ type: 'action', action: { type: 'clipboard', label: '複製 LINE ID', clipboardText: booking.guestLineId.trim() } });
    }
    items.push({ type: 'action', action: { type: 'clipboard', label: '複製訂房摘要', clipboardText: bookingSummaryText(booking) } }, { type: 'action', action: { type: 'postback', label: '新增備註', data: exports.linePostbacks.addNote(booking.id) } }, { type: 'action', action: { type: 'uri', label: '開啟完整後台', uri: booking.adminUrl || bookingAdminUrl(booking.id) } });
    return items;
}
function quickReply(labels) {
    return {
        items: labels.map((item) => ({
            type: 'action',
            action: item.data
                ? { type: 'postback', label: item.label, data: item.data }
                : { type: 'message', label: item.label, text: item.text || item.label },
        })),
    };
}
exports.bookingMenuQuickReply = quickReply([
    { label: '待確認', data: exports.linePostbacks.bookingSearch('pending') },
    { label: '今日入住', data: exports.linePostbacks.bookingSearch('today_checkin') },
    { label: '七日內訂房', data: exports.linePostbacks.bookingSearch('next_7_days') },
    { label: '搜尋訂房', text: '訂單 ' },
    { label: '返回', data: exports.linePostbacks.dashboard },
]);
exports.blockedDateQuickReply = quickReply([
    { label: '查看封鎖', text: '封鎖列表' },
    { label: '封鎖單一房型', data: exports.linePostbacks.blockFlow('block_room_start') },
    { label: '封鎖全部房型', data: exports.linePostbacks.blockFlow('block_all_start') },
    { label: '解除封鎖', text: '解除封鎖 ' },
    { label: '返回', data: exports.linePostbacks.dashboard },
]);
exports.roomQuickReply = quickReply([
    { label: '平日房價', text: '房價 ' },
    { label: '週末房價', text: '房價 ' },
    { label: '假日房價', text: '房價 ' },
    { label: '房型開關', text: '房型開關 ' },
    { label: '返回', data: exports.linePostbacks.dashboard },
]);
function postbackQuickReply(labels) {
    return {
        items: labels.map((item) => ({
            type: 'action',
            action: { type: 'postback', label: item.label, data: item.data },
        })),
    };
}
function datePickerAction(label, data, initial) {
    return {
        type: 'datetimepicker',
        label,
        data,
        mode: 'date',
        initial,
    };
}
function datePickerQuickReply(items) {
    return {
        items: items.map((item) => ({
            type: 'action',
            action: datePickerAction(item.label, item.data, item.initial),
        })),
    };
}
function bookingFlexMessage(booking) {
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
    const footer = [
        { type: 'button', action: { type: 'uri', label: '查看詳情', uri: booking.adminUrl || bookingAdminUrl(booking.id) } },
    ];
    if (booking.status === 'pending') {
        footer.unshift({ type: 'button', style: 'primary', action: { type: 'postback', label: '確認訂房', data: exports.linePostbacks.bookingAction('confirm_booking', booking.id) } });
    }
    if (tel) {
        footer.push({ type: 'button', action: { type: 'uri', label: '撥打電話', uri: `tel:${tel}` } });
    }
    footer.push({ type: 'button', action: { type: 'postback', label: '更多操作', data: exports.linePostbacks.bookingMore(booking.id) } });
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
function bookingCarouselMessage(bookings) {
    return {
        type: 'flex',
        altText: `訂房搜尋結果 ${bookings.length} 筆`,
        contents: {
            type: 'carousel',
            contents: bookings.slice(0, 5).map((booking) => bookingFlexMessage(booking).contents),
        },
    };
}
function commandHelpText() {
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
function textMessage(text, quickReplyValue) {
    return quickReplyValue
        ? { type: 'text', text: text.slice(0, 4500), quickReply: quickReplyValue }
        : { type: 'text', text: text.slice(0, 4500) };
}
function bookingAdminUrl(bookingId) {
    return `${config_1.config.PUBLIC_ADMIN_URL.replace(/\/$/, '')}/bookings?booking=${bookingId}`;
}
function shortText(value, max) {
    return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}
function formatMoney(value) {
    return value === null ? '未填寫' : `NT$ ${value.toLocaleString('zh-TW')}`;
}
function formatSource(value) {
    const labels = {
        website: '官網',
        line: 'LINE',
        phone: '電話',
        ota: 'OTA',
        walk_in: '現場',
        admin: '後台',
    };
    return labels[value] || value;
}
function formatStatus(value) {
    const labels = {
        pending: '待確認',
        confirmed: '已確認',
        cancelled: '已取消',
        checked_in: '已入住',
        checked_out: '已退房',
        no_show: '未入住',
    };
    return labels[value] || value;
}
function nightsText(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.round((end.getTime() - start.getTime()) / 86400000);
    return Number.isFinite(nights) && nights > 0 ? `（${nights} 晚）` : '';
}
//# sourceMappingURL=line-ui.js.map