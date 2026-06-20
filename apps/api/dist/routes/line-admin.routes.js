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
const line_ui_1 = require("../lib/line-ui");
const line_rich_menu_1 = require("../lib/line-rich-menu");
const rate_limit_1 = require("../middleware/rate-limit");
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
        await safeUnlinkRichMenu(updated.lineUserId);
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
    await safeLinkRichMenu(lineUserId);
    return true;
}
async function safeLinkRichMenu(lineUserId) {
    if (!config_1.config.LINE_CHANNEL_ACCESS_TOKEN)
        return;
    try {
        await (0, line_rich_menu_1.linkLineAdminRichMenuToUser)(lineUserId);
    }
    catch (error) {
        console.error('Failed to link LINE rich menu', error instanceof Error ? error.message : String(error));
    }
}
async function safeUnlinkRichMenu(lineUserId) {
    if (!config_1.config.LINE_CHANNEL_ACCESS_TOKEN)
        return;
    try {
        await (0, line_rich_menu_1.unlinkLineAdminRichMenuFromUser)(lineUserId);
    }
    catch (error) {
        console.error('Failed to unlink LINE rich menu', error instanceof Error ? error.message : String(error));
    }
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
    if (['取消', 'cancel'].includes(lower)) {
        await clearLineConversationState(actorLineAdminId);
        await replyText(event.replyToken, '已取消目前操作。');
        return;
    }
    if (await handleConversationText(event.replyToken, actorLineAdminId, text)) {
        return;
    }
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
    match = text.match(/^房價\s+(\S+)\s+(weekday|weekend|holiday|平日|週末|假日|過年)\s+(\d+)$/i);
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
    await replyText(event.replyToken, (0, line_ui_1.commandHelpText)());
}
async function dashboardFlexMessage() {
    const today = todayDate();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [checkIns, checkOuts, occupied, totalRooms, pending, upcoming] = await Promise.all([
        db_1.db.booking.findMany({ where: { checkIn: today, status: { notIn: ['cancelled', 'no_show'] } }, include: { room: true }, orderBy: { checkIn: 'asc' }, take: 3 }),
        db_1.db.booking.findMany({ where: { checkOut: today, status: { notIn: ['cancelled', 'no_show'] } }, include: { room: true }, orderBy: { checkOut: 'asc' }, take: 3 }),
        db_1.db.booking.count({ where: { checkIn: { lte: today }, checkOut: { gt: today }, status: { in: ['confirmed', 'checked_in'] } } }),
        db_1.db.room.count(),
        db_1.db.booking.findMany({ where: { status: 'pending' }, include: { room: true }, orderBy: { checkIn: 'asc' }, take: 3 }),
        db_1.db.booking.findMany({ where: { checkIn: { gte: today, lte: sevenDaysLater }, status: { notIn: ['cancelled', 'no_show'] } }, include: { room: true }, orderBy: { checkIn: 'asc' }, take: 4 }),
    ]);
    const rows = [
        ['今日入住', `${checkIns.length} 筆${formatCompactBookings(checkIns)}`],
        ['今日退房', `${checkOuts.length} 筆${formatCompactBookings(checkOuts)}`],
        ['目前入住', `${occupied}/${totalRooms} 間`],
        ['待確認', `${pending.length} 筆${formatCompactBookings(pending)}`],
        ['七日內', `${upcoming.length} 筆${formatCompactBookings(upcoming)}`],
    ];
    return infoFlexMessage(`今日概況 ${dateOnly(today)}`, rows, line_ui_1.bookingMenuQuickReply);
}
async function roomsFlexMessage() {
    const rooms = await db_1.db.room.findMany({ orderBy: { sortOrder: 'asc' } });
    const rows = rooms.map((room) => [room.nameZh, `${room.available ? '開放' : '停用'}｜平日 ${money(room.priceWeekday)}｜假日 ${money(room.priceWeekend)}｜過年 ${money(room.priceHoliday)}`]);
    return infoFlexMessage('房型價格', rows, line_ui_1.roomQuickReply);
}
async function announcementFlexMessage() {
    const announcement = await getAnnouncement();
    if (!announcement)
        return infoFlexMessage('網站公告', [['狀態', '目前沒有網站公告。']]);
    return infoFlexMessage('網站公告', [
        ['標題', announcement.title],
        ['內容', announcement.content],
        ['顯示', announcement.visible ? '是' : '否'],
    ]);
}
function infoFlexMessage(title, rows, quickReplyValue) {
    return {
        type: 'flex',
        altText: title,
        contents: {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                    { type: 'text', text: title, weight: 'bold', size: 'lg', wrap: true },
                    ...rows.slice(0, 8).map(([label, value]) => ({
                        type: 'box',
                        layout: 'vertical',
                        spacing: 'xs',
                        contents: [
                            { type: 'text', text: label, color: '#666666', size: 'sm', wrap: true },
                            { type: 'text', text: value || '無', color: '#111111', size: 'sm', wrap: true },
                        ],
                    })),
                ],
            },
        },
        ...(quickReplyValue ? { quickReply: quickReplyValue } : {}),
    };
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
    await replyMessages(replyToken, [(0, line_ui_1.bookingCarouselMessage)(bookings.map((booking) => bookingCardInput(booking)))]);
}
async function replyBookingSearchScope(replyToken, scope) {
    const today = todayDate();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const where = scope === 'today_checkin'
        ? { checkIn: today, status: { notIn: ['cancelled', 'no_show'] } }
        : scope === 'next_7_days'
            ? { checkIn: { gte: today, lte: sevenDaysLater }, status: { notIn: ['cancelled', 'no_show'] } }
            : { status: 'pending' };
    const bookings = await db_1.db.booking.findMany({ where, include: { room: true, internalNotes: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { checkIn: 'asc' }, take: 5 });
    if (bookings.length === 0) {
        await replyText(replyToken, '目前沒有符合的訂房。', line_ui_1.bookingMenuQuickReply);
        return;
    }
    await replyMessages(replyToken, [(0, line_ui_1.bookingCarouselMessage)(bookings.map((booking) => bookingCardInput(booking)))]);
}
function bookingDetailFlex(booking, notificationStatus) {
    return (0, line_ui_1.bookingFlexMessage)(bookingCardInput(booking, notificationStatus));
}
function bookingCardInput(booking, notificationStatus) {
    return {
        id: booking.id,
        status: booking.status,
        source: booking.source,
        room: roomLabel(booking.room),
        checkIn: dateOnly(booking.checkIn),
        checkOut: dateOnly(booking.checkOut),
        guestName: booking.guestName,
        guestCount: booking.guestCount,
        guestPhone: booking.guestPhone,
        guestLineId: booking.guestLineId || null,
        totalPrice: booking.totalPrice,
        notes: booking.notes || booking.internalNotes?.[0]?.content || null,
        notificationStatus: notificationStatus || null,
        adminUrl: config_1.config.PUBLIC_ADMIN_URL.replace(/\/$/, '') + '/bookings?booking=' + booking.id,
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
        const freshRoom = await findRoomByRef(args.roomRef, tx);
        if (!freshRoom)
            throw new Error('房型不存在。');
        const txInvalid = await validateBookingSchedule({ tx, roomId: freshRoom.id, checkIn, checkOut, guestCount: args.guestCount });
        if (txInvalid)
            throw new Error(txInvalid);
        const booking = await tx.booking.create({ data: {
                roomId: freshRoom.id,
                checkIn,
                checkOut,
                guestName: args.guestName,
                guestPhone: args.guestPhone,
                guestLineId: args.guestLineId || null,
                guestCount: args.guestCount,
                totalPrice: args.totalPrice ?? null,
                notes: args.notes || null,
                status: 'pending',
                source: 'line',
            }, include: { room: true } });
        await tx.bookingNote.create({ data: { bookingId: booking.id, content: `LINE 管理員 #${args.actorLineAdminId} 建立訂單` } });
        await recordLineAudit({ tx, lineAdminId: args.actorLineAdminId, action: 'booking.create', entityType: 'booking', entityId: booking.id, detail: { source: 'line' } });
        return (0, notifications_1.createBookingNotificationEvent)({ tx, booking, eventType: 'booking.created', dedupeKey: `booking.created:${booking.id}`, source: 'line', actorLineAdminId: args.actorLineAdminId });
    }).catch(async (error) => {
        await replyText(replyToken, error instanceof Error ? error.message : '建立訂房失敗。');
        return null;
    });
    if (!eventId)
        return;
    (0, notifications_1.kickNotificationWorker)();
    await replyText(replyToken, '已建立訂房。');
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
async function validateBlockedDateConflict(args) {
    if (!(args.start instanceof Date) || Number.isNaN(args.start.getTime()) || !(args.end instanceof Date) || Number.isNaN(args.end.getTime())) {
        return '日期格式無效。';
    }
    if (args.start >= args.end)
        return '結束日期必須晚於開始日期。';
    const client = args.tx || db_1.db;
    const conflict = await client.blockedDate.findFirst({
        where: {
            startDate: { lt: args.end },
            endDate: { gt: args.start },
            OR: args.roomId === null
                ? [{ roomId: null }, { roomId: { not: null } }]
                : [{ roomId: null }, { roomId: args.roomId }],
        },
        include: { room: true },
    });
    if (!conflict)
        return null;
    const target = conflict.room ? roomLabel(conflict.room) : '全部房型';
    return `已存在重疊封鎖日期：#${conflict.id} ${target} ${dateOnly(conflict.startDate)}~${dateOnly(conflict.endDate)}`;
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
    const startDate = new Date(start);
    const endDate = new Date(end);
    const conflict = await validateBlockedDateConflict({ roomId: room.id, start: startDate, end: endDate });
    if (conflict) {
        await replyText(replyToken, conflict);
        return;
    }
    const block = await db_1.db.$transaction(async (tx) => {
        const txConflict = await validateBlockedDateConflict({ tx, roomId: room.id, start: startDate, end: endDate });
        if (txConflict)
            throw new Error(txConflict);
        const created = await tx.blockedDate.create({ data: { roomId: room.id, startDate, endDate, reason: `${reason}（LINE 管理員 #${actorLineAdminId}）` } });
        await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'blocked_date.create', entityType: 'blocked_date', entityId: created.id, detail: { room_id: room.id, start, end } });
        return created;
    }).catch(async (error) => {
        await replyText(replyToken, error instanceof Error ? error.message : '封鎖日期失敗。');
        return null;
    });
    if (!block)
        return;
    await replyText(replyToken, `已封鎖指定日期 #${block.id}`);
}
async function replyConfirmCreateAllBlock(replyToken, start, end, reason) {
    await replyMessages(replyToken, [{ type: 'template', altText: '確認封鎖全部房型', template: { type: 'confirm', text: `確認封鎖全部房型 ${start}~${end}？`, actions: [
                    { type: 'postback', label: '確認封鎖', data: line_ui_1.linePostbacks.createBlock(start, end, reason) },
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
                    { type: 'postback', label: '確認解除', data: line_ui_1.linePostbacks.removeBlock(block.id) },
                    { type: 'message', label: '取消', text: '取消' },
                ] } }]);
}
async function buildRoomsText() {
    const rooms = await db_1.db.room.findMany({ orderBy: { sortOrder: 'asc' } });
    return rooms.map((room) => `${room.slug}｜${room.nameZh}｜${room.available ? '開放' : '停用'}｜平日 ${money(room.priceWeekday)}｜假日 ${money(room.priceWeekend)}｜過年 ${money(room.priceHoliday)}`).join('\n');
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
    const key = /^(weekday|平日)$/i.test(priceType) ? 'priceWeekday' : /^(weekend|週末|假日)$/i.test(priceType) ? 'priceWeekend' : 'priceHoliday';
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
async function handleConversationText(replyToken, actorLineAdminId, text) {
    const state = await getLineConversationState(actorLineAdminId);
    if (!state || state.flow !== 'booking_create' || state.step !== 'guest_details')
        return false;
    const details = parseBookingGuestDetails(text);
    if (!details) {
        await replyText(replyToken, '請輸入：姓名 電話 [LINE ID] [備註]。例如：王小明 0920900793 guest_line 晚到');
        return true;
    }
    const nextState = { ...state, ...details, step: 'confirm' };
    await setLineConversationState(actorLineAdminId, nextState);
    await replyBookingCreatePreview(replyToken, nextState);
    return true;
}
function parseBookingGuestDetails(text) {
    const parts = text.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2)
        return null;
    const [guestName, guestPhone, maybeLineId, ...noteParts] = parts;
    if (!guestName || !guestPhone)
        return null;
    const guestLineId = maybeLineId && !/^[-–—]$/.test(maybeLineId) ? maybeLineId : null;
    return {
        guestName,
        guestPhone,
        guestLineId,
        notes: noteParts.join(' ') || null,
    };
}
async function replyBookingRoomChoices(replyToken, actorLineAdminId, state) {
    const rooms = await db_1.db.room.findMany({ where: { available: true }, orderBy: { sortOrder: 'asc' }, take: 10 });
    if (rooms.length === 0) {
        await clearLineConversationState(actorLineAdminId);
        await replyText(replyToken, '目前沒有開放中的房型。');
        return;
    }
    await replyText(replyToken, '請選擇房型。', (0, line_ui_1.postbackQuickReply)(rooms.map((room) => ({ label: room.nameZh.slice(0, 20), data: line_ui_1.linePostbacks.bookingRoom(room.slug) }))));
}
async function replyGuestCountChoices(replyToken, room) {
    const capacity = Math.max(1, Math.min(Number(room.capacity) || 1, 10));
    const labels = Array.from({ length: capacity }, (_, index) => {
        const count = index + 1;
        return { label: `${count} 人`, data: line_ui_1.linePostbacks.bookingGuests(count) };
    });
    await replyText(replyToken, '請選擇入住人數。', (0, line_ui_1.postbackQuickReply)(labels));
}
async function replyBookingCreatePreview(replyToken, state) {
    const room = state.roomRef ? await findRoomByRef(state.roomRef) : null;
    const roomText = room ? roomLabel(room) : state.roomRef || '未選擇';
    const summary = [
        '請確認新增訂房：',
        `房型：${roomText}`,
        `日期：${state.checkIn} ~ ${state.checkOut}`,
        `人數：${state.guestCount || 0} 人`,
        `房客：${state.guestName}`,
        `電話：${state.guestPhone}`,
        state.guestLineId ? `LINE ID：${state.guestLineId}` : null,
        state.notes ? `備註：${state.notes}` : null,
    ].filter(Boolean).join('\n');
    await replyMessages(replyToken, [{ type: 'template', altText: '確認新增訂房', template: { type: 'confirm', text: summary.slice(0, 240), actions: [
                    { type: 'postback', label: '確認建立', data: line_ui_1.linePostbacks.bookingConfirmCreate },
                    { type: 'postback', label: '取消', data: line_ui_1.linePostbacks.bookingCancelCreate },
                ] } }]);
}
async function createBookingFromConversation(replyToken, actorLineAdminId, state) {
    if (!state.roomRef || !state.checkIn || !state.checkOut || !state.guestCount || !state.guestName || !state.guestPhone) {
        await replyText(replyToken, '訂房資料不完整，請重新新增訂房。');
        return;
    }
    await createBookingFromLine(replyToken, {
        roomRef: state.roomRef,
        checkIn: state.checkIn,
        checkOut: state.checkOut,
        guestCount: state.guestCount,
        guestName: state.guestName,
        guestPhone: state.guestPhone,
        guestLineId: state.guestLineId || null,
        notes: state.notes || undefined,
        actorLineAdminId,
    });
}
async function handlePostback(event, actorLineAdminId) {
    const parsed = normalizedPostback(event.postback?.data);
    if (!parsed) {
        await replyText(event.replyToken, '操作資料無效，請重新點選。');
        return;
    }
    const { action, params } = parsed;
    if (action === 'dashboard') {
        await replyMessages(event.replyToken, [await dashboardFlexMessage()]);
        return;
    }
    if (action === 'booking_menu') {
        await replyText(event.replyToken, '訂房管理', line_ui_1.bookingMenuQuickReply);
        return;
    }
    if (action === 'booking_create') {
        await setLineConversationState(actorLineAdminId, { flow: 'booking_create', step: 'check_in' });
        await replyText(event.replyToken, '請選擇入住日期。', (0, line_ui_1.datePickerQuickReply)([{ label: '入住日期', data: 'v=1&a=booking_checkin' }]));
        return;
    }
    if (action === 'booking_checkin') {
        const selected = event.postback?.params?.date;
        if (!selected) {
            await replyText(event.replyToken, '請重新選擇入住日期。');
            return;
        }
        await setLineConversationState(actorLineAdminId, { flow: 'booking_create', step: 'check_out', checkIn: selected });
        await replyText(event.replyToken, '請選擇退房日期。', (0, line_ui_1.datePickerQuickReply)([{ label: '退房日期', data: 'v=1&a=booking_checkout' }]));
        return;
    }
    if (action === 'booking_checkout') {
        const selected = event.postback?.params?.date;
        if (!selected) {
            await replyText(event.replyToken, '請重新選擇退房日期。');
            return;
        }
        const state = await getLineConversationState(actorLineAdminId);
        if (!state?.checkIn) {
            await replyText(event.replyToken, '訂房流程已逾時，請重新新增訂房。');
            return;
        }
        const nextState = { ...state, flow: 'booking_create', step: 'room', checkOut: selected };
        await setLineConversationState(actorLineAdminId, nextState);
        await replyBookingRoomChoices(event.replyToken, actorLineAdminId, nextState);
        return;
    }
    if (action === 'booking_room') {
        const roomRef = params.get('room');
        const state = await getLineConversationState(actorLineAdminId);
        if (!roomRef || !state?.checkIn || !state.checkOut) {
            await replyText(event.replyToken, '訂房流程已逾時，請重新新增訂房。');
            return;
        }
        const room = await findRoomByRef(roomRef);
        if (!room) {
            await replyText(event.replyToken, '房型不存在，請重新選擇。');
            await replyBookingRoomChoices(event.replyToken, actorLineAdminId, state);
            return;
        }
        const invalid = await validateBookingSchedule({ roomId: room.id, checkIn: new Date(state.checkIn), checkOut: new Date(state.checkOut), guestCount: 1 });
        if (invalid) {
            await replyText(event.replyToken, invalid);
            await replyBookingRoomChoices(event.replyToken, actorLineAdminId, state);
            return;
        }
        await setLineConversationState(actorLineAdminId, { ...state, step: 'guest_count', roomRef, roomId: room.id });
        await replyGuestCountChoices(event.replyToken, room);
        return;
    }
    if (action === 'booking_guests') {
        const guestCount = Number(params.get('count'));
        const state = await getLineConversationState(actorLineAdminId);
        if (!Number.isInteger(guestCount) || guestCount <= 0 || !state?.roomRef || !state.checkIn || !state.checkOut) {
            await replyText(event.replyToken, '訂房流程已逾時，請重新新增訂房。');
            return;
        }
        const room = await findRoomByRef(state.roomRef);
        if (!room) {
            await replyText(event.replyToken, '房型不存在，請重新新增訂房。');
            return;
        }
        const invalid = await validateBookingSchedule({ roomId: room.id, checkIn: new Date(state.checkIn), checkOut: new Date(state.checkOut), guestCount });
        if (invalid) {
            await replyText(event.replyToken, invalid);
            await replyGuestCountChoices(event.replyToken, room);
            return;
        }
        await setLineConversationState(actorLineAdminId, { ...state, step: 'guest_details', guestCount });
        await replyText(event.replyToken, '請輸入房客資料：姓名 電話 [LINE ID] [備註]。例如：王小明 0920900793 guest_line 晚到');
        return;
    }
    if (action === 'booking_confirm_create') {
        const state = await getLineConversationState(actorLineAdminId);
        if (!state || state.flow !== 'booking_create' || state.step !== 'confirm') {
            await replyText(event.replyToken, '訂房流程已逾時，請重新新增訂房。');
            return;
        }
        await createBookingFromConversation(event.replyToken, actorLineAdminId, state);
        await clearLineConversationState(actorLineAdminId);
        return;
    }
    if (action === 'booking_cancel_create') {
        await clearLineConversationState(actorLineAdminId);
        await replyText(event.replyToken, '已取消新增訂房。');
        return;
    }
    if (action === 'booking_search') {
        await replyBookingSearchScope(event.replyToken, params.get('scope') || 'pending');
        return;
    }
    if (action === 'blocked_menu') {
        await replyText(event.replyToken, '封鎖日期管理', line_ui_1.blockedDateQuickReply);
        return;
    }
    if (action === 'block_room_start' || action === 'block_all_start') {
        await setLineConversationState(actorLineAdminId, { flow: action, step: 'start' });
        await replyText(event.replyToken, '請選擇封鎖開始日期。', (0, line_ui_1.datePickerQuickReply)([{ label: '開始日期', data: 'v=1&a=blocked_start' }]));
        return;
    }
    if (action === 'blocked_start') {
        const selected = event.postback?.params?.date;
        if (!selected) {
            await replyText(event.replyToken, '請重新選擇開始日期。');
            return;
        }
        const state = await getLineConversationState(actorLineAdminId);
        await setLineConversationState(actorLineAdminId, { ...(state || {}), step: 'end', start: selected });
        await replyText(event.replyToken, '請選擇封鎖結束日期。', (0, line_ui_1.datePickerQuickReply)([{ label: '結束日期', data: 'v=1&a=blocked_end' }]));
        return;
    }
    if (action === 'blocked_end') {
        const selected = event.postback?.params?.date;
        if (!selected) {
            await replyText(event.replyToken, '請重新選擇結束日期。');
            return;
        }
        const state = await getLineConversationState(actorLineAdminId);
        if (state?.flow === 'block_all_start' && state.start) {
            await replyConfirmCreateAllBlock(event.replyToken, state.start, selected, 'LINE 管理封鎖');
            return;
        }
        await replyText(event.replyToken, '日期已選擇。請用文字補齊：封鎖 <房型slug或ID> ' + (state?.start || '<開始>') + ' ' + selected + ' [原因]');
        return;
    }
    if (action === 'room_menu') {
        await replyMessages(event.replyToken, [await roomsFlexMessage()]);
        return;
    }
    if (action === 'announcement') {
        await replyMessages(event.replyToken, [await announcementFlexMessage()]);
        return;
    }
    if (action === 'booking_more') {
        const bookingId = Number(params.get('bid') || params.get('booking_id'));
        if (!bookingId) {
            await replyText(event.replyToken, '訂單資料無效。');
            return;
        }
        const booking = await db_1.db.booking.findUnique({ where: { id: bookingId }, include: { room: true, internalNotes: { orderBy: { createdAt: 'desc' }, take: 1 } } });
        if (!booking) {
            await replyText(event.replyToken, '找不到此訂單。');
            return;
        }
        await replyText(event.replyToken, `訂房 #${booking.id} 更多操作`, (0, line_ui_1.bookingMoreQuickReply)(bookingCardInput(booking)));
        return;
    }
    if (action === 'confirm_booking' || action === 'cancel_booking' || action === 'check_in' || action === 'check_out' || action === 'no_show') {
        const bookingId = Number(params.get('bid') || params.get('booking_id'));
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
        await replyText(event.replyToken, status === 'confirmed' ? `已確認訂房 #${bookingId}` : status === 'cancelled' ? `已取消訂房 #${bookingId}` : `訂房 #${bookingId} 已更新為 ${status}`);
        return;
    }
    if (action === 'add_internal_note') {
        const bookingId = Number(params.get('bid') || params.get('booking_id'));
        if (!bookingId) {
            await replyText(event.replyToken, '訂單資料無效。');
            return;
        }
        await replyText(event.replyToken, `請輸入：備註 ${bookingId} <內容>`);
        return;
    }
    if (action === 'modify_booking') {
        const bookingId = Number(params.get('bid') || params.get('booking_id'));
        await replyText(event.replyToken, bookingId ? `請輸入：修改訂單 ${bookingId} 房型/入住/退房/人數/金額/電話/狀態 <值>` : '訂單資料無效。');
        return;
    }
    if (action === 'create_block') {
        const start = params.get('start');
        const end = params.get('end');
        const reason = params.get('reason') || 'LINE 管理封鎖';
        if (!start || !end) {
            await replyText(event.replyToken, '封鎖資料無效。');
            return;
        }
        const startDate = new Date(start);
        const endDate = new Date(end);
        const conflict = await validateBlockedDateConflict({ roomId: null, start: startDate, end: endDate });
        if (conflict) {
            await replyText(event.replyToken, conflict);
            return;
        }
        const block = await db_1.db.$transaction(async (tx) => {
            const txConflict = await validateBlockedDateConflict({ tx, roomId: null, start: startDate, end: endDate });
            if (txConflict)
                throw new Error(txConflict);
            const created = await tx.blockedDate.create({ data: { roomId: null, startDate, endDate, reason: `${reason}（LINE 管理員 #${actorLineAdminId}）` } });
            await recordLineAudit({ tx, lineAdminId: actorLineAdminId, action: 'blocked_date.create_all', entityType: 'blocked_date', entityId: created.id, detail: { start, end } });
            return created;
        }).catch(async (error) => {
            await replyText(event.replyToken, error instanceof Error ? error.message : '封鎖日期失敗。');
            return null;
        });
        if (!block)
            return;
        await replyText(event.replyToken, `已封鎖指定日期 #${block.id}`);
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
function normalizedPostback(data) {
    const parsed = (0, line_ui_1.parseLinePostback)(data);
    if (parsed.ok)
        return { action: parsed.action, params: parsed.params };
    const legacy = new URLSearchParams(data || '');
    const legacyAction = legacy.get('action');
    if (legacyAction && /^[a-z][a-z0-9_]{1,40}$/.test(legacyAction))
        return { action: legacyAction, params: legacy };
    return null;
}
async function setLineConversationState(actorLineAdminId, state) {
    if (!rate_limit_1.redisClient.isOpen)
        return;
    await rate_limit_1.redisClient.setEx(`line:conversation:${actorLineAdminId}`, 15 * 60, JSON.stringify(state));
}
async function getLineConversationState(actorLineAdminId) {
    if (!rate_limit_1.redisClient.isOpen)
        return null;
    const value = await rate_limit_1.redisClient.get(`line:conversation:${actorLineAdminId}`);
    if (!value)
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
async function clearLineConversationState(actorLineAdminId) {
    if (!rate_limit_1.redisClient.isOpen)
        return;
    await rate_limit_1.redisClient.del(`line:conversation:${actorLineAdminId}`);
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
async function replyText(replyToken, text, quickReplyValue) {
    await replyMessages(replyToken, [(0, line_ui_1.textMessage)(text, quickReplyValue)]);
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