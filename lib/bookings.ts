export type Booking = {
  id: string;

  // 단일 → 복수
  placeIds: string[];
  placeNames: string[];

  // ✅ 추가: 모임 형식(예: 예배, 기도회, 회의, 한국어교실, 악기레슨, 기타: ...)
  meetingType: string;

  dateISO: string;
  slots: Array<{ startMin: number; endMin: number }>;
  merged: Array<{ startMin: number; endMin: number }>;

  name: string;
  phoneDigits: string;
  createdAtISO: string;
};

const LS_KEY = "church_bookings_v1";

export function loadBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // ✅ 하위호환: 예전 데이터( meetingType 없음 )도 깨지지 않게 기본값 주입
    return (parsed as Array<Partial<Booking>>).map((b) => ({
      id: String(b.id ?? ""),
      placeIds: Array.isArray(b.placeIds) ? (b.placeIds as string[]) : [],
      placeNames: Array.isArray(b.placeNames) ? (b.placeNames as string[]) : [],

      meetingType: typeof b.meetingType === "string" ? b.meetingType : "",

      dateISO: String(b.dateISO ?? ""),
      slots: Array.isArray(b.slots) ? (b.slots as Booking["slots"]) : [],
      merged: Array.isArray(b.merged) ? (b.merged as Booking["merged"]) : [],

      name: String(b.name ?? ""),
      phoneDigits: String(b.phoneDigits ?? ""),
      createdAtISO: String(b.createdAtISO ?? ""),
    })) as Booking[];
  } catch {
    return [];
  }
}

export function saveBookings(bookings: Booking[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(bookings));
}

export function addBooking(newBooking: Booking) {
  const all = loadBookings();
  all.push(newBooking);
  saveBookings(all);
  return newBooking;
}

export function getBookingById(id: string): Booking | null {
  const all = loadBookings();
  return all.find((b) => b.id === id) ?? null;
}
