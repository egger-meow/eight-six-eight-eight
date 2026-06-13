'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './settings.module.css';
import { Lock, Server } from 'lucide-react';

export default function SettingsPage() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [sysInfo, setSysInfo] = useState<any>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await apiFetch('/system/info');
        setSysInfo(res?.data || null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInfo();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');

    if (newPassword !== confirmPassword) {
      setPassError('新密碼與確認密碼不相符');
      return;
    }

    if (newPassword.length < 8) {
      setPassError('新密碼長度至少需要 8 個字元');
      return;
    }

    setLoadingPass(true);
    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      alert('密碼修改成功！請重新登入。');
      await logout();
    } catch (err: any) {
      setPassError(err.message || '修改密碼失敗');
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className={styles.settingsGrid}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Lock size={24} color="var(--accent-gold)" />
          <h2 className={styles.sectionTitle}>修改密碼</h2>
        </div>

        {passError && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-red)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{passError}</div>}

        <form onSubmit={handlePasswordChange}>
          <div className="form-group"><label className="form-label">目前密碼</label><input type="password" className="input-field" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">新密碼 (至少 8 個字元)</label><input type="password" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} /></div>
          <div className="form-group"><label className="form-label">再次輸入新密碼</label><input type="password" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} /></div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={loadingPass}>{loadingPass ? '修改中...' : '確認修改'}</button>
        </form>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Server size={24} color="var(--accent-gold)" />
          <h2 className={styles.sectionTitle}>系統資訊</h2>
        </div>

        {sysInfo ? (
          <div className={styles.infoList}>
            <Info label="API 版本" value={sysInfo.version || 'unknown'} />
            <Info label="Node 版本" value={sysInfo.node_version || '-'} />
            <Info label="資料庫狀態" value={sysInfo.database_status === 'connected' ? '已連線 (PostgreSQL)' : '連線異常'} ok={sysInfo.database_status === 'connected'} />
            <Info label="快取狀態" value={sysInfo.redis_status === 'connected' ? '已連線 (Redis)' : '連線異常'} ok={sysInfo.redis_status === 'connected'} />
            <Info label="房型數" value={`${sysInfo.total_rooms || 0} 間`} />
            <Info label="訂單數" value={`${sysInfo.total_bookings || 0} 筆`} />
            <Info label="圖片數" value={`${sysInfo.total_media_files || 0} 張`} />
            <Info label="媒體容量" value={`${sysInfo.storage_used_mb || 0} MB`} />
            <Info label="API 運行時間" value={`${Math.floor((sysInfo.uptime_seconds || 0) / 60)} 分鐘`} />
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>載入中...</div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue} style={ok === undefined ? undefined : { color: ok ? 'var(--status-green)' : 'var(--status-red)' }}>{value}</span>
    </div>
  );
}
