"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineAdminWebhookRouter = void 0;
const express_1 = __importStar(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("@8688bnb/db");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const config_1 = require("../lib/config");
const notifications_1 = require("../lib/notifications");
const booking_rules_1 = require("../lib/booking-rules");
exports.lineAdminWebhookRouter = (0, express_1.Router)();
const router = (0, express_1.Router)();
exports.lineAdminWebhookRouter.post('/', express_1.default.raw({ type: 'application/json' }), async (req, res, next) => {
    try {
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
        if (!validLineSignature(rawBody, req.header('x-line-signature'))) {
            return res.status(401).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid LINE signature' } });
        }
        const body = rawBody.length ? JSON.parse(rawBody.toString('utf8')) : { events: [] };
        const events = Array.isArray(body.events) ? body.events : [];
        for (const event of events) {
            await handleLineEvent(event);
        }
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
router.post('/admin/binding-codes', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, async (req, res, next) => {
    try {
        const role = req.body?.role === 'owner' ? 'owner' : 'developer';
        const code = generateBindingCode(role);
        const expiresAt = new Date(Date.now() + config_1.config.LINE_BINDING_CODE_TTL_MINUTES * 60 * 1000);
        const binding = await db_1.db.lineBindingCode.create({
            data: {
                codeHash: hashBindingCode(code),
                role,
                expiresAt,
            },
        });
        res.status(201).json({
            success: true,
            data: {
                id: binding.id,
                role: binding.role,
                code,
                expires_at: binding.expiresAt.toISOString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/admin/admins', auth_1.requireAdmin, async (_req, res, next) => {
    try {
        const admins = await db_1.db.lineAdmin.findMany({ orderBy: [{ role: 'asc' }, { boundAt: 'asc' }] });
        res.json({
            success: true,
            data: admins.map((admin) => ({
                id: admin.id,
                line_user_id: admin.lineUserId,
                display_name: admin.displayName,
                role: admin.role,
                active: admin.active,
                valid_line_user_id: (0, notifications_1.isLineUserId)(admin.lineUserId),
                notification_eligible: admin.active && (0, notifications_1.isLineUserId)(admin.lineUserId),
                bound_at: admin.boundAt.toISOString(),
                last_seen_at: admin.lastSeenAt?.toISOString() || null,
            })),
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/admin/notification-deliveries', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const deliveries = await db_1.db.notificationDelivery.findMany({
            where: status ? { status } : undefined,
            include: { event: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json({
            success: true,
            data: deliveries.map((delivery) => ({
                id: delivery.id,
                event_id: delivery.eventId,
                event_type: delivery.event.eventType,
                aggregate_type: delivery.event.aggregateType,
                aggregate_id: delivery.event.aggregateId,
                channel: delivery.channel,
                status: delivery.status,
                attempts: delivery.attempts,
                next_attempt_at: delivery.nextAttemptAt.toISOString(),
                sent_at: delivery.sentAt?.toISOString() || null,
                last_error: delivery.lastError,
                created_at: delivery.createdAt.toISOString(),
            })),
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/admin/notification-deliveries/:id/retry', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: '通知編號無效' } });
        }
        const existing = await db_1.db.notificationDelivery.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '通知配送紀錄不存在' } });
        }
        const delivery = await db_1.db.notificationDelivery.update({
            where: { id },
            data: {
                status: 'retrying',
                nextAttemptAt: new Date(),
                lastError: null,
            },
        });
        (0, notifications_1.kickNotificationWorker)();
        res.json({
            success: true,
            data: {
                id: delivery.id,
                event_id: delivery.eventId,
                channel: delivery.channel,
                status: delivery.status,
                attempts: delivery.attempts,
                next_attempt_at: delivery.nextAttemptAt.toISOString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/admin/audit-logs', auth_1.requireAdmin, async (_req, res, next) => {
    try {
        const logs = await db_1.db.lineAuditLog.findMany({
            include: { lineAdmin: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json({
            success: true,
            data: logs.map((log) => ({
                id: log.id,
                line_admin_id: log.lineAdminId,
                line_user_id: log.lineAdmin.lineUserId,
                role: log.lineAdmin.role,
                action: log.action,
                entity_type: log.entityType,
                entity_id: log.entityId,
                detail: log.detail,
                created_at: log.createdAt.toISOString(),
            })),
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/admin/admins/:id/revoke', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const admin = await db_1.db.lineAdmin.findUnique({ where: { id } });
        if (!admin) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'LINE 管理員不存在' } });
        }
        if (admin.role === 'owner') {
            return res.status(403).json({ success: false, error: { code: 'OWNER_PROTECTED', message: 'Owner access cannot be revoked from this endpoint' } });
        }
        const updated = await db_1.db.lineAdmin.update({ where: { id }, data: { active: false } });
        res.json({ success: true, data: { id: updated.id, active: updated.active } });
    }
    catch (error) {
        next(error);
    }
});
function validLineSignature(rawBody, signature) {
    if (!config_1.config.LINE_CHANNEL_SECRET || !signature)
        return false;
    const expected = crypto_1.default
        .createHmac('sha256', config_1.config.LINE_CHANNEL_SECRET)
        .update(rawBody)
        .digest('base64');
    const actual = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return actual.length === expectedBuffer.length && crypto_1.default.timingSafeEqual(actual, expectedBuffer);
}
async function handleLineEvent(event) {
    if (event.webhookEventId) {
        try {
            await db_1.db.lineWebhookRedelivery.create({
                data: {
                    webhookEventId: event.webhookEventId,
                    sourceType: event.source?.type || null,
                    sourceUserId: event.source?.userId || null,
                    eventType: event.type,
                },
            });
        }
        catch {
            return;
        }
    }
    if (event.source?.type !== 'user' || !event.source.userId)
        return;
    const lineUserId = event.source.userId;
    const admin = await db_1.db.lineAdmin.findUnique({ where: { lineUserId } });
    if (event.type === 'message' && event.message?.type === 'text') {
        const bound = await tryBindLineAdmin(lineUserId, event.message.text || '');
        if (bound) {
            await replyText(event.replyToken, 'LINE 管理員綁定完成。');
            return;
        }
    }
    if (!admin || !admin.active) {
        await replyText(event.replyToken, '無法使用此服務。');
        return;
    }
    await db_1.db.lineAdmin.update({ where: { id: admin.id }, data: { lastSeenAt: new Date() } });
    if (event.type === 'postback') {
        await handlePostback(event, admin.id);
        return;
    }
    if (event.type === 'message' && event.message?.type === 'text') {
        await handleTextCommand(event, admin.id);
    }
}
async function tryBindLineAdmin(lineUserId, text) {
    const trimmed = text.trim();
    if (!trimmed.startsWith('8688-'))
        return false;
    const binding = await db_1.db.lineBindingCode.findUnique({ where: { codeHash: hashBindingCode(trimmed) } });
    if (!binding || !binding.active || binding.usedAt || binding.expiresAt <= new Date())
        return false;
    await db_1.db.$transaction(async (tx) => {
        await tx.lineAdmin.upsert({
            where: { lineUserId },
            update: { role: binding.role, active: true, boundAt: new Date(), lastSeenAt: new Date() },
            create: { lineUserId, role: binding.role, active: true, lastSeenAt: new Date() },
        });
        await tx.lineBindingCode.update({
            where: { id: binding.id },
            data: { active: false, usedAt: new Date(), usedByLineUserId: lineUserId },
        });
    });
    return true;
}
async function recordLineAudit(args) {
    const client = args.tx || db_1.db;
    await client.lineAuditLog.create({
        data: {
            lineAdminId: args.lineAdminId,
            action: args.action,
            entityType: args.entityType,
            entityId: args.entityId ?? null,
            detail: args.detail ?? undefined,
        },
    });
}
function todayDate() {
    return new Date(new Date().toISOString().split('T')[0]);
}
function dateOnly(value) {
    return value.toISOString().split('T')[0];
}
function money(value) {
    return value === null || value === undefined ? '未填寫' : `NT$ ${value.toLocaleString('zh-TW')}`;
}
function roomLabel(room) {
    return room ? `${room.nameZh} (${room.slug})` : '未知房型';
}
async function handleTextCommand(event, actorLineAdminId) {
    const text = (event.message?.text || '').trim();
    const lower = text.toLowerCase();
    if (['儀表板', 'dashboard', '狀態'].includes(lower)) {
        await replyText(event.replyToken, await buildDashboardText());
        return;
    }
    let match = text.match(/^(?:訂單|搜尋)\s+(.+)$/);
    if (match) {
        await replyBookingSearch(event.replyToken, match[1].trim());
        return;
    }
    match = text.match(/^確認\s+(\d+)$/);
    if (match) {
        await mutateBookingStatusFromLine(event.replyToken, Number(match[1]), 'confirmed', actorLineAdminId);
        return;
    }
    match = text.match(/^取消\s+(\d+)$/);
    if (match) {
        await mutateBookingStatusFromLine(event.replyToken, Number(match[1]), 'cancelled', actorLineAdminId);
        return;
    }
    match = text.match(/^入住\s+(\d+)$/);
    if (match) {
        await mutateBookingStatusFromLine(event.replyToken, Number(match[1]), 'checked_in', actorLineAdminId);
        return;
    }
    match = text.match(/^退房\s+(\d+)$/);
    if (match) {
        await mutateBookingStatusFromLine(event.replyToken, Number(match[1]), 'checked_out', actorLineAdminId);
        return;
    }
    match = text.match(/^未入住\s+(\d+)$/);
    if (match) {
        await mutateBookingStatusFromLine(event.replyToken, Number(match[1]), 'no_show', actorLineAdminId);
        return;
    }
    match = text.match(/^備註\s+(\d+)\s+(.+)$/s);
    if (match) {
        await addInternalNoteFromLine(event.replyToken, Number(match[1]), match[2].trim(), actorLineAdminId);
        return;
    }
    match = text.match(/^新增訂房\s+(\S+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+(\d+)\s+(\S+)\s+(\S+)(?:\s+(\d+))?(?:\s+(.+))?$/s);
    if (match) {
        await createBookingFromLine(event.replyToken, {
            roomRef: match[1],
            checkIn: match[2],
            checkOut: match[3],
            guestCount: Number(match[4]),
            guestName: match[5],
            guestPhone: match[6],
            totalPrice: match[7] ? Number(match[7]) : undefined,
            notes: match[8]?.trim(),
            actorLineAdminId,
        });
        return;
    }
    match = text.match(/^修改訂單\s+(\d+)\s+(房型|room|入住|checkin|退房|checkout|人數|guests|金額|price|電話|phone|狀態|status)\s+(.+)$/s);
    if (match) {
        await updateBookingFieldFromLine(event.replyToken, Number(match[1]), match[2], match[3].trim(), actorLineAdminId);
        return;
    }
    if (text === '封鎖列表') {
        await replyText(event.replyToken, await buildBlockedDatesText());
        return;
    }
    match = text.match(/^封鎖\s+(全部|all|\S+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})(?:\s+(.+))?$/s);
    if (match) {
        await createBlockedDateFromLine(event.replyToken, match[1], match[2], match[3], match[4]?.trim() || 'LINE 管理封鎖', actorLineAdminId);
        return;
    }
    match = text.match(/^(?:解除封鎖|移除封鎖)\s+(\d+)$/);
    if (match) {
        await replyConfirmRemoveBlock(event.replyToken, Number(match[1]));
        return;
    }
    if (['房型', '房間', 'rooms'].includes(lower)) {
        await replyText(event.replyToken, await buildRoomsText());
        return;
    }
    match = text.match(/^房況\s+(\S+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})$/);
    if (match) {
        await replyRoomAvailability(event.replyToken, match[1], match[2], match[3]);
        return;
    }
    match = text.match(/^房價\s+(\S+)\s+(weekday|weekend|holiday|平日|週末|假日)\s+(\d+)$/i);
    if (match) {
        await updateRoomPriceFromLine(event.replyToken, match[1], match[2], Number(match[3]), actorLineAdminId);
        return;
    }
    match = text.match(/^房型開關\s+(\S+)\s+(on|off|開|關)$/i);
    if (match) {
        await updateRoomAvailabilityFromLine(event.replyToken, match[1], /^(on|開)$/i.test(match[2]), actorLineAdminId);
        return;
    }
    if (text === '公告') {
        await replyText(event.replyToken, await buildAnnouncementText());
        return;
    }
    match = text.match(/^公告更新\s+([^|]+)\|(.+)$/s);
    if (match) {
        await updateAnnouncementFromLine(event.replyToken, match[1].trim(), match[2].trim(), actorLineAdminId);
        return;
    }
    await replyText(event.replyToken, commandHelpText());
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
        '房型；房況 <房型> <開始> <結束>；房價 <房型> 平日/週末/假日 <金額>；房型開關 <房型> 開/關',
        '公告；公告更新 <標題>|<內容>',
    ].join('\n');
}
async function buildDashboardText() {
    const today = todayDate();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [checkIns, checkOuts, occupied, totalRooms, pending, upcoming] = await Promise.all([
        db_1.db.booking.findMany({ where: { checkIn: today, status: { notIn: ['cancelled', 'no_show'] } }, include: { room: true }, orderBy: { checkIn: 'asc' } }),
        db_1.db.booking.findMany({ where: { checkOut: today, status: { notIn: ['cancelled', 'no_show'] } }, include: { room: true }, orderBy: { checkOut: 'asc' } }),
        db_1.db.booking.count({ where: { checkIn: { lte: today }, checkOut: { gt: today }, status: { in: ['confirmed', 'checked_in'] } } }),
        db_1.db.room.count(),
        db_1.db.booking.findMany({ where: { status: 'pending' }, include: { room: true }, orderBy: { checkIn: 'asc' }, take: 5 }),
        db_1.db.booking.findMany({ where: { checkIn: { gte: today, lte: sevenDaysLater }, status: { notIn: ['cancelled', 'no_show'] } }, include: { room: true }, orderBy: { checkIn: 'asc' }, take: 8 }),
    ]);
    return [
        `今日儀表板 ${dateOnly(today)}`,
        `入住：${checkIns.length} 筆${formatCompactBookings(checkIns)}`,
        `退房：${checkOuts.length} 筆${formatCompactBookings(checkOuts)}`,
        `目前入住：${occupied}/${totalRooms} 間`,
        `待確認：${pending.length} 筆${formatCompactBookings(pending)}`,
        `近期訂房：${upcoming.length} 筆${formatCompactBookings(upcoming)}`,
    ].join('\n');
}
function formatCompactBookings(bookings) {
    if (bookings.length === 0)
        return '';
    return '\n' + bookings.map((booking) => `#${booking.id} ${dateOnly(booking.checkIn)} ${booking.guestName} ${roomLabel(booking.room)}`).join('\n');
}
async function replyBookingSearch(replyToken, query) {
    const numericId = Number(query);
    const bookings = Number.isInteger(numericId) && numericId > 0
        ? await db_1.db.booking.findMany({ where: { id: numericId }, include: { room: true, internalNotes: { orderBy: { createdAt: 'desc' }, take: 3 } } })
        : await db_1.db.booking.findMany({
            where: {
                OR: [
                    { guestName: { contains: query, mode: 'insensitive' } },
                    { guestPhone: { contains: query } },
                ],
            },
            include: { room: true, internalNotes: { orderBy: { createdAt: 'desc' }, take: 1 } },
            orderBy: { checkIn: 'asc' },
            take: 5,
        });
    if (bookings.length === 0) {
        await replyText(replyToken, '找不到符合的訂單。');
        return;
    }
    if (bookings.length === 1) {
        await replyMessages(replyToken, [bookingDetailFlex(bookings[0])]);
        return;
    }
    await replyText(replyToken, bookings.map((booking) => `#${booking.id} ${dateOnly(booking.checkIn)}~${dateOnly(booking.checkOut)} ${booking.guestName} ${booking.guestPhone} ${booking.status}`).join('\n'));
}
function bookingDetailFlex(booking) {
    const rows = [
        ['訂單', `#${booking.id}`],
        ['房型', roomLabel(booking.room)],
        ['日期', `${dateOnly(booking.checkIn)} ~ ${dateOnly(booking.checkOut)}`],
        ['房客', booking.guestName],
        ['電話', booking.guestPhone],
        ['LINE', booking.guestLineId || '未填寫'],
        ['人數', `${booking.guestCount} 人`],
        ['金額', money(booking.totalPrice)],
        ['狀態', booking.status],
        ['來源', booking.source],
        ['備註', booking.notes || '無'],
    ];
    return {
        type: 'flex',
        altText: `訂單 #${booking.id}`,
        contents: {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                    { type: 'text', text: `訂單 #${booking.id}`, weight: 'bold', size: 'lg' },
                    ...rows.map(([label, value]) => ({ type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                            { type: 'text', text: label, color: '#666666', size: 'sm', flex: 2 },
                            { type: 'text', text: value, color: '#111111', size: 'sm', wrap: true, flex: 5 },
                        ] })),
                ],
            },
            footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
                    { type: 'button', style: 'primary', action: { type: 'postback', label: '確認訂房', data: `action=confirm_booking&booking_id=${booking.id}` } },
                    { type: 'button', action: { type: 'postback', label: '辦理入住', data: `action=check_in&booking_id=${booking.id}` } },
                    { type: 'button', action: { type: 'postback', label: '辦理退房', data: `action=check_out&booking_id=${booking.id}` } },
                    { type: 'button', action: { type: 'postback', label: '標記未入住', data: `action=no_show&booking_id=${booking.id}` } },
                    { type: 'button', style: 'secondary', action: { type: 'postback', label: '取消訂房', data: `action=cancel_booking&booking_id=${booking.id}` } },
                    { type: 'button', action: { type: 'uri', label: '開啟後台', uri: `${config_1.config.PUBLIC_ADMIN_URL.replace(/\/$/, '')}/bookings?booking=${booking.id}` } },
                ] },
        },
    };
}
async function validateBookingStateTransition(booking, status) {
    const today = todayDate();
    if (status === 'checked_in' && booking.status !== 'confirmed')
        return '只有已確認訂單可以辦理入住。';
    if (status === 'checked_in' && (today < booking.checkIn || today >= booking.checkOut))
        return '今日不在此訂單入住區間內，不能辦理入住。';
    if (status === 'checked_out' && booking.status !== 'checked_in')
        return '只有已入住訂單可以辦理退房。';
    if (status === 'no_show' && !['pending', 'confirmed'].includes(booking.status))
        return '只有待確認或已確認訂單可標記未入住。';
    if (status === 'no_show' && today <= booking.checkIn)
        return '入住日尚未過，不能標記未入住。';
    return null;
}
async function mutateBookingStatusFromLine(replyToken, bookingId, status, actorLineAdminId) {
    const existing = await db_1.db.booking.findUnique({ where: { id: bookingId }, include: { room: true } });
    if (!existing) {
        await replyText(replyToken, '找不到此訂單。');
        return;
    }
    const invalid = await validateBookingStateTransition(existing, status);
    if (invalid) {
        await replyText(replyToken, invalid);
        return;
    }
    const eventType = status === 'confirmed' ? 'booking.confirmed' : status === 'cancelled' ? 'booking.cancelled' : 'booking.modified';
    const eventId = await db_1.db.$transaction(async (tx) => {
        const booking = await tx.booking.update({ where: { id: bookingId }, data: { status }, include: { room: true } });
        await tx.bookingNote.create({ data: { bookingId, content: `LINE 管理員 #${actorLineAdminId} 將狀態改為 ${status}` } });
        await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'booking.status_update', entityType: 'booking', entityId: bookingId, detail: { status } });
        return (0, notifications_1.createBookingNotificationEvent)({ tx, booking, eventType, dedupeKey: `${eventType}:${bookingId}:line:${Date.now()}`, source: 'line', actorLineAdminId });
    });
    if (eventId)
        (0, notifications_1.kickNotificationWorker)();
    await replyText(replyToken, `訂單 #${bookingId} 已更新為 ${status}。`);
}
async function addInternalNoteFromLine(replyToken, bookingId, content, actorLineAdminId) {
    const existing = await db_1.db.booking.findUnique({ where: { id: bookingId } });
    if (!existing) {
        await replyText(replyToken, '找不到此訂單。');
        return;
    }
    await db_1.db.$transaction(async (tx) => {
        await tx.bookingNote.create({ data: { bookingId, content: `LINE 管理員 #${actorLineAdminId}：${content}` } });
        await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'booking.note_create', entityType: 'booking', entityId: bookingId, detail: { content } });
    });
    await replyText(replyToken, `已新增訂單 #${bookingId} 內部備註。`);
}
async function findRoomByRef(roomRef, tx = db_1.db) {
    return (0, booking_rules_1.findRoomByRef)(roomRef, tx);
}
async function validateBookingSchedule(args) {
    const validation = await (0, booking_rules_1.validateBookingMutation)({
        client: args.tx,
        bookingId: args.bookingId,
        roomId: args.roomId,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        guestCount: args.guestCount,
    });
    return validation.error?.message || null;
}
async function createBookingFromLine(replyToken, args) {
    const room = await findRoomByRef(args.roomRef);
    if (!room) {
        await replyText(replyToken, '房型不存在。');
        return;
    }
    const checkIn = new Date(args.checkIn);
    const checkOut = new Date(args.checkOut);
    const invalid = await validateBookingSchedule({ roomId: room.id, checkIn, checkOut, guestCount: args.guestCount });
    if (invalid) {
        await replyText(replyToken, invalid);
        return;
    }
    const eventId = await db_1.db.$transaction(async (tx) => {
        const booking = await tx.booking.create({ data: {
                roomId: room.id,
                checkIn,
                checkOut,
                guestName: args.guestName,
                guestPhone: args.guestPhone,
                guestCount: args.guestCount,
                totalPrice: args.totalPrice ?? null,
                notes: args.notes || null,
                status: 'pending',
                source: 'line',
            }, include: { room: true } });
        await tx.bookingNote.create({ data: { bookingId: booking.id, content: `LINE 管理員 #${args.actorLineAdminId} 建立訂單` } });
        await recordLineAudit({ tx, lineAdminId: args.actorLineAdminId, action: 'booking.create', entityType: 'booking', entityId: booking.id, detail: { source: 'line' } });
        return (0, notifications_1.createBookingNotificationEvent)({ tx, booking, eventType: 'booking.created', dedupeKey: `booking.created:${booking.id}`, source: 'line', actorLineAdminId: args.actorLineAdminId });
    });
    if (eventId)
        (0, notifications_1.kickNotificationWorker)();
    await replyText(replyToken, '已建立訂單。系統會寄送 Email 通知，並避免對建立者重複 LINE Push。');
}
async function updateBookingFieldFromLine(replyToken, bookingId, field, value, actorLineAdminId) {
    const existing = await db_1.db.booking.findUnique({ where: { id: bookingId }, include: { room: true } });
    if (!existing) {
        await replyText(replyToken, '找不到此訂單。');
        return;
    }
    const updateData = {};
    if (['房型', 'room'].includes(field)) {
        const room = await findRoomByRef(value);
        if (!room) {
            await replyText(replyToken, '房型不存在。');
            return;
        }
        updateData.roomId = room.id;
    }
    else if (['入住', 'checkin'].includes(field))
        updateData.checkIn = new Date(value);
    else if (['退房', 'checkout'].includes(field))
        updateData.checkOut = new Date(value);
    else if (['人數', 'guests'].includes(field))
        updateData.guestCount = Number(value);
    else if (['金額', 'price'].includes(field))
        updateData.totalPrice = Number(value);
    else if (['電話', 'phone'].includes(field))
        updateData.guestPhone = value;
    else if (['狀態', 'status'].includes(field))
        updateData.status = value;
    else {
        await replyText(replyToken, '不支援的欄位。');
        return;
    }
    const roomId = updateData.roomId || existing.roomId;
    const checkIn = updateData.checkIn || existing.checkIn;
    const checkOut = updateData.checkOut || existing.checkOut;
    const guestCount = updateData.guestCount || existing.guestCount;
    if (updateData.roomId || updateData.checkIn || updateData.checkOut || updateData.guestCount) {
        const invalid = await validateBookingSchedule({ bookingId, roomId, checkIn, checkOut, guestCount });
        if (invalid) {
            await replyText(replyToken, invalid);
            return;
        }
    }
    const eventId = await db_1.db.$transaction(async (tx) => {
        const fresh = await tx.booking.findUnique({ where: { id: bookingId } });
        if (!fresh)
            throw new Error('Booking disappeared during LINE update');
        if (updateData.roomId || updateData.checkIn || updateData.checkOut || updateData.guestCount) {
            const invalid = await validateBookingSchedule({ tx, bookingId, roomId, checkIn, checkOut, guestCount });
            if (invalid)
                throw new Error(invalid);
        }
        const booking = await tx.booking.update({ where: { id: bookingId }, data: updateData, include: { room: true } });
        await tx.bookingNote.create({ data: { bookingId, content: `LINE 管理員 #${actorLineAdminId} 修改 ${field} 為 ${value}` } });
        await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'booking.update', entityType: 'booking', entityId: bookingId, detail: { field, value } });
        return (0, notifications_1.createBookingNotificationEvent)({ tx, booking, eventType: updateData.status === 'confirmed' ? 'booking.confirmed' : updateData.status === 'cancelled' ? 'booking.cancelled' : 'booking.modified', dedupeKey: `booking.modified:${bookingId}:line:${Date.now()}`, source: 'line', actorLineAdminId });
    }).catch(async (error) => {
        await replyText(replyToken, error instanceof Error ? error.message : '更新失敗。');
        return null;
    });
    if (!eventId)
        return;
    (0, notifications_1.kickNotificationWorker)();
    await replyText(replyToken, `訂單 #${bookingId} 已更新。`);
}
async function buildBlockedDatesText() {
    const today = todayDate();
    const blocks = await db_1.db.blockedDate.findMany({ where: { endDate: { gte: today } }, include: { room: true }, orderBy: { startDate: 'asc' }, take: 10 });
    if (blocks.length === 0)
        return '目前沒有未來封鎖日期。';
    return blocks.map((block) => `#${block.id} ${block.room ? roomLabel(block.room) : '全部房型'} ${dateOnly(block.startDate)}~${dateOnly(block.endDate)} ${block.reason}`).join('\n');
}
async function createBlockedDateFromLine(replyToken, roomRef, start, end, reason, actorLineAdminId) {
    if (/^(全部|all)$/i.test(roomRef)) {
        await replyConfirmCreateAllBlock(replyToken, start, end, reason);
        return;
    }
    const room = await findRoomByRef(roomRef);
    if (!room) {
        await replyText(replyToken, '房型不存在。');
        return;
    }
    const block = await db_1.db.$transaction(async (tx) => {
        const created = await tx.blockedDate.create({ data: { roomId: room.id, startDate: new Date(start), endDate: new Date(end), reason: `${reason}（LINE 管理員 #${actorLineAdminId}）` } });
        await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'blocked_date.create', entityType: 'blocked_date', entityId: created.id, detail: { room_id: room.id, start, end } });
        return created;
    });
    await replyText(replyToken, `已封鎖 ${roomLabel(room)}：#${block.id} ${start}~${end}`);
}
async function replyConfirmCreateAllBlock(replyToken, start, end, reason) {
    await replyMessages(replyToken, [{ type: 'template', altText: '確認封鎖全部房型', template: { type: 'confirm', text: `確認封鎖全部房型 ${start}~${end}？`, actions: [
                    { type: 'postback', label: '確認封鎖', data: `action=create_block&room=all&start=${start}&end=${end}&reason=${encodeURIComponent(reason).slice(0, 120)}` },
                    { type: 'message', label: '取消', text: '取消' },
                ] } }]);
}
async function replyConfirmRemoveBlock(replyToken, blockId) {
    const block = await db_1.db.blockedDate.findUnique({ where: { id: blockId }, include: { room: true } });
    if (!block) {
        await replyText(replyToken, '找不到封鎖日期。');
        return;
    }
    await replyMessages(replyToken, [{ type: 'template', altText: '確認解除封鎖', template: { type: 'confirm', text: `確認解除 #${block.id} ${block.room ? roomLabel(block.room) : '全部房型'} ${dateOnly(block.startDate)}~${dateOnly(block.endDate)}？`, actions: [
                    { type: 'postback', label: '確認解除', data: `action=remove_block&block_id=${block.id}` },
                    { type: 'message', label: '取消', text: '取消' },
                ] } }]);
}
async function buildRoomsText() {
    const rooms = await db_1.db.room.findMany({ orderBy: { sortOrder: 'asc' } });
    return rooms.map((room) => `${room.slug}｜${room.nameZh}｜${room.available ? '開放' : '停用'}｜平日 ${money(room.priceWeekday)}｜週末 ${money(room.priceWeekend)}｜假日 ${money(room.priceHoliday)}`).join('\n');
}
async function replyRoomAvailability(replyToken, roomRef, from, to) {
    const room = await findRoomByRef(roomRef);
    if (!room) {
        await replyText(replyToken, '房型不存在。');
        return;
    }
    const checkIn = new Date(from);
    const checkOut = new Date(to);
    const invalid = await validateBookingSchedule({ roomId: room.id, checkIn, checkOut, guestCount: 1 });
    await replyText(replyToken, invalid ? `${roomLabel(room)} 不可預訂：${invalid}` : `${roomLabel(room)} ${from}~${to} 可以預訂。`);
}
async function updateRoomPriceFromLine(replyToken, roomRef, priceType, price, actorLineAdminId) {
    const room = await findRoomByRef(roomRef);
    if (!room) {
        await replyText(replyToken, '房型不存在。');
        return;
    }
    const key = /^(weekday|平日)$/i.test(priceType) ? 'priceWeekday' : /^(weekend|週末)$/i.test(priceType) ? 'priceWeekend' : 'priceHoliday';
    await db_1.db.$transaction(async (tx) => {
        await tx.room.update({ where: { id: room.id }, data: { [key]: price } });
        await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'room.price_update', entityType: 'room', entityId: room.id, detail: { price_type: priceType, price } });
    });
    await replyText(replyToken, `LINE 管理員 #${actorLineAdminId} 已更新 ${roomLabel(room)} ${priceType} 價格為 ${money(price)}。`);
}
async function updateRoomAvailabilityFromLine(replyToken, roomRef, available, actorLineAdminId) {
    const room = await findRoomByRef(roomRef);
    if (!room) {
        await replyText(replyToken, '房型不存在。');
        return;
    }
    await db_1.db.$transaction(async (tx) => {
        await tx.room.update({ where: { id: room.id }, data: { available } });
        await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'room.availability_update', entityType: 'room', entityId: room.id, detail: { available } });
    });
    await replyText(replyToken, `LINE 管理員 #${actorLineAdminId} 已將 ${roomLabel(room)} 設為${available ? '開放' : '停用'}。`);
}
async function getAnnouncement() {
    return db_1.db.news.findFirst({ orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }] });
}
async function buildAnnouncementText() {
    const announcement = await getAnnouncement();
    if (!announcement)
        return '目前沒有網站公告。';
    return `目前公告：\n${announcement.title}\n${announcement.content}\n顯示：${announcement.visible ? '是' : '否'}`;
}
async function updateAnnouncementFromLine(replyToken, title, content, actorLineAdminId) {
    const announcement = await getAnnouncement();
    await db_1.db.$transaction(async (tx) => {
        const updated = announcement
            ? await tx.news.update({ where: { id: announcement.id }, data: { title, content, pinned: true, visible: true, publishedAt: new Date() } })
            : await tx.news.create({ data: { title, content, pinned: true, visible: true, publishedAt: new Date() } });
        await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'announcement.update', entityType: 'news', entityId: updated.id, detail: { title } });
    });
    await replyText(replyToken, `LINE 管理員 #${actorLineAdminId} 已更新網站公告。`);
}
async function handlePostback(event, actorLineAdminId) {
    const params = new URLSearchParams(event.postback?.data || '');
    const action = params.get('action');
    if (action === 'confirm_booking' || action === 'cancel_booking' || action === 'check_in' || action === 'check_out' || action === 'no_show') {
        const bookingId = Number(params.get('booking_id'));
        if (!bookingId) {
            await replyText(event.replyToken, '訂單資料無效。');
            return;
        }
        const status = action === 'confirm_booking' ? 'confirmed' : action === 'cancel_booking' ? 'cancelled' : action === 'check_in' ? 'checked_in' : action === 'check_out' ? 'checked_out' : 'no_show';
        const eventType = action === 'confirm_booking' ? 'booking.confirmed' : action === 'cancel_booking' ? 'booking.cancelled' : 'booking.modified';
        const existing = await db_1.db.booking.findUnique({ where: { id: bookingId } });
        if (!existing) {
            await replyText(event.replyToken, '找不到此訂單。');
            return;
        }
        const invalid = await validateBookingStateTransition(existing, status);
        if (invalid) {
            await replyText(event.replyToken, invalid);
            return;
        }
        const eventId = await db_1.db.$transaction(async (tx) => {
            const booking = await tx.booking.update({
                where: { id: bookingId },
                data: { status },
                include: { room: true },
            });
            await tx.bookingNote.create({
                data: {
                    bookingId,
                    content: `LINE 管理員 #${actorLineAdminId} 將狀態改為 ${status}`,
                },
            });
            await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'booking.status_postback', entityType: 'booking', entityId: bookingId, detail: { status, action } });
            return (0, notifications_1.createBookingNotificationEvent)({
                tx,
                booking,
                eventType,
                dedupeKey: `${eventType}:${bookingId}:${Date.now()}`,
                source: 'line',
                actorLineAdminId,
            });
        });
        if (eventId)
            (0, notifications_1.kickNotificationWorker)();
        await replyText(event.replyToken, `已將訂單 #${bookingId} 更新為 ${status}。`);
        return;
    }
    if (action === 'add_internal_note') {
        const bookingId = Number(params.get('booking_id'));
        if (!bookingId) {
            await replyText(event.replyToken, '訂單資料無效。');
            return;
        }
        await replyText(event.replyToken, `請輸入：備註 ${bookingId} <內容>`);
        return;
    }
    if (action === 'create_block') {
        const start = params.get('start');
        const end = params.get('end');
        const reason = decodeURIComponent(params.get('reason') || 'LINE 管理封鎖');
        if (!start || !end) {
            await replyText(event.replyToken, '封鎖資料無效。');
            return;
        }
        const block = await db_1.db.$transaction(async (tx) => {
            const created = await tx.blockedDate.create({ data: { roomId: null, startDate: new Date(start), endDate: new Date(end), reason: `${reason}（LINE 管理員 #${actorLineAdminId}）` } });
            await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'blocked_date.create_all', entityType: 'blocked_date', entityId: created.id, detail: { start, end } });
            return created;
        });
        await replyText(event.replyToken, `已封鎖全部房型：#${block.id} ${start}~${end}`);
        return;
    }
    if (action === 'remove_block') {
        const blockId = Number(params.get('block_id'));
        const block = await db_1.db.blockedDate.findUnique({ where: { id: blockId } });
        if (!block) {
            await replyText(event.replyToken, '找不到封鎖日期。');
            return;
        }
        await db_1.db.$transaction(async (tx) => {
            await tx.blockedDate.delete({ where: { id: blockId } });
            await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'blocked_date.delete', entityType: 'blocked_date', entityId: blockId });
        });
        await replyText(event.replyToken, `已解除封鎖 #${blockId}。`);
        return;
    }
    await replyText(event.replyToken, '尚未支援此操作。');
}
async function replyMessages(replyToken, messages) {
    if (!replyToken || !config_1.config.LINE_CHANNEL_ACCESS_TOKEN)
        return;
    await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config_1.config.LINE_CHANNEL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replyToken, messages }),
    });
}
async function replyText(replyToken, text) {
    await replyMessages(replyToken, [{ type: 'text', text: text.slice(0, 4500) }]);
}
function generateBindingCode(role) {
    const random = crypto_1.default.randomBytes(5).toString('hex').toUpperCase();
    return `8688-${role.toUpperCase()}-${random}`;
}
function hashBindingCode(code) {
    return crypto_1.default.createHash('sha256').update(code.trim()).digest('hex');
}
exports.default = router;
//# sourceMappingURL=line-admin.routes.js.map