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
    setLoading(true);
    try {
      const res = await apiFetch('/rooms');
      setRooms(res?.data || []);
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
        body: JSON.stringify({
          name_zh: editingRoom.name_zh,
          name_en: editingRoom.name_en || '',
          capacity: Number(editingRoom.capacity),
          type: editingRoom.type,
          description: editingRoom.description || '',
          amenities: String(editingRoom.amenities_text || '').split('\n').map((v: string) => v.trim()).filter(Boolean),
          price_weekday: Number(editingRoom.price_weekday),
          price_weekend: Number(editingRoom.price_weekend),
          price_holiday: Number(editingRoom.price_holiday),
          available: Boolean(editingRoom.available),
          sort_order: Number(editingRoom.sort_order || 0),
        }),
      });
      setEditingRoom(null);
      fetchRooms();
    } catch (err: any) {
      alert(err.message || '更新失敗');
    }
  };

  const openEdit = (room: any) => {
    setEditingRoom({ ...room, amenities_text: (room.amenities || []).join('\n') });
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>管理民宿的固定房型。可以在此調整房價、開放狀態與設備說明。</p>
      </div>

      {loading ? <div>載入中...</div> : (
        <div className={styles.grid}>
          {rooms.map(room => (
            <div key={room.slug} className={`${styles.roomCard} ${!room.available ? styles.unavailable : ''}`}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{room.name_zh}</h2>
                  <p className={styles.cardSubtitle}>{room.name_en}</p>
                </div>
                <span className={`${styles.statusBadge} ${room.available ? styles['status-active'] : styles['status-inactive']}`}>{room.available ? '開放中' : '已關閉'}</span>
              </div>

              <div className={styles.cardBody}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <Users size={16} />
                  <span>可容納 {room.capacity} 人</span>
                  <span style={{ margin: '0 0.5rem' }}>•</span>
                  <span>{room.type}</span>
                </div>

                <div className={styles.priceGrid}>
                  <div className={styles.priceItem}><span className={styles.priceLabel}>平日價格</span><span className={styles.priceValue}>NT$ {room.price_weekday}</span></div>
                  <div className={styles.priceItem}><span className={styles.priceLabel}>假日價格</span><span className={styles.priceValue}>NT$ {room.price_weekend}</span></div>
                  <div className={styles.priceItem}><span className={styles.priceLabel}>旺日價格</span><span className={styles.priceValue}>NT$ {room.price_holiday}</span></div>
                </div>

                <div>
                  <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>提供設備</h3>
                  <div className={styles.amenities}>{(room.amenities || []).map((a: string) => <span key={a} className={styles.amenityTag}>{a}</span>)}</div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button className="btn btn-secondary" onClick={() => openEdit(room)}><Edit size={16} />編輯房型</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '680px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>編輯 {editingRoom.name_zh}</h2>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <label className="form-group"><span className="form-label">中文名稱</span><input className="input-field" value={editingRoom.name_zh} onChange={e => setEditingRoom({ ...editingRoom, name_zh: e.target.value })} required /></label>
                <label className="form-group"><span className="form-label">英文名稱</span><input className="input-field" value={editingRoom.name_en || ''} onChange={e => setEditingRoom({ ...editingRoom, name_en: e.target.value })} /></label>
                <label className="form-group"><span className="form-label">容量</span><input type="number" min="1" max="10" className="input-field" value={editingRoom.capacity} onChange={e => setEditingRoom({ ...editingRoom, capacity: e.target.value })} required /></label>
                <label className="form-group"><span className="form-label">房型類型</span><select className="input-field" value={editingRoom.type} onChange={e => setEditingRoom({ ...editingRoom, type: e.target.value })}><option value="double">雙人房</option><option value="quad">四人房</option><option value="suite">套房</option></select></label>
                <label className="form-group"><span className="form-label">平日價格</span><input type="number" min="0" className="input-field" value={editingRoom.price_weekday} onChange={e => setEditingRoom({ ...editingRoom, price_weekday: e.target.value })} required /></label>
                <label className="form-group"><span className="form-label">假日價格</span><input type="number" min="0" className="input-field" value={editingRoom.price_weekend} onChange={e => setEditingRoom({ ...editingRoom, price_weekend: e.target.value })} required /></label>
                <label className="form-group"><span className="form-label">旺日價格</span><input type="number" min="0" className="input-field" value={editingRoom.price_holiday} onChange={e => setEditingRoom({ ...editingRoom, price_holiday: e.target.value })} required /></label>
                <label className="form-group"><span className="form-label">是否開放預訂</span><select className="input-field" value={editingRoom.available ? 'true' : 'false'} onChange={e => setEditingRoom({ ...editingRoom, available: e.target.value === 'true' })}><option value="true">是</option><option value="false">否</option></select></label>
              </div>
              <label className="form-group"><span className="form-label">描述</span><textarea className="input-field" rows={4} value={editingRoom.description || ''} onChange={e => setEditingRoom({ ...editingRoom, description: e.target.value })} /></label>
              <label className="form-group"><span className="form-label">設備（一行一項）</span><textarea className="input-field" rows={6} value={editingRoom.amenities_text} onChange={e => setEditingRoom({ ...editingRoom, amenities_text: e.target.value })} /></label>
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
