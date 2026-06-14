'use client';

import React, { useState, useEffect } from 'react';
import styles from './BookingCalendar.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface CalendarProps {
  refreshKey: number;
  onBookingClick: (bookingId: number) => void;
  onDateClick: (roomId: number, date: string) => void;
}

interface CalendarDay {
  date: string;
  status: 'available' | 'booked' | 'blocked' | 'checked_in';
  booking: null | {
    id: number;
    guest_name: string;
    guest_count: number;
    check_in: string;
    check_out: string;
    status: string;
    source: string;
  };
  blocked_info: null | { reason: string };
}

interface CalendarRoom {
  room_id: number;
  room_slug: string;
  room_name_zh: string;
  days: CalendarDay[];
}

const statusLabels: Record<string, string> = {
  pending: '待確認',
  confirmed: '已確認',
  checked_in: '已入住',
  checked_out: '已退房',
  cancelled: '已取消',
  no_show: '未入住',
};

const sourceLabels: Record<string, string> = {
  website: '官網',
  phone: '電話',
  line: 'LINE',
  ota: 'OTA平台',
  walk_in: '現場',
  admin: '後台新增',
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export default function BookingCalendar({ refreshKey, onBookingClick, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rooms, setRooms] = useState<CalendarRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = formatDate(new Date(year, month, 1));
        const endDate = formatDate(new Date(year, month + 1, 0));
        const res = await apiFetch('/bookings/calendar?from=' + startDate + '&to=' + endDate);
        setRooms(res?.data?.rooms || []);
      } catch (err) {
        console.error('Failed to fetch calendar', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [currentDate, refreshKey]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const days = Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    return {
      date,
      dateString: formatDate(date),
      dayName: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });

  const getStatusLabel = (day: CalendarDay) => {
    if (day.status === 'blocked') return '封鎖';
    if (day.status === 'checked_in') return '入住中';
    if (day.booking) return day.booking.guest_name;
    return '';
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <div className={styles.monthNav}>
          <button onClick={prevMonth} aria-label="上一個月"><ChevronLeft size={20} /></button>
          <h2>{currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月</h2>
          <button onClick={nextMonth} aria-label="下一個月"><ChevronRight size={20} /></button>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles['status-confirmed']}`}></div> 已確認</div>
          <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles['status-pending']}`}></div> 待確認</div>
          <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles['status-checked_in']}`}></div> 已入住</div>
          <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles['status-blocked']}`}></div> 封鎖</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.gridHeader}>
          <div className={styles.roomCellHeader}>房型</div>
          {days.map(d => (
            <div key={d.dateString} className={`${styles.dateCellHeader} ${d.isWeekend ? styles.weekend : ''}`}>
              <span>{d.date.getDate()}</span>
              <span>{d.dayName}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>載入中...</div>
        ) : (
          rooms.map(room => (
            <div key={room.room_id} className={styles.gridRow}>
              <div className={styles.roomCell}>{room.room_name_zh}</div>
              <div className={styles.daysContainer}>
                {days.map(d => {
                  const day = room.days.find(item => item.date === d.dateString);
                  const statusClass = day && day.status !== 'available'
                    ? day.status === 'booked' && day.booking ? 'status-' + day.booking.status : 'status-' + day.status
                    : '';
                  return (
                    <button
                      key={d.dateString}
                      type="button"
                      className={`${styles.dayCell} ${statusClass ? styles[statusClass] : ''}`}
                      onClick={() => day?.booking ? onBookingClick(day.booking.id) : onDateClick(room.room_id, d.dateString)}
                      aria-label={day?.booking ? '查看 ' + day.booking.guest_name + ' 訂單' : day?.blocked_info?.reason || '新增訂單'}
                    >
                      <span>{day ? getStatusLabel(day) : ''}</span>
                      {day?.booking && (
                        <div className={styles.tooltip} role="tooltip">
                          <strong>{day.booking.guest_name}</strong>
                          <small>{statusLabels[day.booking.status] || day.booking.status}｜{sourceLabels[day.booking.source] || day.booking.source}</small>
                          <small>{day.booking.check_in} ~ {day.booking.check_out}</small>
                          <small>{day.booking.guest_count} 人｜點擊處理</small>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
