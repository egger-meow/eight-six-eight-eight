'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './rooms.module.css';
import { Edit, Users } from 'lucide-react';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const fetchRooms = async () => {
    try {
      const res = await apiFetch('/rooms?include_unavailable=true');
      if (res?.data) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/rooms/${editingRoom.slug}`, {
        method: 'PUT',
        body: JSON.stringify(editingRoom),
      });
      setEditingRoom(null);
      fetchRooms(); // refresh list
    } catch (err) {
      alert('更新失敗');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          管理民宿的 5 個固定房型。可以在此調整房價與設備說明。
        </p>
      </div>

      {loading ? (
        <div>載入中...</div>
      ) : (
        <div className={styles.grid}>
          {rooms.map(room => (
            <div key={room.slug} className={`${styles.roomCard} ${!room.is_available ? styles.unavailable : ''}`}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{room.name_zh}</h2>
                  <p className={styles.cardSubtitle}>{room.name_en}</p>
                </div>
                <span className={`${styles.statusBadge} ${room.is_available ? styles['status-active'] : styles['status-inactive']}`}>
                  {room.is_available ? '開放中' : '已關閉'}
                </span>
              </div>
              
              <div className={styles.cardBody}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <Users size={16} />
                  <span>可容納 {room.capacity} 人</span>
                  <span style={{ margin: '0 0.5rem' }}>•</span>
                  <span>{room.type}</span>
                </div>

                <div className={styles.priceGrid}>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>平日價格</span>
                    <span className={styles.priceValue}>NT$ {room.base_price_weekday}</span>
                  </div>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>假日價格</span>
                    <span className={styles.priceValue}>NT$ {room.base_price_weekend}</span>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>提供設備</h3>
                  <div className={styles.amenities}>
                    {room.amenities.map((a: string, i: number) => (
                      <span key={i} className={styles.amenityTag}>{a}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setEditingRoom({...room})}
                >
                  <Edit size={16} />
                  編輯房型
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal Placeholder */}
      {editingRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>編輯 {editingRoom.name_zh}</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">中文名稱</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editingRoom.name_zh} 
                  onChange={e => setEditingRoom({...editingRoom, name_zh: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">平日價格</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={editingRoom.base_price_weekday} 
                    onChange={e => setEditingRoom({...editingRoom, base_price_weekday: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">假日價格</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={editingRoom.base_price_weekend} 
                    onChange={e => setEditingRoom({...editingRoom, base_price_weekend: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">是否開放預訂</label>
                <select 
                  className="input-field"
                  value={editingRoom.is_available ? 'true' : 'false'}
                  onChange={e => setEditingRoom({...editingRoom, is_available: e.target.value === 'true'})}
                >
                  <option value="true">是 (開放)</option>
                  <option value="false">否 (關閉)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingRoom(null)}>取消</button>
                <button type="submit" className="btn btn-primary">儲存變更</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
