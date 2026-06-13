'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './settings.module.css';
import { Lock, Server } from 'lucide-react';

export default function SettingsPage() {
  const { logout } = useAuth();
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [passError, setPassError] = useState('');

  // System info state
  const [sysInfo, setSysInfo] = useState<any>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await apiFetch('/system/info');
        if (res?.data) {
          setSysInfo(res.data);
        }
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
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      alert('密碼修改成功！請重新登入。');
      logout();
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

        {passError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-red)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {passError}
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label className="form-label">目前密碼</label>
            <input 
              type="password" 
              className="input-field" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">新密碼 (至少 8 個字元)</label>
            <input 
              type="password" 
              className="input-field" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="form-group">
            <label className="form-label">再次輸入新密碼</label>
            <input 
              type="password" 
              className="input-field" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '1rem', width: '100%' }}
            disabled={loadingPass}
          >
            {loadingPass ? '修改中...' : '確認修改'}
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Server size={24} color="var(--accent-gold)" />
          <h2 className={styles.sectionTitle}>系統資訊</h2>
        </div>

        {sysInfo ? (
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>API 伺服器狀態</span>
              <span className={styles.infoValue} style={{ color: 'var(--status-green)' }}>
                連線正常 (v1.0.0)
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>資料庫狀態</span>
              <span className={styles.infoValue} style={{ color: sysInfo.db_status === 'connected' ? 'var(--status-green)' : 'var(--status-red)' }}>
                {sysInfo.db_status === 'connected' ? '已連線 (PostgreSQL)' : '連線異常'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>快取狀態</span>
              <span className={styles.infoValue} style={{ color: sysInfo.redis_status === 'connected' ? 'var(--status-green)' : 'var(--status-red)' }}>
                {sysInfo.redis_status === 'connected' ? '已連線 (Redis)' : '連線異常'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>伺服器時間</span>
              <span className={styles.infoValue}>
                {new Date(sysInfo.server_time).toLocaleString('zh-TW')}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>載入中...</div>
        )}
      </div>
    </div>
  );
}
