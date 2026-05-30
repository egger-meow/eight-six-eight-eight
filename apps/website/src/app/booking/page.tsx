'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import roomsData from '@/data/rooms.json';
import styles from './booking.module.css';

function BookingForm() {
  const searchParams = useSearchParams();
  const initialRoomId = searchParams.get('room') || '';

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(initialRoomId);
  const [guests, setGuests] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);

  const room = roomsData.find(r => r.id === selectedRoom);

  useEffect(() => {
    if (checkIn && checkOut && room) {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        setTotalPrice(room.price_weekday * diffDays);
      } else {
        setTotalPrice(0);
      }
    } else {
      setTotalPrice(0);
    }
  }, [checkIn, checkOut, room]);

  const handleLineSubmit = () => {
    if (!checkIn || !checkOut || !selectedRoom) {
      alert('請填寫完整訂房資訊');
      return;
    }
    
    const message = `你好，我想預約訂房：\n房型：${room?.name_zh}\n入住：${checkIn}\n退房：${checkOut}\n人數：${guests}人\n請問是否有空房？`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://line.me/R/oaMessage/@gps2290j/?${encodedMessage}`, '_blank');
  };

  return (
    <div className={styles.bookingForm}>
      <div className={styles.formGroup}>
        <h2 className={styles.formLabel}>📅 選擇日期</h2>
        <div className={styles.inputGrid}>
          <div>
            <label htmlFor="checkIn" style={{ display: 'block', marginBottom: '0.5rem' }}>入住日期</label>
            <input 
              type="date" 
              id="checkIn" 
              className={styles.formControl} 
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="checkOut" style={{ display: 'block', marginBottom: '0.5rem' }}>退房日期</label>
            <input 
              type="date" 
              id="checkOut" 
              className={styles.formControl} 
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.formGroup}>
        <h2 className={styles.formLabel}>👥 入住人數</h2>
        <select 
          className={styles.formControl}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6].map(num => (
            <option key={num} value={num}>{num} 人</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <h2 className={styles.formLabel}>🛏️ 選擇房型</h2>
        <div className={styles.roomSelectGrid}>
          {roomsData.map((r) => (
            <div 
              key={r.id} 
              className={`${styles.roomCard} ${selectedRoom === r.id ? styles.selected : ''}`}
              onClick={() => setSelectedRoom(r.id)}
            >
              <div className={styles.roomName}>{r.name_zh}</div>
              <div className={styles.roomCapacity}>可住 {r.capacity} 人</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.summary}>
        <h3 className={styles.summaryTitle}>📋 訂房摘要</h3>
        <div className={styles.summaryRow}>
          <span>入住日期</span>
          <span>{checkIn || '尚未選擇'}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>退房日期</span>
          <span>{checkOut || '尚未選擇'}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>房型</span>
          <span>{room ? room.name_zh : '尚未選擇'}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>人數</span>
          <span>{guests} 人</span>
        </div>
        <div className={styles.totalPrice}>
          預估總價：NT$ {totalPrice.toLocaleString()}
          <p style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
            (此為平日參考價，實際金額以客服確認為準)
          </p>
        </div>
      </div>

      <button className={`btn ${styles.submitBtn}`} onClick={handleLineSubmit}>
        💬 一鍵發送至 LINE 客服確認
      </button>
      <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.875rem' }}>
        點擊將自動開啟 LINE App 並帶入您的訂房資訊
      </p>

    </div>
  );
}

export default function Booking() {
  return (
    <>
      <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '4rem 0 6rem', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>預約訂房</h1>
          <p>RESERVATION FORM</p>
        </div>
      </div>

      <section style={{ paddingBottom: '5rem' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <Suspense fallback={<div>Loading booking form...</div>}>
            <BookingForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
