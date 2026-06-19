import nodemailer from 'nodemailer';
import type { Booking, Prisma, Room } from '@8688bnb/db';
import { db } from '@8688bnb/db';
import { config } from './config';

type BookingWithRoom = Booking & { room?: Room | null };
type NotificationChannel = 'line' | 'email';
type BookingEventType = 'booking.created' | 'booking.modified' | 'booking.confirmed' | 'booking.cancelled' | 'ota.processing_failed';

type CreateBookingNotificationArgs = {
  tx: Prisma.TransactionClient;
  booking: BookingWithRoom;
  eventType: BookingEventType;
  dedupeKey: string;
  source?: string;
  actorLineAdminId?: number | null;
};

type BookingNotificationPayload = {
  booking_id: number;
  event_type: BookingEventType;
  source: string;
  room: string;
  room_id: number;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_phone: string;
  guest_line_id: string | null;
  guest_count: number;
  total_price: number | null;
  status: string;
  notes_summary: string | null;
  admin_url: string;
};

let workerTimer: NodeJS.Timeout | null = null;
let workerRunning = false;

function dateOnly(value: Date) {
  return value.toISOString().split('T')[0];
}

export function isLineUserId(value: string) {
  return /^U[0-9a-f]{32}$/i.test(value);
}

function parseCsv(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function truncate(value: string | null | undefined, max = 120) {
  if (!value) return null;
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function formatMoney(value: number | null) {
  return value === null ? '未填寫' : `NT$ ${value.toLocaleString('zh-TW')}`;
}

function formatSource(value: string) {
  const labels: Record<string, string> = {
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

function formatEventType(value: BookingEventType) {
  const labels: Record<BookingEventType, string> = {
    'booking.created': '新訂房',
    'booking.modified': '訂房更新',
    'booking.confirmed': '訂房已確認',
    'booking.cancelled': '訂房已取消',
    'ota.processing_failed': 'OTA 處理失敗',
  };
  return labels[value];
}

function bookingAdminUrl(bookingId: number) {
  return `${config.PUBLIC_ADMIN_URL.replace(/\/$/, '')}/bookings?booking=${bookingId}`;
}

function buildBookingPayload(booking: BookingWithRoom, eventType: BookingEventType): BookingNotificationPayload {
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

function channelsForEvent(args: CreateBookingNotificationArgs): NotificationChannel[] {
  const channels: NotificationChannel[] = [];

  if (!(args.eventType === 'booking.created' && args.source === 'line' && args.actorLineAdminId)) {
    channels.push('line');
  }

  if (args.eventType === 'booking.created' && args.source === 'website') {
    channels.push('email');
  }

  return channels;
}

export async function createBookingNotificationEvent(args: CreateBookingNotificationArgs) {
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

export function kickNotificationWorker() {
  if (!config.NOTIFICATION_WORKER_ENABLED || config.NODE_ENV === 'test') return;
  void processDueNotifications().catch((error) => {
    console.error('Notification worker failed', safeError(error));
  });
}

export async function startNotificationWorker() {
  if (!config.NOTIFICATION_WORKER_ENABLED || config.NODE_ENV === 'test' || workerTimer) return;
  await seedLineAdminsFromEnv();
  await db.notificationDelivery.updateMany({
    where: { status: 'processing' },
    data: { status: 'retrying', nextAttemptAt: new Date() },
  });
  kickNotificationWorker();
  workerTimer = setInterval(kickNotificationWorker, config.NOTIFICATION_WORKER_INTERVAL_MS);
}

export function stopNotificationWorker() {
  if (workerTimer) clearInterval(workerTimer);
  workerTimer = null;
}

async function seedLineAdminsFromEnv() {
  const owners = parseCsv(config.LINE_ADMIN_OWNER_USER_IDS);
  const developers = parseCsv(config.LINE_ADMIN_DEVELOPER_USER_IDS);
  for (const lineUserId of owners.filter(isLineUserId)) {
    await db.lineAdmin.upsert({
      where: { lineUserId },
      update: { role: 'owner', active: true },
      create: { lineUserId, role: 'owner', active: true },
    });
  }
  for (const lineUserId of developers.filter(isLineUserId)) {
    await db.lineAdmin.upsert({
      where: { lineUserId },
      update: { role: 'developer', active: true },
      create: { lineUserId, role: 'developer', active: true },
    });
  }
}

export async function processDueNotifications(limit = 10) {
  if (workerRunning) return;
  workerRunning = true;
  try {
    const deliveries = await db.notificationDelivery.findMany({
      where: {
        status: { in: ['pending', 'retrying'] },
        nextAttemptAt: { lte: new Date() },
      },
      include: { event: true },
      orderBy: { nextAttemptAt: 'asc' },
      take: limit,
    });

    for (const delivery of deliveries) {
      const claimed = await db.notificationDelivery.updateMany({
        where: { id: delivery.id, status: { in: ['pending', 'retrying'] } },
        data: { status: 'processing' },
      });
      if (claimed.count !== 1) continue;

      try {
        const providerMessageId = delivery.channel === 'line'
          ? await sendLineNotification(delivery.event.payload as BookingNotificationPayload)
          : await sendEmailNotification(delivery.event.payload as BookingNotificationPayload);

        await db.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'sent',
            attempts: { increment: 1 },
            sentAt: new Date(),
            providerMessageId,
            lastError: null,
          },
        });
      } catch (error) {
        const attempts = delivery.attempts + 1;
        const finalFailure = attempts >= 8;
        await db.notificationDelivery.update({
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
  } finally {
    workerRunning = false;
  }
}

function nextAttemptAt(attempts: number) {
  const delayMinutes = Math.min(60, Math.max(1, 2 ** Math.min(attempts, 6)));
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').slice(0, 500);
}

async function sendLineNotification(payload: BookingNotificationPayload) {
  if (!config.LINE_CHANNEL_ACCESS_TOKEN) {
    throw new Error('LINE channel access token is not configured');
  }

  const admins = (await db.lineAdmin.findMany({
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
      Authorization: `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}`,
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

function lineFlexMessage(payload: BookingNotificationPayload) {
  const title = payload.event_type === 'booking.created' && payload.source === 'website' ? '官網訂房通知' : formatEventType(payload.event_type);
  const rows = [
    ['訂單', `#${payload.booking_id}`],
    ['來源', formatSource(payload.source)],
    ['房型', payload.room],
    ['入住', `${payload.check_in} ~ ${payload.check_out}`],
    ['房客', payload.guest_name],
    ['電話', payload.guest_phone],
    ['人數', `${payload.guest_count} 人`],
    ['LINE ID', payload.guest_line_id || '未填寫'],
    ['金額', formatMoney(payload.total_price)],
    ['狀態', formatStatus(payload.status)],
    ['備註', payload.notes_summary || '無'],
  ];

  return {
    type: 'flex',
    altText: `${title} #${payload.booking_id}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: title, weight: 'bold', size: 'lg' },
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
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          { type: 'button', style: 'primary', action: { type: 'postback', label: '確認訂房', data: `action=confirm_booking&booking_id=${payload.booking_id}` } },
          { type: 'button', action: { type: 'uri', label: '查看詳情', uri: payload.admin_url } },
          { type: 'button', action: { type: 'postback', label: '新增內部備註', data: `action=add_internal_note&booking_id=${payload.booking_id}` } },
          { type: 'button', style: 'secondary', action: { type: 'postback', label: '取消訂房', data: `action=cancel_booking&booking_id=${payload.booking_id}` } },
          { type: 'button', action: { type: 'uri', label: '開啟後台', uri: config.PUBLIC_ADMIN_URL } },
        ],
      },
    },
  };
}

async function sendEmailNotification(payload: BookingNotificationPayload) {
  const recipients = parseCsv(config.BOOKING_NOTIFICATION_EMAILS);
  if (recipients.length === 0) {
    throw new Error('Booking notification email recipients are not configured');
  }

  if (config.NODE_ENV === 'test' && !config.SMTP_HOST) {
    return `test-email:${recipients.length}`;
  }

  if (!config.SMTP_HOST) {
    throw new Error('SMTP host is not configured');
  }

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: config.SMTP_USER && config.SMTP_PASSWORD ? {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD,
    } : undefined,
  });

  const info = await transporter.sendMail({
    from: config.SMTP_FROM,
    to: recipients,
    subject: emailSubject(payload),
    text: emailText(payload),
    html: emailHtml(payload),
  });

  return info.messageId || `smtp:${recipients.length}`;
}

function emailSubject(payload: BookingNotificationPayload) {
  return `官網訂房通知 #${payload.booking_id} ${payload.check_in} ${payload.guest_name}`;
}

function emailText(payload: BookingNotificationPayload) {
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

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[char] || char));
}

function emailHtml(payload: BookingNotificationPayload) {
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
