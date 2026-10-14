export function GetCurrentDateString(): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function GetGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Selamat Pagi";
  } else if (hour < 18) {
    return "Selamat Siang";
  } else {
    return "Selamat Malam";
  }
}

export function GetRandomGreeting(): string {
  const morningGreetings = [
    "Semoga harimu menyenangkan.",
    "Semoga aktivitas hari ini berjalan lancar.",
    "Selamat memulai aktivitas hari ini.",
    "Semoga hari ini penuh semangat dan produktivitas.",
    "Awali hari dengan semangat baru.",
    "Semoga semua pekerjaanmu berjalan dengan baik.",
    "Mari mulai hari dengan penuh optimisme.",
    "Semoga hari ini membawa hasil yang terbaik.",
    "Semoga kesehatan dan semangat selalu menyertaimu.",
    "Jangan lupa lakukan absen masuk.",
  ];

  const afternoonGreetings = [
    "Semoga aktivitasmu tetap berjalan lancar.",
    "Tetap semangat menjalani aktivitas hari ini.",
    "Semoga pekerjaanmu selesai sesuai rencana.",
    "Luangkan waktu untuk beristirahat sejenak jika diperlukan.",
    "Semoga produktivitasmu tetap terjaga.",
    "Terus berikan yang terbaik hari ini.",
    "Jangan lupa menjaga kesehatan di sela aktivitas.",
    "Semoga harimu tetap menyenangkan.",
    "Terima kasih atas dedikasimu hari ini.",
    "Semoga semua target hari ini tercapai.",
  ];

  const eveningGreetings = [
    "Tetap semangat menyelesaikan aktivitas hari ini.",
    "Semoga pekerjaanmu berjalan dengan baik hingga selesai.",
    "Jangan lupa lakukan absen pulang.",
    "Terima kasih atas kerja kerasmu hari ini.",
    "Semoga perjalanan pulangmu aman dan lancar.",
    "Semoga sisa harimu tetap menyenangkan.",
    "Selesaikan hari ini dengan hasil terbaik.",
    "Semoga semua tugas hari ini telah terselesaikan.",
    "Tetap jaga kesehatan dan semangat.",
    "Sampai jumpa di hari berikutnya.",
  ];

  const nightGreetings = [
    "Selamat beristirahat.",
    "Terima kasih atas kerja kerasmu hari ini.",
    "Semoga malam ini memberikan waktu istirahat yang berkualitas.",
    "Jaga kesehatan dan istirahat yang cukup.",
    "Semoga esok menjadi hari yang lebih baik.",
    "Sampai jumpa di hari berikutnya.",
    "Semoga malammu menyenangkan.",
    "Terima kasih telah menyelesaikan aktivitas hari ini.",
    "Nikmati waktu istirahat bersama keluarga.",
    "Semoga harimu berakhir dengan baik.",
  ];

  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) {
    return randomItem(morningGreetings);
  }

  if (hour >= 11 && hour < 15) {
    return randomItem(afternoonGreetings);
  }

  if (hour >= 15 && hour < 18) {
    return randomItem(eveningGreetings);
  }

  return randomItem(nightGreetings);
}

function randomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function GetCurrentTime(): string {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GetTodayKey(): string {
  const d = new Date();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const tanggal = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${tanggal}`;
}

export type WeekDay = {
  tanggal: string;
  hari: string;
  label: string;
};

export function GetWeekDays(): WeekDay[] {
  const days: WeekDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tanggal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const hari = new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(
      d,
    );
    const label = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(d);
    days.push({ tanggal, hari, label });
  }
  return days;
}

export type ShiftLintas = {
  jam_masuk: string;
  jam_pulang: string;
  kategori?: string;
  lintas_hari?: boolean;
};

/**
 * Shift lintas hari (pulang keesokan hari). Pakai flag backend bila ada,
 * kalau tidak deteksi dari jam (jam_pulang <= jam_masuk) atau kategori Malam.
 */
export function isShiftLintasHari(
  shift: ShiftLintas | null | undefined,
): boolean {
  if (!shift) return false;
  return (
    shift.lintas_hari === true ||
    shift.jam_pulang <= shift.jam_masuk ||
    shift.kategori === "Malam"
  );
}

const GRACE_LINTAS_JAM = 4; //batas lupa untuk shift yang lintas hari 4 jam setelah jam pulang

export function isSesiTerlupakan(
  openSession: {
    tanggal: string;
    jam_masuk: string;
  } | null,
  shift: ShiftLintas | null | undefined,
  todayKey: string = GetTodayKey(),
): boolean {
  if (!openSession) return false;
  if (openSession.tanggal >= todayKey) return false; // sesi hari ini -> pulang manual tetap boleh
  if (!shift) return false; // tanpa info shift (sesi tanggal itu) -> jangan kunci tombol pulang

  const expected = new Date(`${openSession.tanggal}T${shift.jam_pulang}:00`);
  if (isShiftLintasHari(shift)) {
    expected.setDate(expected.getDate() + 1); // berakhir keesokan hari
    expected.setHours(expected.getHours() + GRACE_LINTAS_JAM); // + grace 4 jam
  }

  return new Date().getTime() > expected.getTime();
}
