interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date();
  const dateStr = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div className="bg-[var(--surface-2)] border-b border-[var(--border)] px-6 h-[50px] flex items-center justify-between shrink-0">
      <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
      <span className="text-xs text-[var(--text-muted)]">{dateStr}</span>
    </div>
  );
}
