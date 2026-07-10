'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './bookings.module.css';
import BookingCalendar from '@/components/BookingCalendar';
import BookingList from '@/components/BookingList';
import { apiFetch } from '@/lib/api';
import { Calendar, ClipboardCheck, List, Pencil, Plus, StickyNote, X } from 'lucide-react';

type ViewMode = 'calendar' | 'list';

interface BookingFormState {
  room_id: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_phone: string;
  guest_line_id: string;
  guest_count: string;
  total_price: string;
  status: string;
  source: string;
  notes: string;
}

const emptyForm: BookingFormState = {
  room_id: '',
  check_in: '',
  check_out: '',
  guest_name: '',
  guest_phone: '',
  guest_line_id: '',
  guest_count: '2',
  total_price: '',
  status: 'pending',
  source: 'admin',
  notes: '',
};

const statusOptions = [
  ['pending', '待確認'],
  ['confirmed', '已確認'],
  ['checked_in', '已入住'],
  ['checked_out', '已退房'],
  ['cancelled', '已取消'],
  ['no_show', '未入住'],
];

const statusLabels: Record<string, string> = Object.fromEntries(statusOptions);

const sourceOptions = [
  ['admin', '後台新增'],
  ['phone', '電話'],
  ['line', 'LINE'],
  ['website', '官網'],
  ['ota', 'OTA平台'],
  ['walk_in', '現場'],
];

const sourceLabels: Record<string, string> = Object.fromEntries(sourceOptions);

export default function BookingsPage() {
  const [view, setView] = useState<ViewMode>('calendar');
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [form, setForm] = useState<BookingFormState>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailNote, setDetailNote] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await apiFetch('/rooms');
        setRooms(res?.data || []);
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get('booking'));
    if (id) setSelectedBookingId(id);
  }, []);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!selectedBookingId) return;
      try {
        const res = await apiFetch('/bookings/' + selectedBookingId, { skipCache: true });
        const b = res?.data;
        if (!b) return;
        setSelectedBooking(b);
        setDetailNote('');
        setEditMode(false);
        setForm({
          room_id: String(b.room_id || ''),
          check_in: b.check_in || '',
          check_out: b.check_out || '',
          guest_name: b.guest_name || '',
          guest_phone: b.guest_phone || '',
          guest_line_id: b.guest_line_id || '',
          guest_count: String(b.guest_count || 2),
          total_price: b.total_price ? String(b.total_price) : '',
          status: b.status || 'pending',
          source: b.source || 'admin',
          notes: b.notes || '',
        });
        setIsModalOpen(true);
      } catch (err: any) {
        alert(err.message || '讀取訂單失敗');
        setSelectedBookingId(null);
      }
    };
    fetchBooking();
  }, [selectedBookingId]);

  const defaultRoomId = useMemo(() => rooms[0]?.id ? String(rooms[0].id) : '', [rooms]);
  const selectedBookingIsPast = selectedBooking ? isPastBooking(selectedBooking) : false;

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const handleBookingClick = (id: number) => {
    setSelectedBookingId(id);
    window.history.replaceState(null, '', '/bookings?booking=' + id);
  };

  const openNewBooking = (roomId?: number, date?: string) => {
    window.history.replaceState(null, '', '/bookings');
    setSelectedBookingId(null);
    setSelectedBooking(null);
    setDetailNote('');
    setEditMode(true);
    setForm({
      ...emptyForm,
      room_id: roomId ? String(roomId) : defaultRoomId,
      check_in: date || '',
      check_out: date ? nextDate(date) : '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    window.history.replaceState(null, '', '/bookings');
    setIsModalOpen(false);
    setSelectedBookingId(null);
    setSelectedBooking(null);
    setSaving(false);
    setEditMode(false);
  };

  const refetchSelectedBooking = async (id: number) => {
    const res = await apiFetch('/bookings/' + id, { skipCache: true });
    if (res?.data) setSelectedBooking(res.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedBooking) {
        await apiFetch('/bookings/' + selectedBooking.id, {
          method: 'PUT',
          body: JSON.stringify({
            room_id: Number(form.room_id),
            check_in: form.check_in,
            check_out: form.check_out,
            guest_name: form.guest_name,
            guest_phone: form.guest_phone,
            guest_line_id: form.guest_line_id,
            guest_count: Number(form.guest_count),
            total_price: form.total_price ? Number(form.total_price) : undefined,
            status: form.status,
            source: form.source,
            notes: form.notes,
          }),
        });

        if (detailNote.trim()) {
          await apiFetch('/bookings/' + selectedBooking.id + '/notes', {
            method: 'POST',
            body: JSON.stringify({ content: detailNote.trim() }),
          });
        }
        setRefreshKey(key => key + 1);
        await refetchSelectedBooking(selectedBooking.id);
        setDetailNote('');
        setEditMode(false);
      } else {
        const created = await apiFetch('/bookings', {
          method: 'POST',
          body: JSON.stringify({
            room_id: Number(form.room_id),
            check_in: form.check_in,
            check_out: form.check_out,
            guest_name: form.guest_name,
            guest_phone: form.guest_phone,
            guest_line_id: form.guest_line_id,
            guest_count: Number(form.guest_count),
            notes: form.notes,
          }),
        });

        if (created?.data?.id && (form.status !== 'pending' || form.source !== 'website' || form.total_price)) {
          await apiFetch('/bookings/' + created.data.id, {
            method: 'PUT',
            body: JSON.stringify({
              status: form.status,
              source: form.source,
              total_price: form.total_price ? Number(form.total_price) : undefined,
            }),
          });
        }
        setRefreshKey(key => key + 1);
        closeModal();
      }
    } catch (err: any) {
      alert(err.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async (status: string, note: string) => {
    if (!selectedBooking) return;
    setSaving(true);
    try {
      await apiFetch('/bookings/' + selectedBooking.id, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await apiFetch('/bookings/' + selectedBooking.id + '/notes', {
        method: 'POST',
        body: JSON.stringify({ content: note }),
      });
      setRefreshKey(key => key + 1);
      closeModal();
    } catch (err: any) {
      alert(err.message || '狀態更新失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedBooking || !detailNote.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/bookings/' + selectedBooking.id + '/notes', {
        method: 'POST',
        body: JSON.stringify({ content: detailNote.trim() }),
      });
      setDetailNote('');
      await refetchSelectedBooking(selectedBooking.id);
    } catch (err: any) {
      alert(err.message || '新增備註失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBooking || !confirm('確定要刪除此訂單？此操作無法復原。')) return;
    try {
      await apiFetch('/bookings/' + selectedBooking.id, { method: 'DELETE' });
      setRefreshKey(key => key + 1);
      closeModal();
    } catch (err: any) {
      alert(err.message || '刪除失敗');
    }
  };

  const renderActions = () => {
    if (!selectedBooking) return null;
    return (
      <div className={styles.actionPanel}>
        <div>
          <h3>處理狀態</h3>
          <p>這些按鈕只更新訂單狀態並新增內部紀錄，不會修改客人填寫的資料。</p>
        </div>
        <div className={styles.actionButtons}>
          {selectedBooking.status === 'pending' && (
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => handleStatusAction('confirmed', '已查看並確認此筆訂單。')}>
              <ClipboardCheck size={18} />
              標記已確認
            </button>
          )}
          {selectedBooking.status === 'confirmed' && (
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => handleStatusAction('checked_in', '已標記為入住中。')}>
              標記已入住
            </button>
          )}
          {selectedBooking.status === 'checked_in' && (
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => handleStatusAction('checked_out', '已標記為退房。')}>
              標記已退房
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => setEditMode(true)}>
            <Pencil size={18} />
            修改訂單資料
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.viewToggle}>
          <button className={`${styles.toggleBtn} ${view === 'calendar' ? styles.active : ''}`} onClick={() => setView('calendar')}>
            <Calendar size={18} />
            行事曆
          </button>
          <button className={`${styles.toggleBtn} ${view === 'list' ? styles.active : ''}`} onClick={() => setView('list')}>
            <List size={18} />
            列表
          </button>
        </div>

        <button className="btn btn-primary" onClick={() => openNewBooking()}>
          <Plus size={18} />
          新增訂單
        </button>
      </div>

      {view === 'calendar' ? (
        <BookingCalendar refreshKey={refreshKey} onBookingClick={handleBookingClick} onDateClick={(roomId, date) => openNewBooking(roomId, date)} />
      ) : (
        <BookingList refreshKey={refreshKey} onBookingClick={handleBookingClick} />
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <button type="button" className={styles.closeButton} onClick={closeModal} aria-label="關閉">
              <X size={20} />
            </button>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>{selectedBooking ? '訂單資料' : '後台新增'}</p>
                <h2>{selectedBooking ? '訂單 #' + selectedBooking.id : '新增訂單'}</h2>
                {selectedBookingIsPast && <div className={styles.pastNotice}>此訂單日期已過，查看或修改時請先確認狀態。</div>}
              </div>
              {selectedBooking && <span className={`${styles.statusPill} ${styles['status-' + selectedBooking.status] || ''}`}>{statusLabels[selectedBooking.status] || selectedBooking.status}</span>}
            </div>

            {selectedBooking && !editMode ? (
              <div className={styles.reviewLayout}>
                {renderActions()}

                <section className={styles.detailGrid}>
                  <Info label="房客" value={selectedBooking.guest_name} />
                  <Info label="電話" value={selectedBooking.guest_phone || '未填寫'} />
                  <Info label="LINE ID" value={selectedBooking.guest_line_id || '未填寫'} />
                  <Info label="房型" value={selectedBooking.room?.name_zh || '房型 #' + selectedBooking.room_id} />
                  <Info label="入住 / 退房" value={selectedBooking.check_in + ' ~ ' + selectedBooking.check_out} />
                  <Info label="晚數" value={nights(selectedBooking.check_in, selectedBooking.check_out) + ' 晚'} />
                  <Info label="人數" value={selectedBooking.guest_count + ' 人'} />
                  <Info label="金額" value={formatMoney(selectedBooking.total_price)} />
                  <Info label="來源" value={sourceLabels[selectedBooking.source] || selectedBooking.source} />
                  <Info label="建立時間" value={formatDateTime(selectedBooking.created_at)} />
                </section>

                <section className={styles.noteBlock}>
                  <h3>客人備註</h3>
                  <p>{selectedBooking.notes || '無'}</p>
                </section>

                <section className={styles.noteBlock}>
                  <div className={styles.noteHeader}>
                    <h3>內部紀錄</h3>
                    <StickyNote size={18} />
                  </div>
                  <textarea className="input-field" rows={3} value={detailNote} onChange={(e) => setDetailNote(e.target.value)} placeholder="例如：已用 LINE 聯絡客人、已收訂金" />
                  <div className={styles.noteActions}>
                    <button type="button" className="btn btn-secondary" onClick={handleAddNote} disabled={saving || !detailNote.trim()}>新增內部紀錄</button>
                  </div>
                  {selectedBooking.internal_notes?.length > 0 ? (
                    <div className={styles.noteList}>
                      {selectedBooking.internal_notes.map((note: any) => (
                        <div key={note.id} className={styles.noteItem}>
                          <p>{note.content}</p>
                          <small>{new Date(note.created_at).toLocaleString('zh-TW')}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyNote}>尚無內部紀錄</p>
                  )}
                </section>

                <div className={styles.footerActions}>
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>關閉</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <label className="form-group">
                    <span className="form-label">房型</span>
                    <select className="input-field" value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} required>
                      <option value="">請選擇</option>
                      {rooms.map(room => <option key={room.id} value={room.id}>{room.name_zh}</option>)}
                    </select>
                  </label>
                  <label className="form-group">
                    <span className="form-label">入住日期</span>
                    <input type="date" className="input-field" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value, check_out: form.check_out || nextDate(e.target.value) })} required />
                  </label>
                  <label className="form-group">
                    <span className="form-label">退房日期</span>
                    <input type="date" className="input-field" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} required />
                  </label>
                  <label className="form-group">
                    <span className="form-label">房客姓名</span>
                    <input className="input-field" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} required />
                  </label>
                  <label className="form-group">
                    <span className="form-label">電話</span>
                    <input className="input-field" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} required />
                  </label>
                  <label className="form-group">
                    <span className="form-label">LINE ID</span>
                    <input className="input-field" value={form.guest_line_id} onChange={(e) => setForm({ ...form, guest_line_id: e.target.value })} />
                  </label>
                  <label className="form-group">
                    <span className="form-label">人數</span>
                    <input type="number" min="1" max="10" className="input-field" value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: e.target.value })} required />
                  </label>
                  <label className="form-group">
                    <span className="form-label">總金額</span>
                    <input type="number" min="0" className="input-field" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })} placeholder="可留空由 API 估算" />
                  </label>
                  <label className="form-group">
                    <span className="form-label">狀態</span>
                    <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="form-group">
                    <span className="form-label">來源</span>
                    <select className="input-field" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                      {sourceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>

                <label className="form-group">
                  <span className="form-label">備註</span>
                  <textarea className="input-field" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </label>

                {selectedBooking && (
                  <label className="form-group">
                    <span className="form-label">此次修改紀錄</span>
                    <textarea className="input-field" rows={3} value={detailNote} onChange={(e) => setDetailNote(e.target.value)} placeholder="例如：客人來電要求改日期" />
                  </label>
                )}

                <div className={styles.footerActions}>
                  <div>
                    {selectedBooking && <button type="button" className={styles.dangerButton} onClick={handleDelete}>刪除訂單</button>}
                  </div>
                  <div className={styles.footerGroup}>
                    {selectedBooking && <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>回到查看</button>}
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>取消</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '儲存中...' : '儲存'}</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function isPastBooking(booking: any) {
  if (!booking?.check_out) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(booking.check_out + 'T00:00:00') < today;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.infoItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function nextDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function nights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn + 'T00:00:00').getTime();
  const end = new Date(checkOut + 'T00:00:00').getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86400000));
}

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return 'NT$ ' + amount.toLocaleString();
}

function formatDateTime(value: string) {
  if (!value) return '未紀錄';
  return new Date(value).toLocaleString('zh-TW');
}
