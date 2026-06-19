'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Bell, ClipboardCopy, History, Link as LinkIcon, RefreshCcw, ShieldCheck } from 'lucide-react';
import styles from './line.module.css';

type LineAdmin = {
  id: number;
  line_user_id: string;
  display_name: string | null;
  role: 'owner' | 'developer';
  active: boolean;
  valid_line_user_id: boolean;
  notification_eligible: boolean;
  bound_at: string;
  last_seen_at: string | null;
};

type Delivery = {
  id: number;
  event_id: number;
  event_type: string;
  aggregate_type: string;
  aggregate_id: number;
  channel: 'line' | 'email';
  status: string;
  attempts: number;
  next_attempt_at: string;
  sent_at: string | null;
  last_error: string | null;
  created_at: string;
};

type AuditLog = {
  id: number;
  line_admin_id: number;
  line_user_id: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  detail: unknown;
  created_at: string;
};

export default function LineAdminPage() {
  const [admins, setAdmins] = useState<LineAdmin[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [role, setRole] = useState<'owner' | 'developer'>('developer');
  const [bindingCode, setBindingCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const failedDeliveries = useMemo(() => deliveries.filter((item) => item.status !== 'sent'), [deliveries]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsRes, deliveriesRes, auditRes] = await Promise.all([
        apiFetch('/line/admin/admins', { skipCache: true }),
        apiFetch('/line/admin/notification-deliveries', { skipCache: true }),
        apiFetch('/line/admin/audit-logs', { skipCache: true }),
      ]);
      setAdmins(adminsRes?.data || []);
      setDeliveries(deliveriesRes?.data || []);
      setAuditLogs(auditRes?.data || []);
    } catch (error: any) {
      setMessage(error.message || '讀取 LINE 管理資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const createBindingCode = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await apiFetch('/line/admin/binding-codes', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      setBindingCode(res.data);
      setMessage('已建立一次性綁定碼。請在 LINE 對話中送出此代碼。');
    } catch (error: any) {
      setMessage(error.message || '建立綁定碼失敗');
    } finally {
      setSaving(false);
    }
  };

  const copyBindingCode = async () => {
    if (!bindingCode) return;
    await navigator.clipboard.writeText(bindingCode.code).catch(() => undefined);
    setMessage('綁定碼已複製。');
  };

  const revokeDeveloper = async (admin: LineAdmin) => {
    if (admin.role === 'owner') return;
    if (!confirm(`確定停用 ${admin.display_name || admin.line_user_id} 的 LINE developer 權限？`)) return;
    setSaving(true);
    try {
      await apiFetch(`/line/admin/admins/${admin.id}/revoke`, { method: 'PUT' });
      await loadData();
    } catch (error: any) {
      setMessage(error.message || '停用失敗');
    } finally {
      setSaving(false);
    }
  };

  const retryDelivery = async (delivery: Delivery) => {
    setSaving(true);
    setMessage('');
    try {
      await apiFetch(`/line/admin/notification-deliveries/${delivery.id}/retry`, { method: 'PUT' });
      setMessage('已排入立即重試。');
      await loadData();
    } catch (error: any) {
      setMessage(error.message || '重試失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>LINE 管理</h1>
          <p>建立管理員綁定碼、檢查通知配送狀態，並追蹤 LINE 操作紀錄。</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} disabled={loading || saving}>
          <RefreshCcw size={16} /> 重新整理
        </button>
      </div>

      {message && <div className={styles.empty}>{message}</div>}

      <div className={styles.grid}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2><LinkIcon size={18} /> 綁定管理員</h2>
          </div>
          <p className={styles.muted}>綁定碼有時效且只能使用一次。Owner 權限不可在此頁停用，developer 權限可隨時撤銷。</p>
          <div className={styles.formRow} style={{ marginTop: '1rem' }}>
            <select className={styles.select} value={role} onChange={(event) => setRole(event.target.value as 'owner' | 'developer')}>
              <option value="developer">developer 臨時權限</option>
              <option value="owner">owner 永久權限</option>
            </select>
            <button className="btn btn-primary" onClick={createBindingCode} disabled={saving}>
              建立綁定碼
            </button>
          </div>
          {bindingCode && (
            <div className={styles.codeBox}>
              <div>{bindingCode.code}</div>
              <div className={styles.meta} style={{ marginTop: '0.5rem' }}>到期：{formatDateTime(bindingCode.expires_at)}</div>
              <button className="btn btn-secondary" onClick={copyBindingCode} style={{ marginTop: '0.75rem' }}>
                <ClipboardCopy size={16} /> 複製代碼
              </button>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2><ShieldCheck size={18} /> 已綁定管理員</h2>
          </div>
          {admins.length === 0 ? <div className={styles.empty}>尚未綁定 LINE 管理員。</div> : (
            <div className={styles.list}>
              {admins.map((admin) => (
                <div className={styles.item} key={admin.id}>
                  <div>
                    <strong>{admin.display_name || admin.line_user_id}</strong>
                    <div className={styles.meta}>
                      <span className={`${styles.pill} ${admin.active ? styles.pillOk : styles.pillBad}`}>{admin.active ? '啟用' : '停用'}</span>
                      <span className={`${styles.pill} ${admin.role === 'owner' ? styles.pillOk : styles.pillWarn}`}>{admin.role}</span>
                      <span className={`${styles.pill} ${admin.notification_eligible ? styles.pillOk : styles.pillBad}`}>{admin.notification_eligible ? '可接收通知' : '不可接收通知'}</span>
                      {!admin.valid_line_user_id && <span>LINE User ID 格式無效，請用一次性綁定碼重新綁定。</span>}
                      <span>綁定：{formatDateTime(admin.bound_at)}</span>
                      <span>最後使用：{admin.last_seen_at ? formatDateTime(admin.last_seen_at) : '尚無'}</span>
                    </div>
                  </div>
                  {admin.role !== 'owner' && admin.active && (
                    <button className="btn btn-secondary" onClick={() => revokeDeveloper(admin)} disabled={saving}>停用</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className={styles.fullSection}>
        <div className={styles.sectionHeader}>
          <h2><Bell size={18} /> 通知配送</h2>
          <span className={`${styles.pill} ${failedDeliveries.length ? styles.pillWarn : styles.pillOk}`}>{failedDeliveries.length ? `${failedDeliveries.length} 筆需處理` : '全部正常'}</span>
        </div>
        {deliveries.length === 0 ? <div className={styles.empty}>尚無通知配送紀錄。</div> : (
          <table className={styles.table}>
            <thead><tr><th>頻道</th><th>事件</th><th>狀態</th><th>嘗試</th><th>時間</th><th>錯誤</th><th>操作</th></tr></thead>
            <tbody>
              {deliveries.map((item) => (
                <tr key={item.id}>
                  <td>{item.channel}</td>
                  <td>{item.event_type} #{item.aggregate_id}</td>
                  <td><StatusPill status={item.status} /></td>
                  <td>{item.attempts}</td>
                  <td>{item.sent_at ? `已送出 ${formatDateTime(item.sent_at)}` : `下次 ${formatDateTime(item.next_attempt_at)}`}</td>
                  <td className={styles.errorText}>{item.last_error || '-'}</td>
                  <td>{item.status !== 'sent' && <button className="btn btn-secondary" onClick={() => retryDelivery(item)} disabled={saving}>重試</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.fullSection}>
        <div className={styles.sectionHeader}>
          <h2><History size={18} /> LINE 操作紀錄</h2>
        </div>
        {auditLogs.length === 0 ? <div className={styles.empty}>尚無 LINE 操作紀錄。</div> : (
          <table className={styles.table}>
            <thead><tr><th>時間</th><th>管理員</th><th>動作</th><th>對象</th><th>內容</th></tr></thead>
            <tbody>
              {auditLogs.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.created_at)}</td>
                  <td>{item.role} #{item.line_admin_id}</td>
                  <td>{item.action}</td>
                  <td>{item.entity_type}{item.entity_id ? ` #${item.entity_id}` : ''}</td>
                  <td>{formatDetail(item.detail)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls = status === 'sent' ? styles.pillOk : status === 'failed' ? styles.pillBad : styles.pillWarn;
  const label: Record<string, string> = { sent: '已送出', failed: '失敗', retrying: '重試中', pending: '待處理', processing: '處理中' };
  return <span className={`${styles.pill} ${cls}`}>{label[status] || status}</span>;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-TW', { hour12: false });
}

function formatDetail(value: unknown) {
  if (!value) return '-';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return '-';
  }
}
