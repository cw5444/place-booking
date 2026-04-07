"use client";

import * as React from "react";
import Link from "next/link";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import { loadBookings, type Booking } from "@/lib/bookings";

function getPlaceNames(b: Booking): string[] {
  const anyB = b as unknown as { placeNames?: string[]; placeName?: string };
  if (Array.isArray(anyB.placeNames) && anyB.placeNames.length > 0) return anyB.placeNames;
  if (typeof anyB.placeName === "string" && anyB.placeName.trim()) return [anyB.placeName.trim()];
  return [];
}

function getPlaceIds(b: Booking): string[] {
  const anyB = b as unknown as { placeIds?: string[] };
  if (Array.isArray(anyB.placeIds) && anyB.placeIds.length > 0) return anyB.placeIds;
  return [];
}

function getMeetingType(b: Booking): string {
  const anyB = b as unknown as { meetingType?: string };
  return typeof anyB.meetingType === "string" && anyB.meetingType.trim() ? anyB.meetingType.trim() : "-";
}

function thumbSrc(placeId: string) {
  return `/places/${placeId}-1.jpg`;
}

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
  if (n === "소모임1실" || n === "소모임1실(중앙)" || n === "소모임 1실" || n === "소모임1") return "small1";
  if (n === "소모임2실" || n === "소모임2실(경배실 안쪽)" || n === "소모임 2실" || n === "소모임2") return "small2";

  if (n === "worship" || n === "small1" || n === "small2") return n;

  return null;
}

function getResolvedPlaceIds(b: Booking): string[] {
  const ids = getPlaceIds(b);
  if (ids.length > 0) return ids;

  const names = getPlaceNames(b);
  const mapped = names.map(placeNameToId).filter((x): x is string => typeof x === "string" && x.length > 0);
  return Array.from(new Set(mapped));
}

export default function BookingsPage() {
  const [items, setItems] = React.useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());

  // ✅ 달력 "active(까만선택)" UI만 켜고 끄는 플래그
  const [calendarActive, setCalendarActive] = React.useState<boolean>(true);

  // ✅ 날짜 선택 모드: true면 "그 날짜만(사진+상세)" / false면 "다가오는 예약 전체(사진없음)"
  const [dateFilterOn, setDateFilterOn] = React.useState<boolean>(false);

  const calendarSectionRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    setItems(loadBookings().slice().reverse());
  }, []);

  // ✅ 달력 바깥 클릭하면 active 해제(까만 배경만 사라짐)
  React.useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const root = calendarSectionRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setCalendarActive(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  const selectedISO = React.useMemo(() => toISODateOnly(selectedDate), [selectedDate]);
  const todayISO = React.useMemo(() => startOfTodayISO(), []);

  const bookedISOSet = React.useMemo(() => {
    const s = new Set<string>();
    for (const b of items) {
      if (typeof b.dateISO === "string" && b.dateISO.length >= 10) s.add(b.dateISO.slice(0, 10));
    }
    return s;
  }, [items]);

  const meetingTypesByISO = React.useMemo(() => {
    const m = new Map<string, string[]>();

    for (const b of items) {
      if (typeof b.dateISO !== "string" || b.dateISO.length < 10) continue;
      const iso = b.dateISO.slice(0, 10);

      const mt = getMeetingType(b);
      if (!mt || mt === "-") continue;

      if (!m.has(iso)) m.set(iso, []);
      m.get(iso)!.push(mt);
    }

    for (const [iso, arr] of m.entries()) {
      m.set(iso, Array.from(new Set(arr)));
    }

    return m;
  }, [items]);

  // ✅ 날짜 선택 모드일 때: 그 날짜 예약만
  const itemsForSelectedDate = React.useMemo(() => {
    return items.filter((b) => typeof b.dateISO === "string" && b.dateISO.slice(0, 10) === selectedISO);
  }, [items, selectedISO]);

  // ✅ 기본 모드일 때: 지난 날짜 제외하고 전부(사진 없이 가볍게)
  const upcomingItems = React.useMemo(() => {
    // ISO(YYYY-MM-DD) 문자열 비교는 날짜순 정렬/비교가 안전
    const filtered = items.filter((b) => {
      if (typeof b.dateISO !== "string" || b.dateISO.length < 10) return false;
      const iso = b.dateISO.slice(0, 10);
      return iso >= todayISO;
    });

    // 보기 편하게 날짜 오름차순(가까운 일정 먼저)
    filtered.sort((a, b) => {
      const ai = typeof a.dateISO === "string" ? a.dateISO.slice(0, 10) : "";
      const bi = typeof b.dateISO === "string" ? b.dateISO.slice(0, 10) : "";
      if (ai < bi) return -1;
      if (ai > bi) return 1;
      return 0;
    });

    return filtered;
  }, [items, todayISO]);

  const THUMB_W = 120;
  const THUMB_H = 90;

  const listMode = dateFilterOn ? "date" : "upcoming";
  const listItems = dateFilterOn ? itemsForSelectedDate : upcomingItems;

  return (
    <main style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <style jsx global>{`
        /* ✅ PC에서는 2컬럼 */
        @media (min-width: 860px) {
          .bookingsGrid {
            grid-template-columns: minmax(420px, 1fr) minmax(520px, 1.2fr);
          }
        }

        .bigCalendarWrap .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .bigCalendarWrap .react-calendar__navigation button {
          min-height: 44px;
          border-radius: 10px;
        }
        .bigCalendarWrap .react-calendar__month-view__weekdays {
          text-transform: none;
          font-weight: 700;
          color: #6b7280;
        }

        /* ✅ 타일 크게(ellipsis 줄이기) + 겹침 방지 */
        .bigCalendarWrap .react-calendar__tile {
          min-height: 120px;
          border-radius: 14px;
          position: relative;
          padding: 0;
          overflow: hidden;
        }

        .bigCalendarWrap .react-calendar__tile abbr {
          position: absolute;
          top: 8px;
          left: 10px;
          font-size: 13px;
          font-weight: 900;
          color: #111827;
          z-index: 2;
        }

        .bigCalendarWrap .mtWrap {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 8px;
          display: grid;
          gap: 6px;
          pointer-events: none;
          z-index: 1;
        }

        .bigCalendarWrap .mtPill {
          font-size: 12px;
          line-height: 1.15;
          color: #065f46;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.22);
          border-radius: 999px;
          padding: 3px 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bigCalendarWrap .mtMore {
          font-size: 12px;
          line-height: 1.15;
          color: #374151;
          background: rgba(107, 114, 128, 0.12);
          border: 1px solid rgba(107, 114, 128, 0.2);
          border-radius: 999px;
          padding: 3px 8px;
        }

        /* ✅ 예약된 날짜: 연한 보라 "테두리만" */
        .bigCalendarWrap .react-calendar__tile.hasBooking {
          background: transparent;
          box-shadow: inset 0 0 0 1.5px rgba(167, 139, 250, 0.55);
        }
        .bigCalendarWrap .react-calendar__tile.hasBooking:enabled:hover {
          box-shadow: inset 0 0 0 2px rgba(167, 139, 250, 0.85);
          background: rgba(167, 139, 250, 0.06);
        }

        /* ✅ 선택(까만 active)은 우리가 제어 */
        .bigCalendarWrap .react-calendar__tile--active {
          background: transparent !important;
          color: inherit !important;
        }
        .bigCalendarWrap .react-calendar__tile.isActive {
          background: #111827 !important;
          color: white !important;
        }
        .bigCalendarWrap .react-calendar__tile.isActive abbr {
          color: white;
        }
        .bigCalendarWrap .react-calendar__tile.isActive.hasBooking {
          box-shadow: inset 0 0 0 2px rgba(167, 139, 250, 0.95);
        }
        .bigCalendarWrap .react-calendar__tile.isActive .mtPill {
          color: #ecfdf5;
          background: rgba(16, 185, 129, 0.18);
          border-color: rgba(16, 185, 129, 0.35);
        }
        .bigCalendarWrap .react-calendar__tile.isActive .mtMore {
          color: #f9fafb;
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.22);
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>예약</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* ✅ 기본모드로 돌아가기 버튼 */}
          <button
            type="button"
            onClick={() => setDateFilterOn(false)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: listMode === "upcoming" ? "#111827" : "white",
              color: listMode === "upcoming" ? "white" : "inherit",
              fontWeight: 800,
              cursor: "pointer",
            }}
            title="다가오는 예약 전체 보기(지난 날짜 제외)"
          >
            전체 예약현황
          </button>

          <Link
            href="/bookings/new"
            style={{
              display: "inline-block",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "white",
              textDecoration: "none",
              color: "inherit",
              fontWeight: 800,
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
          >
            새 예약
          </Link>
        </div>
      </div>

      <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
        기본은 “다가오는 예약 전체(지난 날짜 제외)”가 보입니다. 달력에서 날짜를 선택하면 해당 날짜만 자세히 표시됩니다.
      </div>

      {/* ✅ 모바일 1컬럼 / PC 2컬럼 */}
      <div className="bookingsGrid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginTop: 14, alignItems: "start" }}>
        {/* LEFT: Calendar */}
        <section
          ref={(el) => {
            calendarSectionRef.current = el;
          }}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 14,
            background: "white",
          }}
          onPointerDown={() => {
            setCalendarActive(true);
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>달력</div>

          <div className="bigCalendarWrap">
            <Calendar
              onChange={(v) => {
                const d = Array.isArray(v) ? v[0] : v;
                if (d instanceof Date) {
                  setSelectedDate(d);
                  setCalendarActive(true);
                  setDateFilterOn(true); // ✅ 날짜 선택하면 그 날짜 모드로 전환
                }
              }}
              value={selectedDate}
              calendarType="gregory"
              locale="ko-KR"
              tileClassName={({ date, view }) => {
                if (view !== "month") return "";

                const iso = toISODateOnly(date);
                const classes: string[] = [];

                if (bookedISOSet.has(iso)) classes.push("hasBooking");
                if (calendarActive && iso === selectedISO) classes.push("isActive");

                return classes.join(" ");
              }}
              tileContent={({ date, view }) => {
                if (view !== "month") return null;

                const iso = toISODateOnly(date);
                if (!bookedISOSet.has(iso)) return null;

                const mts = meetingTypesByISO.get(iso) ?? [];
                if (mts.length === 0) {
                  return (
                    <div className="mtWrap" aria-label="예약 있음">
                      <div className="mtMore">예약 있음</div>
                    </div>
                  );
                }

                const shown = mts.slice(0, 2);
                const more = mts.length - shown.length;

                return (
                  <div className="mtWrap" aria-label="모임 성격">
                    {shown.map((t, i) => (
                      <div key={`${iso}-${t}-${i}`} className="mtPill" title={t}>
                        {t}
                      </div>
                    ))}
                    {more > 0 ? <div className="mtMore">+{more}</div> : null}
                  </div>
                );
              }}
            />
          </div>
        </section>

        {/* RIGHT: List */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 14,
            background: "white",
            minWidth: 0,
            // ✅ 예약 없는 날 선택해도 "쪼그라들지" 않게
            minHeight: 520,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>
              {listMode === "date" ? "선택한 날짜 예약(상세)" : "다가오는 예약"}
            </div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              {listMode === "date" ? selectedISO : `오늘(${todayISO}) 이후`}
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            {listItems.length === 0 ? (
              <div
                style={{
                  border: "1px dashed #e5e7eb",
                  borderRadius: 12,
                  padding: 18,
                  color: "#6b7280",
                  background: "#fafafa",
                }}
              >
                {listMode === "date" ? "이 날짜에는 예약이 없습니다." : "다가오는 예약이 없습니다."}
              </div>
            ) : listMode === "upcoming" ? (
              // ✅ 기본 모드: 사진 없는 컴팩트 리스트
              <ul style={{ display: "grid", gap: 10, padding: 0, listStyle: "none", margin: 0, minWidth: 0 }}>
                {listItems.map((b) => {
                  const placeNames = getPlaceNames(b);
                  const meetingType = getMeetingType(b);
                  const iso = typeof b.dateISO === "string" ? b.dateISO.slice(0, 10) : "";

                  return (
                    <li key={b.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                            <div style={{ fontWeight: 900 }}>{iso}</div>
                            <div style={{ color: "#6b7280", fontSize: 13 }}>{meetingType} / {b.name}</div>
                          </div>
                          <div style={{ marginTop: 4, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {placeNames.length ? placeNames.join(", ") : "(장소 없음)"}
                          </div>
                        </div>

                        <Link
                          href={`/bookings/confirm?bookingId=${encodeURIComponent(b.id)}`}
                          style={{
                            display: "inline-block",
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            background: "white",
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                            flex: "0 0 auto",
                          }}
                        >
                          상세
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              // ✅ 날짜 선택 모드: 사진 + 상세(기존 카드 스타일)
              <ul style={{ display: "grid", gap: 10, padding: 0, listStyle: "none", margin: 0, minWidth: 0 }}>
                {listItems.map((b) => {
                  const placeNames = getPlaceNames(b);
                  const placeIdsResolved = getResolvedPlaceIds(b);
                  const meetingType = getMeetingType(b);

                  return (
                    <li key={b.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
                        <div style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden" }}>
                          <div style={{ fontWeight: 900, wordBreak: "keep-all", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {placeNames.length ? placeNames.join(", ") : "(장소 없음)"}
                          </div>

                          <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {b.dateISO} / {meetingType} / {b.name}
                          </div>

                          {placeIdsResolved.length > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "nowrap",
                                gap: 8,
                                marginTop: 10,
                                overflowX: "auto",
                                overflowY: "hidden",
                                paddingBottom: 6,
                                minHeight: THUMB_H + 2,
                                scrollbarGutter: "stable",
                                WebkitOverflowScrolling: "touch",
                                overscrollBehaviorX: "contain",
                              }}
                              aria-label="장소 미리보기 썸네일"
                            >
                              {placeIdsResolved.map((pid) => (
                                <Link
                                  key={pid}
                                  href={`/places/${encodeURIComponent(pid)}`}
                                  style={{
                                    flex: "0 0 auto",
                                    display: "block",
                                    width: THUMB_W,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 10,
                                    overflow: "hidden",
                                    textDecoration: "none",
                                    color: "inherit",
                                    background: "#f3f4f6",
                                  }}
                                  title="클릭하면 장소 상세페이지로 이동"
                                >
                                  <img
                                    src={thumbSrc(pid)}
                                    alt={pid}
                                    style={{
                                      width: THUMB_W,
                                      height: THUMB_H,
                                      objectFit: "cover",
                                      display: "block",
                                      background: "#f3f4f6",
                                    }}
                                    onError={(e) => {
                                      const img = e.currentTarget;
                                      img.style.display = "none";
                                      const parent = img.parentElement;
                                      if (parent && !parent.querySelector("[data-noimg='1']")) {
                                        const div = document.createElement("div");
                                        div.setAttribute("data-noimg", "1");
                                        div.style.width = `${THUMB_W}px`;
                                        div.style.height = `${THUMB_H}px`;
                                        div.style.display = "grid";
                                        div.style.placeItems = "center";
                                        div.style.color = "#6b7280";
                                        div.style.fontSize = "12px";
                                        div.style.background = "#f3f4f6";
                                        div.textContent = `No Image (${pid})`;
                                        parent.appendChild(div);
                                      }
                                    }}
                                  />
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
                              장소 ID 정보가 없어 상세페이지 링크를 만들 수 없습니다. (레거시 데이터일 수 있음)
                            </div>
                          )}
                        </div>

                        <div style={{ display: "grid", gap: 8, alignContent: "start", flex: "0 0 auto", whiteSpace: "nowrap" }}>
                          <Link
                            href={`/bookings/confirm?bookingId=${encodeURIComponent(b.id)}`}
                            style={{
                              display: "inline-block",
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              background: "white",
                              fontWeight: 800,
                              flex: "0 0 auto",
                            }}
                          >
                            상세
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
