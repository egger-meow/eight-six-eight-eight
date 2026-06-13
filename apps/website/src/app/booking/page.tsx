'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { checkAvailability, createBooking, getRooms, hasWebsiteApi, type BookingResult, type WebsiteRoom } from '@/lib/api';
import styles from './booking.module.css';

const lineBaseUrl = 'https://line.me/R/oaMessage/@gps2290j/';

type FormState = {
  checkIn: string;
  checkOut: string;
  roomSlug: string;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  notes: string;
};

const initialState: FormState = {
  checkIn: '',
  checkOut: '',
  roomSlug: '',
  guestCount: 2,
  guestName: '',
  guestPhone: '',
  guestEmail: '',
  notes: '',
};

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function localEstimate(room: WebsiteRoom | undefined, checkIn: string, checkOut: string) {
  if (!room) return 0;
  let total = 0;
  const current = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  while (current < end) {
    const day = current.getDay();
    total += day === 5 || day === 6 ? room.price_weekend : room.price_weekday;
    current.setDate(current.getDate() + 1);
  }
  return total;
}

function lineHref(room: WebsiteRoom | undefined, form: FormState, totalPrice?: number | null, bookingId?: number) {
  const message = [
    '你好，我想預約訂房：',
    bookingId ? `訂單編號：${bookingId}` : null,
    `房型：${room?.name_zh || '尚未選擇'}`,
    `入住：${form.checkIn || '尚未選擇'}`,
    `退房：${form.checkOut || '尚未選擇'}`,
    `人數：${form.guestCount}人`,
    form.guestName ? `姓名：${form.guestName}` : null,
    form.guestPhone ? `電話：${form.guestPhone}` : null,
    form.guestEmail ? `Email：${form.guestEmail}` : null,
    totalPrice ? `預估金額：NT$ ${totalPrice.toLocaleString()}` : null,
    form.notes ? `備註：${form.notes}` : null,
    '請協助確認是否可入住，謝謝。',
  ].filter(Boolean).join('\n');

  return `${lineBaseUrl}?${encodeURIComponent(message)}`;
}

function BookingForm() {
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get('room') || '';
  const [rooms, setRooms] = useState<WebsiteRoom[]>([]);
  const [apiAvailable, setApiAvailable] = useState(hasWebsiteApi);
  const [form, setForm] = useState<FormState>({ ...initialState, roomSlug: initialRoom });
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<BookingResult | null>(null);

  useEffect(() => {
    let mounted = true;
    getRooms().then(({ rooms, fromApi }) => {
      if (!mounted) return;
      setRooms(rooms.filter((room) => room.available !== false));
      setApiAvailable(fromApi && hasWebsiteApi);
      if (!initialRoom && rooms[0]) {
        setForm((current) => ({ ...current, roomSlug: rooms[0].slug }));
      }
    });
    return () => { mounted = false; };
  }, [initialRoom]);

  const room = rooms.find((item) => item.slug === form.roomSlug);
  const nightCount = nightsBetween(form.checkIn, form.checkOut);
  const estimatedPrice = useMemo(
    () => localEstimate(room, form.checkIn, form.checkOut),
    [room, form.checkIn, form.checkOut]
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('');
    setSuccess(null);

    if (!room) {
      setStatus('請選擇房型。');
      return;
    }
    if (nightCount <= 0) {
      setStatus('退房日期必須晚於入住日期。');
      return;
    }
    if (form.guestCount > room.capacity) {
      setStatus(`此房型最多可入住 ${room.capacity} 人，請調整人數或選擇其他房型。`);
      return;
    }
    if (!form.guestName.trim() || !form.guestPhone.trim()) {
      setStatus('請填寫姓名與電話，方便民宿主人確認訂房。');
      return;
    }
    if (!apiAvailable || typeof room.id !== 'number') {
      setStatus('線上空房查詢與送出暫時無法使用，請先使用 LINE 聯繫民宿主人。');
      return;
    }

    setSubmitting(true);
    try {
      const availability = await checkAvailability(room.slug, form.checkIn, form.checkOut);
      if (!availability.available) {
        setStatus('此時段目前無法預約，請更換日期或透過 LINE 詢問其他安排。');
        return;
      }

      const booking = await createBooking({
        room_id: room.id,
        check_in: form.checkIn,
        check_out: form.checkOut,
        guest_name: form.guestName.trim(),
        guest_phone: form.guestPhone.trim(),
        guest_email: form.guestEmail.trim(),
        guest_count: form.guestCount,
        notes: form.notes.trim(),
      });
      setSuccess(booking);
      setStatus('已送出預約，狀態為待確認。請透過 LINE 補充付款或抵達時間等細節。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '訂房送出失敗';
      setStatus(message || '訂房送出失敗，請稍後再試或使用 LINE 聯繫。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.bookingForm} onSubmit={handleSubmit}>
      {!apiAvailable && (
        <div className={styles.notice}>
          線上空房查詢與送出暫時無法使用。您仍可填寫資料後使用 LINE 聯繫民宿主人。
        </div>
      )}

      <div className={styles.formGroup}>
        <h2 className={styles.formLabel}>選擇日期</h2>
        <div className={styles.inputGrid}>
          <label>
            <span>入住日期</span>
            <input
              type="date"
              className={styles.formControl}
              value={form.checkIn}
              onChange={(event) => update('checkIn', event.target.value)}
              required
            />
          </label>
          <label>
            <span>退房日期</span>
            <input
              type="date"
              className={styles.formControl}
              value={form.checkOut}
              onChange={(event) => update('checkOut', event.target.value)}
              required
            />
          </label>
        </div>
      </div>

      <div className={styles.formGroup}>
        <h2 className={styles.formLabel}>選擇房型</h2>
        <div className={styles.roomSelectGrid}>
          {rooms.map((item) => (
            <button
              key={item.slug}
              type="button"
              className={`${styles.roomCard} ${form.roomSlug === item.slug ? styles.selected : ''}`}
              onClick={() => update('roomSlug', item.slug)}
            >
              <span className={styles.roomName}>{item.name_zh}</span>
              <span className={styles.roomCapacity}>可住 {item.capacity} 人</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <h2 className={styles.formLabel}>入住資料</h2>
        <div className={styles.inputGrid}>
          <label>
            <span>入住人數</span>
            <input
              type="number"
              min="1"
              max="10"
              className={styles.formControl}
              value={form.guestCount}
              onChange={(event) => update('guestCount', Number(event.target.value))}
              required
            />
          </label>
          <label>
            <span>姓名</span>
            <input
              className={styles.formControl}
              value={form.guestName}
              onChange={(event) => update('guestName', event.target.value)}
              required
            />
          </label>
          <label>
            <span>電話</span>
            <input
              className={styles.formControl}
              value={form.guestPhone}
              onChange={(event) => update('guestPhone', event.target.value)}
              required
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              className={styles.formControl}
              value={form.guestEmail}
              onChange={(event) => update('guestEmail', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>
          <span className={styles.formLabel}>備註</span>
          <textarea
            className={styles.formControl}
            rows={4}
            value={form.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="抵達時間、特殊需求或其他想先告知的事項"
          />
        </label>
      </div>

      <div className={styles.summary}>
        <h3 className={styles.summaryTitle}>訂房摘要</h3>
        <div className={styles.summaryRow}><span>入住日期</span><span>{form.checkIn || '尚未選擇'}</span></div>
        <div className={styles.summaryRow}><span>退房日期</span><span>{form.checkOut || '尚未選擇'}</span></div>
        <div className={styles.summaryRow}><span>晚數</span><span>{nightCount > 0 ? `${nightCount} 晚` : '尚未選擇'}</span></div>
        <div className={styles.summaryRow}><span>房型</span><span>{room?.name_zh || '尚未選擇'}</span></div>
        <div className={styles.summaryRow}><span>人數</span><span>{form.guestCount} 人</span></div>
        <div className={styles.totalPrice}>
          預估總價：NT$ {(success?.total_price ?? estimatedPrice).toLocaleString()}
          <p>實際金額與付款方式以民宿主人確認為準</p>
        </div>
      </div>

      {status && <div className={success ? styles.success : styles.error}>{status}</div>}

      <div className={styles.actions}>
        <button className={`btn ${styles.submitBtn}`} type="submit" disabled={submitting || !apiAvailable}>
          {submitting ? '送出中...' : '送出線上預約'}
        </button>
        <a
          className={`btn ${styles.lineBtn}`}
          href={lineHref(room, form, success?.total_price ?? estimatedPrice, success?.id)}
          target="_blank"
          rel="noopener noreferrer"
        >
          使用 LINE 聯繫確認
        </a>
      </div>
    </form>
  );
}

export default function Booking() {
  return (
    <>
      <div className={styles.header}>
        <div className="container">
          <h1>預約訂房</h1>
          <p>RESERVATION FORM</p>
        </div>
      </div>

      <section className={styles.section}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <Suspense fallback={<div className={styles.bookingForm}>載入訂房表單...</div>}>
            <BookingForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
