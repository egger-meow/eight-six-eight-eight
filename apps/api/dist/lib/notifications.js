"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__notificationTest = void 0;
exports.isLineUserId = isLineUserId;
exports.createBookingNotificationEvent = createBookingNotificationEvent;
exports.kickNotificationWorker = kickNotificationWorker;
exports.startNotificationWorker = startNotificationWorker;
exports.stopNotificationWorker = stopNotificationWorker;
exports.processDueNotifications = processDueNotifications;
const nodemailer_1 = __importDefault(require("nodemailer"));
const db_1 = require("@8688bnb/db");
const config_1 = require("./config");
const line_ui_1 = require("./line-ui");
let workerTimer = null;
let workerRunning = false;
function dateOnly(value) {
    return value.toISOString().split('T')[0];
}
function isLineUserId(value) {
    return /^U[0-9a-f]{32}$/i.test(value);
}
function parseCsv(value) {
    return (value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
function truncate(value, max = 120) {
    if (!value)
        return null;
    return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}
function formatMoney(value) {
    return value === null ? '未填寫' : `NT$ ${value.toLocaleString('zh-TW')}`;
}
function formatSource(value) {
    const labels = {
        website: '官網',
        line: 'LINE',
        agoda: 'Agoda',
        booking: 'Booking.com',
        direct: '直接訂房',
        admin: '後台',
        ota: 'OTA',
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
function formatEventType(value) {
    const labels = {
        'booking.created': '新訂房',
        'booking.modified': '訂房更新',
        'booking.confirmed': '訂房已確認',
        'booking.cancelled': '訂房已取消',
        'ota.processing_failed': 'OTA 處理失敗',
    };
    return labels[value];
}
function bookingAdminUrl(bookingId) {
    return `${config_1.config.PUBLIC_ADMIN_URL.replace(/\/$/, '')}/bookings?booking=${bookingId}`;
}
function buildBookingPayload(booking, eventType) {
    return {
        booking_id: booking.id,
        event_type: eventType,
        source: booking.source,
        room: booking.room?.nameZh || `房型 #${booking.roomId}`,
        room_id: booking.roomId,
        check_in: dateOnly(booking.checkIn),
        check_out: dateOnly(booking.checkOut),
        guest_name: booking.guestName,
        guest_phone: booking.guestPhone,
        guest_line_id: booking.guestLineId || null,
        guest_count: booking.guestCount,
        total_price: booking.totalPrice,
        status: booking.status,
        notes_summary: truncate(booking.notes),
        admin_url: bookingAdminUrl(booking.id),
    };
}
function channelsForEvent(args) {
    const channels = [];
    if (!(args.eventType === 'booking.created' && args.source === 'line' && args.actorLineAdminId)) {
        channels.push('line');
    }
    if (args.eventType === 'booking.created' && args.source === 'website') {
        channels.push('email');
    }
    return channels;
}
async function createBookingNotificationEvent(args) {
    const channels = channelsForEvent(args);
    const event = await args.tx.notificationEvent.upsert({
        where: { dedupeKey: args.dedupeKey },
        update: {},
        create: {
            eventType: args.eventType,
            aggregateType: 'booking',
            aggregateId: args.booking.id,
            dedupeKey: args.dedupeKey,
            source: args.source || args.booking.source,
            bookingId: args.booking.id,
            actorLineAdminId: args.actorLineAdminId || null,
            payload: buildBookingPayload(args.booking, args.eventType),
            deliveries: {
                create: channels.map((channel) => ({ channel })),
            },
        },
    });
    return event.id;
}
function kickNotificationWorker() {
    if (!config_1.config.NOTIFICATION_WORKER_ENABLED || config_1.config.NODE_ENV === 'test')
        return;
    void processDueNotifications().catch((error) => {
        console.error('Notification worker failed', safeError(error));
    });
}
async function startNotificationWorker() {
    if (!config_1.config.NOTIFICATION_WORKER_ENABLED || config_1.config.NODE_ENV === 'test' || workerTimer)
        return;
    await seedLineAdminsFromEnv();
    await db_1.db.notificationDelivery.updateMany({
        where: { status: 'processing' },
        data: { status: 'retrying', nextAttemptAt: new Date() },
    });
    kickNotificationWorker();
    workerTimer = setInterval(kickNotificationWorker, config_1.config.NOTIFICATION_WORKER_INTERVAL_MS);
}
function stopNotificationWorker() {
    if (workerTimer)
        clearInterval(workerTimer);
    workerTimer = null;
}
async function seedLineAdminsFromEnv() {
    const owners = parseCsv(config_1.config.LINE_ADMIN_OWNER_USER_IDS);
    const developers = parseCsv(config_1.config.LINE_ADMIN_DEVELOPER_USER_IDS);
    for (const lineUserId of owners.filter(isLineUserId)) {
        await db_1.db.lineAdmin.upsert({
            where: { lineUserId },
            update: { role: 'owner', active: true },
            create: { lineUserId, role: 'owner', active: true },
        });
    }
    for (const lineUserId of developers.filter(isLineUserId)) {
        await db_1.db.lineAdmin.upsert({
            where: { lineUserId },
            update: { role: 'developer', active: true },
            create: { lineUserId, role: 'developer', active: true },
        });
    }
}
async function processDueNotifications(limit = 10) {
    if (workerRunning)
        return;
    workerRunning = true;
    try {
        const deliveries = await db_1.db.notificationDelivery.findMany({
            where: {
                status: { in: ['pending', 'retrying'] },
                nextAttemptAt: { lte: new Date() },
            },
            include: { event: true },
            orderBy: { nextAttemptAt: 'asc' },
            take: limit,
        });
        for (const delivery of deliveries) {
            const claimed = await db_1.db.notificationDelivery.updateMany({
                where: { id: delivery.id, status: { in: ['pending', 'retrying'] } },
                data: { status: 'processing' },
            });
            if (claimed.count !== 1)
                continue;
            try {
                const providerMessageId = delivery.channel === 'line'
                    ? await sendLineNotification(delivery.event.payload)
                    : await sendEmailNotification(delivery.event.payload);
                await db_1.db.notificationDelivery.update({
                    where: { id: delivery.id },
                    data: {
                        status: 'sent',
                        attempts: { increment: 1 },
                        sentAt: new Date(),
                        providerMessageId,
                        lastError: null,
                    },
                });
            }
            catch (error) {
                const attempts = delivery.attempts + 1;
                const finalFailure = attempts >= 8;
                await db_1.db.notificationDelivery.update({
                    where: { id: delivery.id },
                    data: {
                        status: finalFailure ? 'failed' : 'retrying',
                        attempts,
                        lastError: safeError(error),
                        nextAttemptAt: nextAttemptAt(attempts),
                    },
                });
            }
        }
    }
    finally {
        workerRunning = false;
    }
}
function nextAttemptAt(attempts) {
    const delayMinutes = Math.min(60, Math.max(1, 2 ** Math.min(attempts, 6)));
    return new Date(Date.now() + delayMinutes * 60 * 1000);
}
function safeError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').slice(0, 500);
}
async function sendLineNotification(payload) {
    if (!config_1.config.LINE_CHANNEL_ACCESS_TOKEN) {
        throw new Error('LINE channel access token is not configured');
    }
    const admins = (await db_1.db.lineAdmin.findMany({
        where: { active: true, role: { in: ['owner', 'developer'] } },
        select: { lineUserId: true },
    })).filter((admin) => isLineUserId(admin.lineUserId));
    if (admins.length === 0) {
        throw new Error('No active valid LINE administrators configured. Bind an owner/developer LINE account or configure LINE user IDs that start with U and contain 33 characters.');
    }
    const messages = [lineFlexMessage(payload)];
    const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config_1.config.LINE_CHANNEL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: admins.map((admin) => admin.lineUserId), messages }),
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`LINE multicast failed with ${response.status}: ${truncate(body, 180)}`);
    }
    return `line:${admins.length}`;
}
function lineFlexMessage(payload) {
    return (0, line_ui_1.bookingFlexMessage)({
        id: payload.booking_id,
        source: payload.source,
        room: payload.room,
        checkIn: payload.check_in,
        checkOut: payload.check_out,
        guestName: payload.guest_name,
        guestPhone: payload.guest_phone,
        guestLineId: payload.guest_line_id,
        guestCount: payload.guest_count,
        totalPrice: payload.total_price,
        status: payload.status,
        notes: payload.notes_summary,
        notificationStatus: formatEventType(payload.event_type),
        adminUrl: payload.admin_url,
    });
}
exports.__notificationTest = { lineFlexMessage, channelsForEvent };
async function sendEmailNotification(payload) {
    const recipients = parseCsv(config_1.config.BOOKING_NOTIFICATION_EMAILS);
    if (recipients.length === 0) {
        throw new Error('Booking notification email recipients are not configured');
    }
    if (config_1.config.NODE_ENV === 'test' && !config_1.config.SMTP_HOST) {
        return `test-email:${recipients.length}`;
    }
    if (!config_1.config.SMTP_HOST) {
        throw new Error('SMTP host is not configured');
    }
    const transporter = nodemailer_1.default.createTransport({
        host: config_1.config.SMTP_HOST,
        port: config_1.config.SMTP_PORT,
        secure: config_1.config.SMTP_SECURE,
        auth: config_1.config.SMTP_USER && config_1.config.SMTP_PASSWORD ? {
            user: config_1.config.SMTP_USER,
            pass: config_1.config.SMTP_PASSWORD,
        } : undefined,
    });
    const info = await transporter.sendMail({
        from: config_1.config.SMTP_FROM,
        to: recipients,
        subject: emailSubject(payload),
        text: emailText(payload),
        html: emailHtml(payload),
    });
    return info.messageId || `smtp:${recipients.length}`;
}
function emailSubject(payload) {
    return `官網訂房通知 #${payload.booking_id} ${payload.check_in} ${payload.guest_name}`;
}
function emailText(payload) {
    return [
        `訂單：#${payload.booking_id}`,
        `來源：${formatSource(payload.source)}`,
        `房型：${payload.room}`,
        `入住 / 退房：${payload.check_in} ~ ${payload.check_out}`,
        `房客：${payload.guest_name}`,
        `電話：${payload.guest_phone}`,
        `LINE ID：${payload.guest_line_id || '未填寫'}`,
        `人數：${payload.guest_count}`,
        `金額：${formatMoney(payload.total_price)}`,
        `狀態：${formatStatus(payload.status)}`,
        `備註：${payload.notes_summary || '無'}`,
        `後台：${payload.admin_url}`,
    ].join('\n');
}
function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
    }[char] || char));
}
function emailHtml(payload) {
    const rows = [
        ['訂單', `#${payload.booking_id}`],
        ['來源', formatSource(payload.source)],
        ['房型', payload.room],
        ['入住 / 退房', `${payload.check_in} ~ ${payload.check_out}`],
        ['房客', payload.guest_name],
        ['電話', payload.guest_phone],
        ['LINE ID', payload.guest_line_id || '未填寫'],
        ['人數', `${payload.guest_count}`],
        ['金額', formatMoney(payload.total_price)],
        ['狀態', formatStatus(payload.status)],
        ['備註', payload.notes_summary || '無'],
    ];
    return `<!doctype html><html><body><h1>官網訂房通知</h1><table cellpadding="6" cellspacing="0" border="1">${rows.map(([label, value]) => `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}</table><p><a href="${escapeHtml(payload.admin_url)}">開啟後台訂單</a></p></body></html>`;
}
//# sourceMappingURL=notifications.js.map