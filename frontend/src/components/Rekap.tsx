import { useState, useMemo } from 'react';
import { TbLogin, TbLogout } from 'react-icons/tb';

interface DayData {
  d: string;
  i: string;
  o: string;
  s: 'hadir' | 'telat' | 'izin' | 'sakit' | 'alpha';
}

interface MonthData {
  hadir: number;
  telat: number;
  izin: number;
  sakit: number;
  alpha: number;
  weeks: number[];
  days: DayData[];
}

const REKAP_DATA: Record<number, MonthData> = {
  6: {
    hadir: 19, telat: 1, izin: 0, sakit: 0, alpha: 0,
    weeks: [38, 40, 38, 38, 0],
    days: [
      { d: 'Senin, 1 Jun', i: '08:02', o: '16:10', s: 'hadir' },
      { d: 'Selasa, 2 Jun', i: '08:15', o: '16:05', s: 'hadir' },
      { d: 'Rabu, 3 Jun', i: '08:17', o: '16:08', s: 'telat' },
      { d: 'Kamis, 4 Jun', i: '08:01', o: '16:12', s: 'hadir' },
      { d: 'Jumat, 5 Jun', i: '07:58', o: '16:30', s: 'hadir' },
      { d: 'Senin, 8 Jun', i: '08:05', o: '16:10', s: 'hadir' },
      { d: 'Selasa, 9 Jun', i: '08:03', o: '16:07', s: 'hadir' },
    ],
  },
  5: {
    hadir: 20, telat: 2, izin: 1, sakit: 0, alpha: 0,
    weeks: [40, 38, 40, 36, 6],
    days: [
      { d: 'Senin, 4 Mei', i: '08:20', o: '16:05', s: 'telat' },
      { d: 'Selasa, 5 Mei', i: '08:01', o: '16:11', s: 'hadir' },
      { d: 'Rabu, 6 Mei', i: '—', o: '—', s: 'izin' },
      { d: 'Kamis, 7 Mei', i: '07:55', o: '16:09', s: 'hadir' },
    ],
  },
  4: {
    hadir: 21, telat: 0, izin: 0, sakit: 1, alpha: 0,
    weeks: [40, 40, 40, 40, 0],
    days: [
      { d: 'Senin, 7 Apr', i: '07:55', o: '16:15', s: 'hadir' },
      { d: 'Selasa, 8 Apr', i: '07:58', o: '16:10', s: 'hadir' },
      { d: 'Rabu, 9 Apr', i: '—', o: '—', s: 'sakit' },
    ],
  },
};

const STATUS_MAP: Record<string, { cls: string; lbl: string }> = {
  hadir: { cls: 'bg-green-50 text-green-700', lbl: 'Hadir' },
  telat: { cls: 'bg-amber-50 text-amber-800', lbl: 'Terlambat' },
  izin: { cls: 'bg-blue-50 text-blue-700', lbl: 'Izin' },
  sakit: { cls: 'bg-blue-50 text-blue-700', lbl: 'Sakit' },
  alpha: { cls: 'bg-red-50 text-red-700', lbl: 'Alpha' },
};

const MONTH_NAMES: Record<number, string> = {
  6: 'Juni 2026',
  5: 'Mei 2026',
  4: 'April 2026',
};

export default function Rekap() {
  const [bulan, setBulan] = useState(6);
  const data = REKAP_DATA[bulan];
  const maxW = useMemo(() => Math.max(...data.weeks, 1), [data.weeks]);
  const wkLabels = ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4', 'Mg 5'];

  return (
    <>
      <div className="mb-5">
        <h2 className="text-base font-medium text-[var(--text-primary)]">Rekap kehadiran</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">Ringkasan kehadiran bulanan Anda</p>
      </div>

      <div className="flex gap-2 mb-5">
        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          className="text-[13px] px-2.5 py-1.5 border border-[var(--border-strong)] rounded-lg bg-[var(--surface-2)] text-[var(--text-primary)] cursor-pointer"
        >
          {Object.entries(MONTH_NAMES).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-5">
        {([
          { val: data.hadir, lbl: 'Hadir', color: '' },
          { val: data.telat, lbl: 'Terlambat', color: 'text-amber-700' },
          { val: data.izin, lbl: 'Izin', color: 'text-blue-700' },
          { val: data.sakit, lbl: 'Sakit', color: 'text-blue-700' },
          { val: data.alpha, lbl: 'Alpha', color: 'text-red-700' },
        ]).map((item) => (
          <div key={item.lbl} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-3 text-center">
            <div className={`text-lg font-medium text-[var(--text-primary)] mb-0.5 ${item.color}`}>{item.val}</div>
            <div className="text-[11px] text-[var(--text-muted)]">{item.lbl}</div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 mb-4">
        <div className="text-[13px] font-medium text-[var(--text-primary)] mb-3.5">Jam kerja per minggu (jam)</div>
        <div className="flex items-end gap-1 h-[100px]">
          {data.weeks.map((h, i) => (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{h || ''}</div>
              <div
                className="w-full rounded-t-sm transition-opacity hover:opacity-80"
                style={{
                  height: Math.round((h / maxW) * 80) + 4,
                  background: h > 0 ? '#2563EB' : 'var(--border)',
                }}
              />
              <div className="text-[10px] text-[var(--text-muted)]">{wkLabels[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--border)]">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Detail harian</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-[7px] py-[2px] rounded-[5px] bg-[var(--surface-1)] text-[var(--text-secondary)]">
            {MONTH_NAMES[bulan]}
          </span>
        </div>
        {data.days.map((r, i) => {
          const st = STATUS_MAP[r.s];
          return (
            <div key={i} className="flex justify-between items-center px-4 py-2.5 border-b border-[var(--border)] last:border-none text-[13px]">
              <div>
                <div className="text-[13px] font-medium text-[var(--text-primary)]">{r.d}</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  <TbLogin size={11} className="inline" /> {r.i} &nbsp; <TbLogout size={11} className="inline" /> {r.o}
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-[7px] py-[2px] rounded-[5px] ${st.cls}`}>
                {st.lbl}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
