'use client';

import React, { useState, useEffect } from 'react';
import styles from './BookingCalendar.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface CalendarProps {
  onBookingClick: (bookingId: string) => void;
  onDateClick: (roomId: string, date: string) => void;
}

export default function BookingCalendar({ onBookingClick, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch rooms (only the fixed 5 rooms)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await apiFetch('/rooms');
        if (res?.data) {
          setRooms(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      }
    };
    fetchRooms();
  }, []);

  // Fetch bookings for the current month
  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const startDate = `${year}-${month}-01`;
        
        // Simple trick to get last day of month
        const lastDay = new Date(year, currentDate.getMonth() + 1, 0).getDate();
        const endDate = `${year}-${month}-${lastDay}`;

        const res = await apiFetch(`/bookings?start_date=${startDate}&end_date=${endDate}&limit=100`);
        if (res?.data) {
          setCalendarData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch calendar', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate days for the current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        date,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
        dayName: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      };
    });
  };

  const days = getDaysInMonth();

  const getBookingsForRoom = (roomId: string) => {
    return calendarData.filter(b => b.room_id === roomId);
  };

  // Calculate position and width of a booking bar
  const getBookingStyle = (booking: any, daysInView: any[]) => {
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const viewStart = daysInView[0].date;
    const viewEnd = daysInView[daysInView.length - 1].date;

    // If booking is completely outside view, don't render (should be handled by API filtering mostly)
    if (checkOut <= viewStart || checkIn > viewEnd) return { display: 'none' };

    // Calculate start index (0-based) relative to current view
    let startIndex = 0;
    if (checkIn > viewStart) {
      const diffTime = Math.abs(checkIn.getTime() - viewStart.getTime());
      startIndex = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Calculate end index
    let endIndex = daysInView.length;
    if (checkOut <= viewEnd) {
      const diffTime = Math.abs(checkOut.getTime() - viewStart.getTime());
      endIndex = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const duration = endIndex - startIndex;

    return {
      left: `${(startIndex / daysInView.length) * 100}%`,
      width: `${(duration / daysInView.length) * 100}%`,
    };
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <div className={styles.monthNav}>
          <button onClick={prevMonth}><ChevronLeft size={20} /></button>
          <h2>{currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月</h2>
          <button onClick={nextMonth}><ChevronRight size={20} /></button>
        </div>
        
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles['status-confirmed']}`}></div> 已確認
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles['status-pending']}`}></div> 待確認
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles['status-checked_in']}`}></div> 已入住
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles['status-blocked']}`}></div> 封鎖
          </div>
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
          rooms.map(room => {
            const roomBookings = getBookingsForRoom(room.slug);
            return (
              <div key={room.slug} className={styles.gridRow}>
                <div className={styles.roomCell}>{room.name_zh}</div>
                <div className={styles.daysContainer}>
                  {/* Empty cells for background grid */}
                  {days.map(d => (
                    <div 
                      key={d.dateString} 
                      className={styles.dayCell}
                      onClick={() => onDateClick(room.slug, d.dateString)}
                    ></div>
                  ))}

                  {/* Absolute positioned booking bars */}
                  {roomBookings.map(booking => {
                    if (booking.status === 'cancelled' || booking.status === 'checked_out') return null;
                    const style = getBookingStyle(booking, days);
                    const statusClass = booking.status === 'blocked' ? 'status-blocked' : `status-${booking.status}`;
                    
                    return (
                      <div 
                        key={booking.id}
                        className={`${styles.bookingBar} ${styles[statusClass]}`}
                        style={style}
                        onClick={(e) => { e.stopPropagation(); onBookingClick(booking.id); }}
                      >
                        {booking.status !== 'blocked' ? booking.guest_name : '已封鎖'}
                        
                        <div className={styles.tooltip}>
                          {booking.status !== 'blocked' ? (
                            <>
                              <strong>{booking.guest_name}</strong> ({booking.guest_count}人)
                              <br/>
                              {booking.check_in} ~ {booking.check_out}
                              <br/>
                              電話: {booking.guest_phone || '無'}
                            </>
                          ) : (
                            <>
                              <strong>封鎖日期</strong>
                              <br/>
                              {booking.notes || '無原因'}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
