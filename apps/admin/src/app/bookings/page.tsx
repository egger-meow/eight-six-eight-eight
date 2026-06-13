'use client';

import React, { useState } from 'react';
import styles from './bookings.module.css';
import BookingCalendar from '@/components/BookingCalendar';
import BookingList from '@/components/BookingList';
import { Calendar, List, Plus } from 'lucide-react';

export default function BookingsPage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [newBookingData, setNewBookingData] = useState<{room_id?: string, date?: string} | null>(null);

  const handleBookingClick = (id: string) => {
    setSelectedBookingId(id);
  };

  const handleDateClick = (roomId: string, date: string) => {
    setNewBookingData({ room_id: roomId, date });
  };

  const closeModals = () => {
    setSelectedBookingId(null);
    setNewBookingData(null);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.toggleBtn} ${view === 'calendar' ? styles.active : ''}`}
            onClick={() => setView('calendar')}
          >
            <Calendar size={18} />
            行事曆
          </button>
          <button 
            className={`${styles.toggleBtn} ${view === 'list' ? styles.active : ''}`}
            onClick={() => setView('list')}
          >
            <List size={18} />
            列表
          </button>
        </div>
        
        <button 
          className="btn btn-primary"
          onClick={() => setNewBookingData({})}
        >
          <Plus size={18} />
          新增訂單
        </button>
      </div>

      {view === 'calendar' ? (
        <BookingCalendar 
          onBookingClick={handleBookingClick}
          onDateClick={handleDateClick}
        />
      ) : (
        <BookingList 
          onBookingClick={handleBookingClick}
        />
      )}

      {/* Placeholder for BookingDetailModal and BookingForm */}
      {(selectedBookingId || newBookingData) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <h2>{selectedBookingId ? '訂單詳情' : '新增訂單'}</h2>
            <p>即將實作表單與詳情...</p>
            <br/>
            <button className="btn btn-secondary" onClick={closeModals}>關閉</button>
          </div>
        </div>
      )}
    </div>
  );
}
