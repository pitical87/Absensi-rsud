export type AttendanceRecord = {
  id: string;
  type: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  distance: number;
  image: string;
};

const STORAGE_KEY = "attendance";

export function saveAttendance(record: AttendanceRecord): void {
  const data = getAttendance();
  data.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAttendance(): AttendanceRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}
