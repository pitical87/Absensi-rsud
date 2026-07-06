import { TbLogin, TbLogout, TbChartPie, TbTrendingUp } from 'react-icons/tb';

interface DashboardProps {
  todayMasuk: string | null;
  todayPulang: string | null;
  dashSubText: string;
  onStartAbsen: (type: 'masuk' | 'pulang') => void;
}

export default function Dashboard({ todayMasuk, todayPulang, dashSubText, onStartAbsen }: DashboardProps) {
  const hours = new Date().getHours();
  const greeting = hours < 10 ? 'Selamat pagi' : hours < 15 ? 'Selamat siang' : 'Selamat sore';

  const history = [
    { date: 'Selasa, 16 Jun', loc: 'Kantor Pusat', masuk: '08:02', pulang: '16:12', badge: 'Hadir', cls: 'text-green-700 bg-green-50' as const },
    { date: 'Senin, 15 Jun', loc: 'Kantor Pusat', masuk: '08:17', pulang: '16:05', badge: 'Terlambat', cls: 'text-amber-800 bg-amber-50' as const },
    { date: 'Jumat, 13 Jun', loc: 'Kantor Pusat', masuk: '07:58', pulang: '16:30', badge: 'Hadir', cls: 'text-green-700 bg-green-50' as const },
  ];

  return (
    <>
      <div className="mb-5">
        <h2 className="text-base font-medium text-[var(--text-primary)]">{greeting}, Rian</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{dashSubText}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-[11px] text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
            <TbLogin size={13} /> Absen masuk
          </div>
          <div className="text-xl font-medium text-[var(--text-primary)]">{todayMasuk || '—'}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{todayMasuk ? 'Sudah absen' : 'Belum absen'}</div>
        </div>
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-[11px] text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
            <TbLogout size={13} /> Absen pulang
          </div>
          <div className="text-xl font-medium text-[var(--text-primary)]">{todayPulang || '—'}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{todayPulang ? 'Sudah absen' : 'Belum absen'}</div>
        </div>
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-[11px] text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
            <TbChartPie size={13} /> Kehadiran bulan ini
          </div>
          <div className="text-xl font-medium text-[var(--text-primary)]">98%</div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-[7px] py-[2px] rounded-[5px] bg-green-50 text-green-700 mt-1">
            <TbTrendingUp size={10} /> Di atas target
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <div
          onClick={() => onStartAbsen('masuk')}
          className="bg-[#2563EB] border border-[#2563EB] rounded-lg p-3.5 cursor-pointer flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="w-[30px] h-[30px] rounded-md bg-white/20 flex items-center justify-center shrink-0">
            <TbLogin size={15} color="#fff" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-white">Absen masuk</div>
            <div className="text-[11px] text-white/65">Catat kehadiran</div>
          </div>
        </div>
        <div
          onClick={() => onStartAbsen('pulang')}
          className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-3.5 cursor-pointer flex items-center gap-2.5 hover:bg-[#EFF6FF] hover:border-[#BFDBFE] transition-colors"
        >
          <div className="w-[30px] h-[30px] rounded-md bg-amber-50 flex items-center justify-center shrink-0">
            <TbLogout size={15} color="#B45309" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-[var(--text-primary)]">Absen pulang</div>
            <div className="text-[11px] text-[var(--text-muted)]">Selesai kerja</div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4">
        <div className="text-[13px] font-medium text-[var(--text-primary)] mb-3">Riwayat terakhir</div>
        {history.map((h, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-none last:pb-0">
            <div>
              <div className="text-[13px] font-medium text-[var(--text-primary)]">{h.date}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{h.loc}</div>
            </div>
            <div className="text-right">
              <div className="flex gap-2.5 text-xs text-[var(--text-secondary)] items-center">
                <span className="flex items-center gap-1"><TbLogin size={12} className="text-[var(--text-muted)]" /> {h.masuk}</span>
                <span className="flex items-center gap-1"><TbLogout size={12} className="text-[var(--text-muted)]" /> {h.pulang}</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-[7px] py-[2px] rounded-[5px] mt-1 ${h.cls}`}>{h.badge}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
