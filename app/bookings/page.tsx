"use client";

import * as React from "react";
import Link from "next/link";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "@/lib/supabaseClient";

// ✅ 헬퍼 함수들 (기존 로직 100% 유지)
function getPlaceNames(b: any): string[] {
  if (Array.isArray(b.place_names) && b.place_names.length > 0) return b.place_names;
  if (typeof b.placeName === "string" && b.placeName.trim()) return [b.placeName.trim()];
  return [];
}
function getPlaceIds(b: any): string[] {
  if (Array.isArray(b.place_ids) && b.place_ids.length > 0) return b.place_ids;
  return [];
}
function getMeetingType(b: any): string {
  return typeof b.meeting_type === "string" && b.meeting_type.trim() ? b.meeting_type.trim() : "-";
}
function thumbSrc(placeId: string) { return `/places/${placeId}-1.jpg`; }
function toISODateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function startOfTodayISO() {
  const now = new Date();
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return toISODateOnly(localMidnight);
}
function placeNameToId(name: string): string | null {
  const n = name.trim();
  if (n === "경배실") return "worship";
  if (["소모임1실", "소모임 1실", "소모임1"].includes(n)) return "small1";
  if (["소모임2실", "소모임 2실", "소모임2"].includes(n)) return "small2";
  return ["worship", "small1", "small2"].includes(n) ? n : null;
}
function getResolvedPlaceIds(b: any): string[] {
  const ids = getPlaceIds(b);
  if (ids.length > 0) return ids;
  const names = getPlaceNames(b);
  const mapped = names.map(placeNameToId).filter((x): x is string => typeof x === "string");
  return Array.from(new Set(mapped));
}

export default function BookingsPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());
  const [calendarActive, setCalendarActive] = React.useState<boolean>(true);
  const [dateFilterOn, setDateFilterOn] = React.useState<boolean>(false);
  const calendarSectionRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase.from("bookings").select("*").order("date_iso", { ascending: false });
      if (!error && data) setItems(data);
    };
    fetchAll();
  }, []);

  React.useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const root = calendarSectionRef.current;
      if (root && !root.contains(e.target as Node)) setCalendarActive(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  const selectedISO = React.useMemo(() => toISODateOnly(selectedDate), [selectedDate]);
  const todayISO = React.useMemo(() => startOfTodayISO(), []);
  const bookedISOSet = React.useMemo(() => {
    const s = new Set<string>();
    for (const b of items) if (b.date_iso) s.add(b.date_iso.slice(0, 10));
    return s;
  }, [items]);

  const meetingTypesByISO = React.useMemo(() => {
    const m = new Map<string, string[]>();
    for (const b of items) {
      const iso = b.date_iso?.slice(0, 10);
      if (!iso) continue;
      const mt = getMeetingType(b);
      const name = b.booker_name || "예약";
      const displayTitle = mt !== "-" ? mt : name;
      if (!m.has(iso)) m.set(iso, []);
      m.get(iso)!.push(displayTitle);
    }
    return m;
  }, [items]);

  const itemsForSelectedDate = React.useMemo(() => items.filter((b) => b.date_iso?.slice(0, 10) === selectedISO), [items, selectedISO]);
  const upcomingItems = React.useMemo(() => {
    const res = items.filter((b) => b.date_iso?.slice(0, 10) >= todayISO);
    return res.sort((a, b) => (a.date_iso < b.date_iso ? -1 : 1));
  }, [items, todayISO]);

  const listItems = dateFilterOn ? itemsForSelectedDate : upcomingItems;

  return (
    <main style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      {/* ✅ 잘림 방지 및 촌스러운 노란색 제거 스타일 */}
      <style jsx global>{`
        @media (min-width: 860px) { .bookingsGrid { grid-template-columns: minmax(420px, 1fr) minmax(520px, 1.2fr); } }
        .bigCalendarWrap .react-calendar { width: 100%; border: none; font-family: inherit; }
        
        /* 1. 기본 노랑/흐린 효과 강제 제거 */
        .react-calendar__tile--now { background: #f8fafc !important; color: #111827 !important; }
        .react-calendar__tile--active:enabled:hover, .react-calendar__tile--active:enabled:focus { background: #111827 !important; }

        /* 2. 칸 높이 및 폰트 최적화 (잘림 방지) */
        .bigCalendarWrap .react-calendar__tile { 
          min-height: 125px; /* 높이 약간 상향 */
          border-radius: 12px; 
          position: relative; 
          padding: 0; 
          display: flex; 
          flex-direction: column; 
          justify-content: flex-start;
          color: #111827 !important;
          border: 1px solid transparent;
        }
        
        .bigCalendarWrap .react-calendar__tile abbr { 
          position: absolute; top: 8px; left: 10px; font-size: 13px; font-weight: 800; z-index: 2;
        }

        /* 선택된 날짜 (검정) */
        .bigCalendarWrap .react-calendar__tile.isActive { background: #111827 !important; color: white !important; }
        .bigCalendarWrap .react-calendar__tile.isActive abbr { color: white !important; }

        /* 3. 리스트Wrap (여백 조정으로 잘림 해결) */
        .bigCalendarWrap .mtWrap { 
          margin-top: 30px; /* 위쪽 여백 살짝 줄임 */
          width: 100%; 
          padding: 0 4px; 
          display: flex; 
          flex-direction: column; 
          gap: 2px; /* 간격 미세 조정 */
        }
        
        /* 4. 촌스럽지 않은 무채색 아이템 */
        .bigCalendarWrap .mtPill { 
          font-size: 9.5px; /* 아주 약간 줄임 */
          font-weight: 600;
          color: #475569; 
          background: #f1f5f9; 
          border-radius: 3px; 
          padding: 1.5px 4px; 
          text-overflow: ellipsis; 
          overflow: hidden; 
          white-space: nowrap; 
          text-align: left;
          line-height: 1.1;
        }

        /* 선택된 날짜의 아이템 스타일 */
        .bigCalendarWrap .react-calendar__tile.isActive .mtPill {
          background: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.95);
        }

        .bigCalendarWrap .moreDots { font-size: 10px; color: #94a3b8; text-align: center; line-height: 1; }
        .bigCalendarWrap .react-calendar__tile.isActive .moreDots { color: white; }

        /* 예약 있는 날 테두리 (노란색 대신 연한 보라/회색) */
        .bigCalendarWrap .react-calendar__tile.hasBooking { border: 1px solid #e1e7ef !important; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>예약 현황</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDateFilterOn(false)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: !dateFilterOn ? "#111827" : "white", color: !dateFilterOn ? "white" : "black", fontWeight: 800, cursor: "pointer" }}>전체 현황</button>
          <Link href="/bookings/new" style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", textDecoration: "none", color: "black", fontWeight: 800 }}>새 예약</Link>
        </div>
      </div>

      <div className="bookingsGrid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginTop: 14 }}>
        <section ref={el => calendarSectionRef.current = el} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "white" }} onPointerDown={() => setCalendarActive(true)}>
          <div className="bigCalendarWrap">
            <Calendar
              onChange={(v: any) => { setSelectedDate(v); setCalendarActive(true); setDateFilterOn(true); }}
              value={selectedDate} locale="ko-KR"
              tileClassName={({ date }) => {
                const iso = toISODateOnly(date);
                return `${bookedISOSet.has(iso) ? "hasBooking" : ""} ${calendarActive && iso === selectedISO ? "isActive" : ""}`;
              }}
              tileContent={({ date }) => {
                const iso = toISODateOnly(date);
                const mts = meetingTypesByISO.get(iso) ?? [];
                if (mts.length === 0) return null;
                
                const displayMts = mts.slice(0, 4);
                const hasMore = mts.length > 4;

                return (
                  <div className="mtWrap">
                    {displayMts.map((t, i) => <div key={i} className="mtPill">{t}</div>)}
                    {hasMore && <div className="moreDots">...</div>}
                  </div>
                );
              }}
            />
          </div>
        </section>

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "white", minHeight: 520 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>{dateFilterOn ? "선택한 날짜 예약" : "다가오는 예약"}</div>
          <ul style={{ display: "grid", gap: 12, padding: 0, listStyle: "none" }}>
            {listItems.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: 14 }}>예약 내역이 없습니다.</p>
            ) : (
              listItems.map((b) => (
                <li key={b.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900 }}>{getPlaceNames(b).join(", ")}</div>
                      <div style={{ fontSize: 13, color: "#4b5563" }}><strong>{b.date_iso}</strong> / {getMeetingType(b)} / {b.booker_name}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
                        {getResolvedPlaceIds(b).map(pid => (
                          <img key={pid} src={thumbSrc(pid)} alt={pid} style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 8 }} 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                          />
                        ))}
                      </div>
                    </div>
                    <Link href={`/bookings/confirm?bookingId=${b.id}`} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb", textDecoration: "none", color: "black", fontWeight: 800 }}>상세</Link>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
