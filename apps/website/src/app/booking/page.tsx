'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import { bookingPage } from '@/data/content';
import { checkAvailability, createBooking, getRooms, hasWebsiteApi, mediaUrl, type BookingResult, type WebsiteRoom } from '@/lib/api';
import styles from './booking.module.css';

const lineProfileUrl = 'https://line.me/ti/p/~@gps2290j';

type FormState = {
  checkIn: string;
  checkOut: string;
  roomSlug: string;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestLineId: string;
  notes: string;
};

const initialState: FormState = {
  checkIn: '',
  checkOut: '',
  roomSlug: '',
  guestCount: 2,
  guestName: '',
  guestPhone: '',
  guestLineId: '',
  notes: '',
};

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function nextDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
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

function roomDisplayName(room: WebsiteRoom | undefined, lang: 'zh' | 'en') {
  if (!room) return '';
  return lang === 'en' ? room.name_en || room.name_zh : room.name_zh;
}

function unitLabel(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function lineMessage(room: WebsiteRoom | undefined, form: FormState, totalPrice?: number | null, bookingId?: number) {
  return [
    '你好，我想預約訂房：',
    bookingId ? `訂單編號：${bookingId}` : null,
    `房型：${room?.name_zh || '尚未選擇'}`,
    room?.name_en ? `Room: ${room.name_en}` : null,
    `入住：${form.checkIn || '尚未選擇'}`,
    `退房：${form.checkOut || '尚未選擇'}`,
    `人數：${form.guestCount}人`,
    form.guestName ? `姓名：${form.guestName}` : null,
    form.guestPhone ? `電話：${form.guestPhone}` : null,
    form.guestLineId ? `LINE ID：${form.guestLineId}` : null,
    totalPrice ? `預估金額：NT$ ${totalPrice.toLocaleString()}` : null,
    form.notes ? `備註：${form.notes}` : null,
    '請協助確認是否可入住，謝謝。',
  ].filter(Boolean).join('\n');
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function BookingForm() {
  const { t, lang } = useLang();
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get('room') || '';
  const [rooms, setRooms] = useState<WebsiteRoom[]>([]);
  const [apiAvailable, setApiAvailable] = useState(hasWebsiteApi);
  const [form, setForm] = useState<FormState>({ ...initialState, roomSlug: initialRoom });
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<BookingResult | null>(null);
  const today = useMemo(() => todayString(), []);

  useEffect(() => {
    let mounted = true;
    getRooms().then(({ rooms, fromApi }) => {
      if (!mounted) return;
      setRooms(rooms.filter((room) => room.available !== false));
      setApiAvailable(fromApi && hasWebsiteApi);
      const availableRooms = rooms.filter((room) => room.available !== false);
      if (!initialRoom && availableRooms[0]) {
        setForm((current) => ({ ...current, roomSlug: availableRooms[0].slug }));
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

  function updateCheckIn(value: string) {
    setForm((current) => ({
      ...current,
      checkIn: value,
      checkOut: nextDate(value),
    }));
  }

  function updateRoomSlug(value: string) {
    const selectedRoom = rooms.find((item) => item.slug === value);
    setForm((current) => ({
      ...current,
      roomSlug: value,
      guestCount: selectedRoom ? Math.min(current.guestCount, selectedRoom.capacity) : current.guestCount,
    }));
  }

  async function handleLineClick() {
    const message = lineMessage(room, form, success?.total_price ?? estimatedPrice, success?.id);
    try {
      await copyText(message);
      setStatus(t(bookingPage.messages.lineCopied));
    } catch {
      setStatus(t(bookingPage.messages.lineCopyFailed));
    }
    window.open(lineProfileUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('');
    setSuccess(null);

    if (!room) {
      setStatus(t(bookingPage.messages.selectRoom));
      return;
    }
    if (nightCount <= 0) {
      setStatus(t(bookingPage.messages.invalidDates));
      return;
    }
    if (form.guestCount > room.capacity) {
      setStatus(`${t(bookingPage.messages.capacity)} ${room.capacity}${t(bookingPage.messages.capacitySuffix)}`);
      return;
    }
    if (!form.guestName.trim() || !form.guestPhone.trim()) {
      setStatus(t(bookingPage.messages.requiredContact));
      return;
    }
    if (!apiAvailable || typeof room.id !== 'number') {
      setStatus(t(bookingPage.messages.apiUnavailable));
      return;
    }

    setSubmitting(true);
    try {
      const availability = await checkAvailability(room.slug, form.checkIn, form.checkOut);
      if (!availability.available) {
        setStatus(t(bookingPage.messages.unavailable));
        return;
      }

      const booking = await createBooking({
        room_id: room.id,
        check_in: form.checkIn,
        check_out: form.checkOut,
        guest_name: form.guestName.trim(),
        guest_phone: form.guestPhone.trim(),
        guest_line_id: form.guestLineId.trim(),
        guest_count: form.guestCount,
        notes: form.notes.trim(),
      });
      setSuccess(booking);
      setStatus(t(bookingPage.messages.success));
    } catch (error) {
      const message = error instanceof Error ? error.message : '訂房送出失敗';
      setStatus(message || t(bookingPage.messages.failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.bookingForm} onSubmit={handleSubmit}>
      {!apiAvailable && (
        <div className={styles.notice}>
          {t(bookingPage.unavailableNotice)}
        </div>
      )}

      <div className={styles.formGroup}>
        <h2 className={styles.formLabel}>{t(bookingPage.sections.dates)}</h2>
        <div className={styles.inputGrid}>
          <label>
            <span>{t(bookingPage.fields.checkIn)}</span>
            <input
              type="date"
              className={styles.formControl}
              value={form.checkIn}
              onChange={(event) => updateCheckIn(event.target.value)}
              min={today}
              required
            />
          </label>
          <label>
            <span>{t(bookingPage.fields.checkOut)}</span>
            <input
              type="date"
              className={styles.formControl}
              value={form.checkOut}
              onChange={(event) => update('checkOut', event.target.value)}
              min={form.checkIn ? nextDate(form.checkIn) : today}
              required
            />
          </label>
        </div>
      </div>

      <div className={styles.formGroup}>
        <h2 className={styles.formLabel}>{t(bookingPage.sections.room)}</h2>
        <div className={styles.roomSelectGrid}>
          {rooms.map((item) => (
            <button
              key={item.slug}
              type="button"
              className={`${styles.roomCard} ${form.roomSlug === item.slug ? styles.selected : ''}`}
              onClick={() => updateRoomSlug(item.slug)}
              aria-pressed={form.roomSlug === item.slug}
            >
              <span className={styles.roomPreview} aria-hidden="true">
                {item.images[0]?.url && (
                  <Image
                    src={mediaUrl(item.images[0].url)}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 80vw, 220px"
                    style={{ objectFit: 'cover' }}
                  />
                )}
              </span>
              <span className={styles.roomName}>{roomDisplayName(item, lang)}</span>
              <span className={styles.roomCapacity}>{lang === 'en' ? `Up to ${item.capacity} ${unitLabel(item.capacity, 'guest', 'guests')}` : `可住 ${item.capacity} 人`}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <h2 className={styles.formLabel}>{t(bookingPage.sections.guest)}</h2>
        <div className={styles.inputGrid}>
          <label>
            <span>{t(bookingPage.fields.guestCount)}</span>
            <input
              type="number"
              min="1"
              max={room?.capacity || 10}
              className={styles.formControl}
              value={form.guestCount}
              onChange={(event) => update('guestCount', Math.min(Number(event.target.value), room?.capacity || 10))}
              required
            />
          </label>
          <label>
            <span>{t(bookingPage.fields.name)}</span>
            <input
              className={styles.formControl}
              value={form.guestName}
              onChange={(event) => update('guestName', event.target.value)}
              required
            />
          </label>
          <label>
            <span>{t(bookingPage.fields.phone)}</span>
            <input
              className={styles.formControl}
              value={form.guestPhone}
              onChange={(event) => update('guestPhone', event.target.value)}
              required
            />
          </label>
          <label>
            <span>{t(bookingPage.fields.lineId)}</span>
            <input
              className={styles.formControl}
              value={form.guestLineId}
              onChange={(event) => update('guestLineId', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>
          <span className={styles.formLabel}>{t(bookingPage.sections.notes)}</span>
          <textarea
            className={styles.formControl}
            rows={4}
            value={form.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder={t(bookingPage.placeholders.notes)}
          />
        </label>
      </div>

      <div className={styles.summary}>
        <h3 className={styles.summaryTitle}>{t(bookingPage.summary.title)}</h3>
        <div className={styles.summaryRow}><span>{t(bookingPage.fields.checkIn)}</span><span>{form.checkIn || t(bookingPage.summary.notSelected)}</span></div>
        <div className={styles.summaryRow}><span>{t(bookingPage.fields.checkOut)}</span><span>{form.checkOut || t(bookingPage.summary.notSelected)}</span></div>
        <div className={styles.summaryRow}><span>{t(bookingPage.summary.nights)}</span><span>{nightCount > 0 ? `${nightCount} ${unitLabel(nightCount, t(bookingPage.summary.nightUnit), t(bookingPage.summary.nightUnitPlural))}` : t(bookingPage.summary.notSelected)}</span></div>
        <div className={styles.summaryRow}><span>{t(bookingPage.summary.room)}</span><span>{roomDisplayName(room, lang) || t(bookingPage.summary.notSelected)}</span></div>
        <div className={styles.summaryRow}><span>{t(bookingPage.summary.guests)}</span><span>{`${form.guestCount} ${unitLabel(form.guestCount, t(bookingPage.summary.guestUnit), t(bookingPage.summary.guestUnitPlural))}`}</span></div>
        <div className={styles.totalPrice}>
          {t(bookingPage.summary.price)}：NT$ {(success?.total_price ?? estimatedPrice).toLocaleString()}
          <p>{t(bookingPage.summary.priceNote)}</p>
        </div>
      </div>

      {status && <div className={success || status === t(bookingPage.messages.lineCopied) ? styles.success : styles.error}>{status}</div>}

      <div className={styles.actions}>
        <button className={`btn ${styles.submitBtn}`} type="submit" disabled={submitting || !apiAvailable}>
          {submitting ? t(bookingPage.actions.submitting) : t(bookingPage.actions.submit)}
        </button>
        <button
          className={`btn ${styles.lineBtn}`}
          type="button"
          onClick={handleLineClick}
        >
          {t(bookingPage.actions.line)}
        </button>
      </div>
    </form>
  );
}

export default function Booking() {
  const { t } = useLang();

  return (
    <>
      <div className={styles.subPage}>
        <div className={styles.pageHeader}>
          <div className="container">
            <span className="section-label">{t(bookingPage.label)}</span>
            <h1 className={styles.title}>{t(bookingPage.h1)}</h1>
            <span className="gold-line center" />
            <p className={styles.subtitle}>{t(bookingPage.subtitle)}</p>
          </div>
        </div>
      </div>

      <section className={styles.section}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <Suspense fallback={<div className={styles.bookingForm}>{t({ zh: '載入訂房表單...', en: 'Loading reservation form...' })}</div>}>
            <BookingForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
