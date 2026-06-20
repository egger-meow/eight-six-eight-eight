# LINE Bot and Booking Notifications

Last updated: 2026-06-20

## Scope

The LINE bot is integrated into the existing `apps/api` Express service. It is not a separate application. The webhook URL is:

```text
POST /api/v1/line/admin/webhook
https://api.8688bnb.com/api/v1/line/admin/webhook
```

The bot is an alternative management surface for the same PostgreSQL data used by the public website and admin app. Booking, availability, pricing, blocked-date, announcement, and room mutations must continue to use shared API/service logic rather than fake browser requests to the admin UI.

## Immediate Booking Notification

When a website reservation is successfully created, the API writes the booking and a `NotificationEvent` in the same PostgreSQL transaction. The transaction creates independent `NotificationDelivery` rows for:

- `line`
- `email`

After commit, the API process immediately kicks the notification worker. If LINE or SMTP fails, the booking remains valid and the delivery row becomes `retrying` or `failed`; it does not roll back the booking. Pending, retrying, failed, and sent deliveries remain inspectable in the database and through `GET /api/v1/line/admin/notification-deliveries` for authenticated admins. A single delivery can be queued for immediate retry through `PUT /api/v1/line/admin/notification-deliveries/{id}/retry`.

## Notification Policy

| Event | Source | LINE | Email | Notes |
|---|---|---:|---:|---|
| booking created | website | yes | yes | Highest-priority path. |
| booking created | admin | yes | yes | Owner gets the same operational notification. |
| booking created | LINE bot | no, when the same authorized LINE admin already received an immediate reply | yes | Avoid redundant LINE push. |
| booking created | OTA/webhook | yes | yes | Useful for channel-manager reconciliation. |
| booking modified | admin / LINE / OTA | yes | yes | Includes changed booking summary. |
| booking confirmed | admin / LINE / OTA | yes | yes | LINE-originated postback sends email and skips redundant LINE where applicable. |
| booking cancelled | admin / LINE / OTA | yes | yes | Delete currently emits a cancellation notification before removal. |
| OTA processing failure | OTA/webhook | yes | yes | Planned event type exists as `ota.processing_failed`; webhook mapping still needs provider validation. |

## Outbox Design

The repository uses one event row plus per-channel delivery rows:

- `NotificationEvent`: event type, aggregate, dedupe key, source, payload snapshot, optional booking/admin actor.
- `NotificationDelivery`: one row per channel with status, attempts, next attempt time, sent time, provider id, and last error.

This design is the smallest useful fit for the current repository because it preserves a single business event while tracking LINE and email independently. `dedupeKey` prevents duplicate event creation for the same business event, and `(eventId, channel)` prevents duplicate channel rows.

## Worker Execution

The worker runs inside the API process by default (`NOTIFICATION_WORKER_ENABLED=true`) and polls due deliveries every `NOTIFICATION_WORKER_INTERVAL_MS`. This is the simplest NAS deployment because it needs no extra container. If delivery volume or isolation requirements grow, the same API image can run a separate worker service with the HTTP listener disabled and the worker enabled.

Retry behavior:

- New deliveries start as `pending`.
- Temporary failures become `retrying` with exponential backoff capped at 60 minutes.
- After 8 attempts, a delivery becomes `failed` and remains inspectable.
- Missing SMTP or LINE credentials are delivery failures, not booking failures.

Logs must not include access tokens, SMTP passwords, or full guest payloads. Delivery errors are truncated and bearer tokens are redacted before storage.

## LINE Booking Message

LINE push notifications use a Flex Message containing:

- booking ID
- source
- room
- check-in and check-out
- guest name
- guest phone
- guest count
- guest LINE ID
- total price
- booking status
- guest note summary

Actions include:

- confirm booking
- view details
- add internal note
- cancel booking
- open full Admin

## SMTP Email

SMTP is configured through environment variables only; real values must stay out of Git.

```text
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
BOOKING_NOTIFICATION_EMAILS
```

`BOOKING_NOTIFICATION_EMAILS` is a comma-separated recipient list. Email subjects use:

```text
[86.88 B&B] 新訂房 #<id> <check-in> <guest-name>
```

Messages include both plain-text and HTML booking summaries. In `NODE_ENV=test`, SMTP can be mocked by leaving `SMTP_HOST` empty; production missing SMTP configuration causes retryable delivery failure.

## Authorized LINE Administrators

The bot is intentionally small and explicit, not an unrestricted multi-user admin system. The database stores:

- LINE user ID
- display name
- role: `owner` or `developer`
- active status
- bound time
- last seen time

Admin-authenticated API endpoints can create one-time binding codes. Binding codes are role-specific (`8688-OWNER-...` or `8688-DEVELOPER-...`), hashed at rest, expire by `LINE_BINDING_CODE_TTL_MINUTES`, and become inactive after use.

Owner access cannot be revoked by the LINE revocation endpoint. Developer access can be revoked through the admin-authenticated API. Every webhook event and postback rechecks the active LINE admin record before exposing data or mutating bookings. Unauthorized users receive only a generic refusal. LINE mutations write `LineAuditLog` rows, inspectable with `GET /api/v1/line/admin/audit-logs`.

## Webhook Security

Middleware order:

1. Helmet/CORS.
2. Mount `/api/v1/line/admin/webhook` before global `express.json()`.
3. Use `express.raw({ type: 'application/json' })` only on `POST /api/v1/line/admin/webhook`.
4. Validate `x-line-signature` against the exact raw body.
5. Parse JSON only after signature validation.
6. Accept empty `events: []` webhook verification.
7. Store `webhookEventId` in `LineWebhookRedelivery` and ignore duplicates.
8. Accept only direct one-to-one `user` events; group and room sources are ignored.

Existing admin cookie authentication and CSRF middleware remain unchanged for normal API routes.

## Implemented LINE Commands

The webhook now supports direct one-to-one text commands for the required owner workflows. Commands are intentionally explicit and small; unsupported users receive no private data.

Dashboard:

```text
儀表板
dashboard
狀態
```

Booking management:

```text
訂單 <訂單ID/姓名/電話>
搜尋 <訂單ID/姓名/電話>
確認 <訂單ID>
取消 <訂單ID>
入住 <訂單ID>
退房 <訂單ID>
未入住 <訂單ID>
備註 <訂單ID> <內容>
新增訂房 <房型slug或ID> <入住YYYY-MM-DD> <退房YYYY-MM-DD> <人數> <姓名> <電話> [金額] [備註]
修改訂單 <ID> 房型/入住/退房/人數/金額/電話/狀態 <值>
```

Booking detail replies use a LINE Flex Message with action buttons for confirm, check-in, check-out, no-show, cancel, and opening the full Admin. Final room/date/person-count mutations re-read the booking and call the same shared `booking-rules` helper as the HTTP booking route to validate room existence, room availability, capacity, overlapping bookings, and blocked dates immediately before the database update. LINE-created bookings use source `line` and avoid redundant LINE Push to the same operator while still creating email delivery according to policy.

Blocked dates:

```text
封鎖列表
封鎖 <房型slug或ID> <開始YYYY-MM-DD> <結束YYYY-MM-DD> [原因]
封鎖 全部 <開始YYYY-MM-DD> <結束YYYY-MM-DD> [原因]
解除封鎖 <封鎖ID>
```

Blocking all rooms and removing a block return LINE confirmation templates before mutation.

Room management:

```text
房型
房況 <房型slug或ID> <開始YYYY-MM-DD> <結束YYYY-MM-DD>
房價 <房型slug或ID> 平日/假日/過年 <金額>
房型開關 <房型slug或ID> 開/關
```

LINE does not support room deletion, image management, or room creation.

Website announcement:

```text
公告
公告更新 <標題>|<內容>
```

This reads and updates the same effective pinned announcement that the current Admin `/news` page edits and the website consumes from the public news endpoint. It does not add multi-item News CRUD to LINE.

## Remaining Hardening

The core required bot functions are implemented in the existing API process. Booking room/date/capacity/conflict validation is shared between the HTTP booking route and LINE handlers. Further hardening should focus on automated integration tests around LINE command parsing, provider-level LINE webhook fixtures, and additional service extraction for non-booking domains if those flows become more complex.


## Admin LINE Management Page

The Admin app includes `/line` for owner operations around the bot:

- create one-time owner/developer binding codes
- list bound LINE administrators
- revoke active developer access
- inspect notification delivery rows
- retry an individual delivery immediately after fixing SMTP or LINE configuration
- inspect LINE mutation audit logs

This page uses the existing admin cookie and CSRF flow. It does not expose secrets; LINE channel tokens and SMTP passwords stay in environment variables.


## LINE User ID Format

LINE Push Message delivery requires Messaging API user IDs, which start with `U` and are not phone numbers, LINE display names, or LINE IDs such as `@...`. The preferred owner workflow is:

1. Open Admin `/line`.
2. Create an owner or developer binding code.
3. Send that code to the bot in a direct one-to-one LINE chat.
4. Confirm the Admin `/line` page shows `可接收通知`.
5. Retry any pending LINE notification delivery from the same page.

## Rich Menu and Mobile UX

Authorized administrators should normally navigate through a per-user Rich Menu instead of memorizing text commands. The bot does not set a public/default Rich Menu and does not add LINE group notification support. Each active administrator receives notifications and uses the bot in a direct one-to-one chat with the `86.88 網站管理` Official Account.

The Rich Menu is a single 2500x1686 image split into three columns and two rows:

```text
今日概況 | 訂房管理 | 新增訂房
封鎖日期 | 房型價格 | 網站公告
```

Tap areas use hidden postback actions, not message actions, so tapping the menu does not add command text to the chat. Current versioned payloads are:

```text
v=1&a=dashboard
v=1&a=booking_menu
v=1&a=booking_create
v=1&a=blocked_menu
v=1&a=room_menu
v=1&a=announcement
```

Lifecycle:

- Successful owner/developer binding links the versioned Rich Menu to that user's `U...` LINE user ID.
- Developer revocation unlinks that user's Rich Menu. Owner access remains protected.
- Multiple active administrators are supported; each active valid `U...` ID is linked separately.
- Unauthorized or malformed user IDs are never linked.

Sync command:

```bash
npm run line:rich-menu:sync --workspace @8688bnb/api -- --image=/absolute/path/to/rich-menu.png
npm run line:rich-menu:sync --workspace @8688bnb/api -- --dry-run
```

The sync command validates tap areas, creates or reuses the versioned Rich Menu, uploads a PNG/JPEG image when `--image` or `LINE_RICH_MENU_IMAGE_PATH` is provided, links active authorized users, unlinks inactive users, deletes stale `86.88 Admin ...` menu versions, and reports only non-secret status counts. It never prints the LINE channel access token.

Deployment and troubleshooting:

1. Confirm `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_CHANNEL_SECRET` are configured on the API container.
2. Prepare a PNG/JPEG Rich Menu image at 2500x1686 with the six labels above.
3. Run the sync command from the repo root or inside the API container with the image path available.
4. Confirm Admin `/line` shows active valid users as `可接收通知`.
5. If zero users are linked, verify the stored IDs start with `U` and are 33 characters total.
6. If image upload fails, verify the file type and dimensions.
7. If menu taps return `操作資料無效`, rerun sync so current `v=1` postbacks are installed.

## Updated Booking Card UX

Booking push notifications and booking search details use a reusable Flex Message. The card shows booking status, booking ID, source, room, check-in/check-out, number of nights when practical, guest name, guest count, guest phone, optional guest-facing LINE ID, total price, short note, and notification context when relevant.

Primary buttons are state-aware. Pending bookings can show confirmation and cancellation actions; confirmed bookings expose check-in, modify, and cancellation paths; checked-in bookings expose check-out; checked-out, cancelled, and no-show bookings are view-only. Visible card actions are intentionally limited to `查看詳情`, `確認訂房` when valid, `撥打電話` when a safe phone URI can be built, and `更多操作`.

Secondary actions use Quick Replies where LINE supports them:

- copy phone number
- copy guest-facing LINE ID, only when `Booking.guestLineId` contains real data
- copy a concise booking summary
- add internal note
- open the full Admin booking page

Phone links are normalized and validated before creating a `tel:` URI. Arbitrary guest input is never inserted directly into a URI. Guest-facing LINE IDs are treated as plain contact text for clipboard copy only; they are not Messaging API `U...` IDs and are not the Official Account `@gps2290j` ID. The bot does not invent personal LINE deep links.

Search results are capped into a Flex carousel rather than many separate booking messages. Rich Menu dashboard, room price, and announcement views use compact Flex cards for scannable mobile display. Unknown commands return concise command help instead of repeated menu cards.

## Quick Replies and Date Pickers

Contextual Quick Replies are used only where relevant:

- Booking management: `待確認`, `今日入住`, `七日內訂房`, `搜尋訂房`, `返回`.
- Blocked dates: `查看封鎖`, `封鎖單一房型`, `封鎖全部房型`, `解除封鎖`, `返回`.
- Room management: `平日房價`, `週末房價`, `假日房價`, `房型開關`, `返回`.

Rich Menu date flows use LINE date-picker postbacks for booking check-in/check-out and blocked-date start/end. Booking creation continues with postback room selection, postback guest count selection, a short text prompt for guest contact details, and a final confirmation postback before mutation. Temporary multi-step state is stored in Redis with expiration. Final mutations still re-read current database state, validate authorization, use shared booking/blocked-date rules, and write audit logs.

Text commands remain available for LINE desktop and recovery workflows. The normal mobile booking-create flow no longer requires typing ISO dates.
