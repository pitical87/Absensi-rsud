import { TbShieldCheck, TbLayoutDashboard, TbFingerprint, TbChartBar } from 'react-icons/tb';

type Page = 'dashboard' | 'absen' | 'rekap';

interface SidebarProps {
  page: Page;
  onChangePage: (p: Page) => void;
}

export default function Sidebar({ page, onChangePage }: SidebarProps) {
  const items: { key: Page; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <TbLayoutDashboard size={15} /> },
    { key: 'absen', label: 'Absensi', icon: <TbFingerprint size={15} /> },
    { key: 'rekap', label: 'Rekap', icon: <TbChartBar size={15} /> },
  ];

  return (
    <aside className="bg-[var(--surface-2)] border-r border-[var(--border)] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-[18px] border-b border-[var(--border)]">
        <div className="w-[26px] h-[26px] bg-[#2563EB] rounded-md flex items-center justify-center shrink-0">
          <TbShieldCheck size={14} color="#fff" />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)]">SIAPPS</span>
      </div>
      <nav className="flex-1 py-2.5">
        {items.map((item) => (
          <div
            key={item.key}
            onClick={() => onChangePage(item.key)}
            className={`flex items-center gap-[9px] px-4 py-2 text-[13px] cursor-pointer rounded-none ${
              page === item.key
                ? 'bg-[#EFF6FF] text-[#2563EB] font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="px-4 py-[14px] border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[11px] font-medium text-[#2563EB] shrink-0">
            RP
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--text-primary)]">Seseorang
              
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">Analis Politik</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
