'use client';

import React, { useEffect, useState } from 'react';
import { CalendarRange, CopyPlus, DollarSign, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import styles from './pricing.module.css';

type Room = {
  id: number;
  slug: string;
  name_zh: string;
  capacity: number;
  price_weekday: number;
  price_weekend: number;
  price_holiday: number;
};

type FestivalPeriod = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
};

type PriceDraft = Pick<Room, 'price_weekday' | 'price_weekend' | 'price_holiday'>;

type FestivalDraft = Omit<FestivalPeriod, 'id'>;

const emptyPeriod: FestivalDraft = { name: '', start_date: '', end_date: '' };

function addYear(dateString: string) {
  const date = new Date(dateString + 'T00:00:00');
  date.setFullYear(date.getFullYear() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function nextYearName(name: string) {
  return name.replace(/20\d{2}/, (year) => String(Number(year) + 1));
}

export default function PricingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PriceDraft>>({});
  const [periods, setPeriods] = useState<FestivalPeriod[]>([]);
  const [periodDrafts, setPeriodDrafts] = useState<Record<number, FestivalDraft>>({});
  const [periodForm, setPeriodForm] = useState(emptyPeriod);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);

  async function loadRooms() {
    const roomsRes = await apiFetch('/rooms', { skipCache: true });
    const roomData = roomsRes?.data || [];
    setRooms(roomData);
    setDrafts(Object.fromEntries(roomData.map((room: Room) => [room.slug, {
      price_weekday: room.price_weekday,
      price_weekend: room.price_weekend,
      price_holiday: room.price_holiday,
    }])));
  }

  async function loadPeriods() {
    try {
      const periodsRes = await apiFetch('/holiday-periods', { skipCache: true });
      const periodData = periodsRes?.data || [];
      setPeriods(periodData);
      setSetupRequired(Boolean(periodsRes?.meta?.setup_required));
      setPeriodDrafts(Object.fromEntries(periodData.map((period: FestivalPeriod) => [period.id, {
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
      }])));
    } catch (error: any) {
      setSetupRequired(true);
      setPeriods([]);
      setStatus(error.message || '節慶日期載入失敗，房型價格仍可編輯。');
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      await loadRooms();
      await loadPeriods();
    } catch (error: any) {
      setStatus(error.message || '資料載入失敗');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function updateDraft(slug: string, key: keyof PriceDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [slug]: {
        ...current[slug],
        [key]: Math.max(0, Number(value) || 0),
      },
    }));
  }

  async function saveRoom(room: Room) {
    const draft = drafts[room.slug];
    if (!draft) return;
    try {
      await apiFetch(`/rooms/${room.slug}`, {
        method: 'PUT',
        body: JSON.stringify(draft),
      });
      setStatus(`${room.name_zh} 房價已更新`);
      await loadRooms();
    } catch (error: any) {
      setStatus(error.message || '房價更新失敗');
    }
  }

  async function createPeriod(event: React.FormEvent) {
    event.preventDefault();
    try {
      const res = await apiFetch('/holiday-periods', {
        method: 'POST',
        body: JSON.stringify(periodForm),
      });
      setPeriodForm(emptyPeriod);
      setStatus(`已新增節慶日期：${res?.data?.name || periodForm.name}`);
      await loadPeriods();
    } catch (error: any) {
      setStatus(error.message || '新增節慶日期失敗');
    }
  }

  function updatePeriodDraft(id: number, key: keyof FestivalDraft, value: string) {
    setPeriodDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [key]: value,
      },
    }));
  }

  async function savePeriod(id: number) {
    const draft = periodDrafts[id];
    if (!draft) return;
    try {
      const res = await apiFetch(`/holiday-periods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(draft),
      });
      setStatus(`已更新節慶日期：${res?.data?.name || draft.name}`);
      await loadPeriods();
    } catch (error: any) {
      setStatus(error.message || '更新節慶日期失敗');
    }
  }

  async function deletePeriod(id: number) {
    if (!confirm('確定要刪除此節慶日期嗎？')) return;
    try {
      await apiFetch(`/holiday-periods/${id}`, { method: 'DELETE' });
      setStatus('節慶日期已刪除');
      await loadPeriods();
    } catch (error: any) {
      setStatus(error.message || '刪除節慶日期失敗');
    }
  }

  async function cloneNextYear() {
    if (periods.length === 0) {
      setStatus('目前沒有可複製的節慶日期。');
      return;
    }

    const existingKeys = new Set(periods.map((period) => `${period.name}|${period.start_date}|${period.end_date}`));
    const nextYearDrafts = periods
      .map((period) => ({
        name: nextYearName(period.name),
        start_date: addYear(period.start_date),
        end_date: addYear(period.end_date),
      }))
      .filter((period) => !existingKeys.has(`${period.name}|${period.start_date}|${period.end_date}`));

    try {
      let created = 0;
      for (const period of nextYearDrafts) {
        await apiFetch('/holiday-periods', { method: 'POST', body: JSON.stringify(period) });
        created += 1;
      }
      setStatus(created > 0 ? `已複製 ${created} 筆到下一年度，請確認農曆節慶日期是否需要調整。` : '下一年度節慶日期已存在。');
      await loadPeriods();
    } catch (error: any) {
      setStatus(error.message || '複製下一年度失敗');
    }
  }

  if (loading) return <div>載入中...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>房價設定</h1>
          <p>設定各房型平日、週五週六與節慶價格。節慶日期只影響價格，不會封鎖房間。</p>
        </div>
      </div>

      {status && <div className={styles.status}>{status}</div>}
      {setupRequired && <div className={styles.warning}>節慶日期資料表尚未建立。房型價格可以正常編輯；若要新增或管理節慶日期，請先套用資料庫 schema。</div>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><DollarSign size={20} /> 房型價格</h2>
        <div className={styles.roomGrid}>
          {rooms.map((room) => {
            const draft = drafts[room.slug];
            return (
              <article className={styles.roomCard} key={room.slug}>
                <h3>{room.name_zh}</h3>
                <div className={styles.roomMeta}>可住 {room.capacity} 人</div>
                <div className={styles.priceGrid}>
                  <label className="form-group"><span className="form-label">平日</span><input className="input-field" type="number" min="0" value={draft?.price_weekday ?? 0} onChange={(e) => updateDraft(room.slug, 'price_weekday', e.target.value)} /></label>
                  <label className="form-group"><span className="form-label">週五週六</span><input className="input-field" type="number" min="0" value={draft?.price_weekend ?? 0} onChange={(e) => updateDraft(room.slug, 'price_weekend', e.target.value)} /></label>
                  <label className="form-group"><span className="form-label">節慶</span><input className="input-field" type="number" min="0" value={draft?.price_holiday ?? 0} onChange={(e) => updateDraft(room.slug, 'price_holiday', e.target.value)} /></label>
                </div>
                <div className={styles.actions}><button className="btn btn-primary" type="button" onClick={() => saveRoom(room)}>儲存房價</button></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><CalendarRange size={20} /> 節慶日期</h2>
          <button className="btn btn-secondary" type="button" onClick={cloneNextYear} disabled={setupRequired || periods.length === 0}><CopyPlus size={16} /> 複製到下一年</button>
        </div>

        <form className={styles.periodForm} onSubmit={createPeriod}>
          <h3>新增節慶日期</h3>
          <div className={styles.periodGrid}>
            <label className="form-group"><span className="form-label">名稱</span><input className="input-field" value={periodForm.name} onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })} placeholder="例如：農曆春節" required /></label>
            <label className="form-group"><span className="form-label">開始日期</span><input className="input-field" type="date" value={periodForm.start_date} onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })} required /></label>
            <label className="form-group"><span className="form-label">結束日期</span><input className="input-field" type="date" value={periodForm.end_date} onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })} required /></label>
            <button className="btn btn-primary" type="submit" disabled={setupRequired}>新增</button>
          </div>
          <p className={styles.helpText}>符合這些日期的住宿晚數會使用各房型的節慶價格；其他週五、週六使用週五週六價格。複製到下一年後仍需確認農曆節慶與政府公告連假。</p>
        </form>

        <div className={styles.periodTableCard}>
          <div className={styles.tableTitle}>目前節慶日期管理</div>
          {periods.length === 0 ? (
            <p className={styles.emptyText}>目前沒有節慶日期。</p>
          ) : (
            <div className={styles.periodTable}>
              <div className={styles.periodTableHead}>名稱</div>
              <div className={styles.periodTableHead}>開始日期</div>
              <div className={styles.periodTableHead}>結束日期</div>
              <div className={styles.periodTableHead}>操作</div>
              {periods.map((period) => {
                const draft = periodDrafts[period.id] || period;
                return (
                  <React.Fragment key={period.id}>
                    <input className="input-field" value={draft.name} onChange={(e) => updatePeriodDraft(period.id, 'name', e.target.value)} />
                    <input className="input-field" type="date" value={draft.start_date} onChange={(e) => updatePeriodDraft(period.id, 'start_date', e.target.value)} />
                    <input className="input-field" type="date" value={draft.end_date} onChange={(e) => updatePeriodDraft(period.id, 'end_date', e.target.value)} />
                    <div className={styles.periodActions}>
                      <button className="btn btn-primary" type="button" onClick={() => savePeriod(period.id)}>儲存</button>
                      <button className={`btn ${styles.dangerBtn}`} type="button" onClick={() => deletePeriod(period.id)}><Trash2 size={16} /> 刪除</button>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
