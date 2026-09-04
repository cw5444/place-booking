"use client";

function dateToISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


import React, { useState, useEffect, useRef, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  format,
  isSameDay,
  parseISO,
  eachDayOfInterval,
  startOfDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

// -------------------------------------------------------------------------
// 1. HELPERS & TYPES
// -------------------------------------------------------------------------
interface Booking {
  id: string;
  date_iso: string;
  booker_name: string;
  meeting_type: string;
  merged_ranges?: any;
  place_names?: string[] | string;
  is_blocked?: boolean; // ✅ 슬롯 차단 여부 구분을 위해 추가
}

const safeJoinPlaces = (p: any): string => {
  if (!p) return "장소미지정";
  if (Array.isArray(p)) return p.join(", ");
  return String(p);
};

const formatTimeStr = (m: any) => {
  const num = Number(m);
  if (isNaN(num)) return "00:00";
  const h = Math.floor(num / 60);
  const mm = num % 60;
  return `${String(h).padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
};

// -------------------------------------------------------------------------
// 2. MAIN COMPONENT
// -------------------------------------------------------------------------
export default function BookingsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarActive, setCalendarActive] = useState(false);
  const [dateJustChanged, setDateJustChanged] = useState(false);

  const calendarSectionRef = useRef<HTMLElement | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      // 1️⃣ 일반 예약 가져오기
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .neq("status", "CANCELED")
        .order("date_iso", { ascending: true });

      // 2️⃣ 차단된 슬롯(slots) 가져오기
      const { data: slotData } = await supabase
        .from("slots")
        .select("*, places(name)")
        .eq("status", "BLOCKED");

      // 3️⃣ 데이터 합치기 및 다중 날짜 처리
      const normalBookings = (bookingData || []).map((b: any) => ({
        ...b,
        is_blocked: false,
      }));

      const blockedSlots: Booking[] = [];
      (slotData || []).forEach((s: any) => {
        const start = new Date(s.start_at);
        const end = new Date(s.end_at);

        // 시작일부터 종료일까지 매 날짜를 순회하며 가상 데이터 생성
        const rangeDays = eachDayOfInterval({
          start: startOfDay(start),
          end: startOfDay(end),
        });

        rangeDays.forEach(day => {
          let start_min = 0;
          let end_min = 1439; // 23:59 (24*60 - 1)

          if (isSameDay(day, start)) {
            start_min = start.getHours() * 60 + start.getMinutes();
          }
          if (isSameDay(day, end)) {
            end_min = end.getHours() * 60 + end.getMinutes();
          }

          blockedSlots.push({
            id: `${s.id}-${format(day, "yyyyMMdd")}`, // 고유 키 생성
            date_iso: format(day, "yyyy-MM-dd"),
            booker_name: "사용 불가",
            meeting_type: "내부행사/점검",
            is_blocked: true,
            place_names: [s.places?.name || "지정 장소"],
            merged_ranges: [{ start_min, end_min }],
          });
        });
      });

      setBookings([...normalBookings, ...blockedSlots]);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const dayBookings = useMemo(() => {
    if (!selectedDate) return [];
    return bookings.filter(b =>
      isSameDay(parseISO(b.date_iso), selectedDate)
    );
  }, [bookings, selectedDate]);

  const tileContent = ({
    date,
    view,
  }: {
    date: Date;
    view: string;
  }) => {
    if (view !== "month") return null;
    const matches = bookings.filter(b =>
      isSameDay(parseISO(b.date_iso), date)
    );
    if (matches.length === 0) return null;

    const displayItems = matches.slice(0, 4);
    const hasMore = matches.length > 4;

    return (
      <div className="mtWrap">
        {displayItems.map(m => (
          <div
            key={m.id}
            className="mtItem"
            style={
              m.is_blocked
                ? { backgroundColor: "#fee2e2", color: "#b91c1c" }
                : {}
            }
          >
            [{m.meeting_type}] {m.booker_name}
          </div>
        ))}
        {hasMore && <div className="moreDots">...</div>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loadingWrap">
        <div
          style={{
            padding: "100px 20px",
            textAlign: "center",
            color: "#666",
          }}
        >
          데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="pageContainer">
      <div className="bookingsGrid">
        <section
          ref={calendarSectionRef}
          className={`calendarSection ${calendarActive ? "isActive" : ""}`}
        >
          <div className="bigCalendarWrap">
            <Calendar
              onChange={(v: any) => {
                setSelectedDate(v);
                setCalendarActive(true);
                setDateJustChanged(true);
                setTimeout(() => setDateJustChanged(false), 600);
              }}
              value={selectedDate}
              locale="ko-KR"
              calendarType="gregory"
              formatDay={(locale, date) => format(date, "d")}
              tileContent={tileContent}
              className="customCalendar"
            />
          </div>
        </section>

        <section className={`detailSection ${dateJustChanged ? "popEffect" : ""}`}>
          <div className="detailHeader">
            <div className="titleRow">
              <h2 className="detailDateTitle">
                {selectedDate
                  ? format(selectedDate, "M월 d일 (EEEE)", { locale: ko })
                  : "날짜 선택"}
              </h2>
            </div>
            <p className="detailCount">
              총 {dayBookings.length}건의 안내사항
            </p>
          </div>

          <div className="detailList">
            {dayBookings.length === 0 ? (
              <div className="emptyState">해당 날짜에 예약이 없습니다.</div>
            ) : (
              dayBookings.map(b => (
                <div
                  key={b.id}
                  className="detailCard"
                  style={
                    b.is_blocked
                      ? {
                          borderLeft: "6px solid #ef4444",
                          backgroundColor: "#fff5f5",
                        }
                      : {}
                  }
                >
                  <div className="cardTop">
                    <span
                      className="meetingBadge"
                      style={
                        b.is_blocked
                          ? {
                              backgroundColor: "#fee2e2",
                              color: "#dc2626",
                            }
                          : {}
                      }
                    >
                      {b.meeting_type}
                    </span>
                    <span className="bookerName">{b.booker_name}</span>
                  </div>
                  <div className="cardInfo">
                    <div className="infoRow">
                      <span className="label">장소</span>
                      <span className="val">{safeJoinPlaces(b.place_names)}</span>
                    </div>
                    <div className="infoRow">
                      <span className="label">시간</span>
                      <div
                        className="val"
                        style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                      >
                        {b.merged_ranges ? (
                          (() => {
                            try {
                              const ranges =
                                typeof b.merged_ranges === "string"
                                  ? JSON.parse(b.merged_ranges)
                                  : b.merged_ranges;

                              if (!Array.isArray(ranges)) return "시간 정보 없음";

                              return ranges.map((r: any, i: number) => (
                                <span key={i} className="timeTag">
                                  {formatTimeStr(r.start_min ?? r.startMin)} ~{" "}
                                  {formatTimeStr(r.end_min ?? r.endMin)}
                                </span>
                              ));
                            } catch (e) {
                              return "시간 정보 오류";
                            }
                          })()
                        ) : (
                          "시간 정보 없음"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <Link href={`/bookings/new${selectedDate ? `?date=${dateToISO(selectedDate)}` : ""}`} className="fabButton">


        <span className="fabIcon">+</span>
        <span className="fabText">새 예약하기</span>
      </Link>

      <style jsx global>{`
        /* 기본 레이아웃 */
        .pageContainer {
          min-height: 100vh;
          background: #f8fafc;
          padding-bottom: 50px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
          position: relative;
        }
        .bookingsGrid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }

        /* 캘린더 컨테이너 */
        .calendarSection {
          background: #fff; /* 초기 흰 배경 유지 */
          border: 1px solid #e2e8f0; /* 테두리 보이게 */
          border-bottom: none;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .calendarSection.isActive {
          background: #fff;
          border: 1px solid #e2e8f0;
        }

        .bigCalendarWrap {
          padding: 10px;
        }
        .customCalendar.react-calendar {
          width: 100%;
          border: none;
          background: transparent;
        }
        .customCalendar .react-calendar__navigation button {
          font-size: 1.2rem;
          font-weight: 800;
          color: #111827; /* 화살표·날짜 숫자 색상 유지 */
        }
        .customCalendar .react-calendar__month-view__weekdays {
          font-weight: 700;
          color: #64748b;
        }
        .customCalendar .react-calendar__tile {
          height: 125px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 8px 4px !important;
          border-radius: 4px;
        }
        .customCalendar .react-calendar__tile abbr {
          font-size: 1.1rem;
          font-weight: 900;
          color: #111827; /* 날짜 숫자 색상 유지 */
        }

        /* 오늘 날짜 색상 – 노란색 → 연한 파란‑청색 */
        .customCalendar .react-calendar__tile--now {
          background-color: #c7d2fe !important; /* 원하는 색상 */
          color: #111827 !important;
        }

        .mtWrap {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 2px;
        }
        .mtItem {
          background: #f1f5f9;
          color: #334155;
          font-size: 0.65rem;
          padding: 2px 4px;
          font-weight: 600;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
        .moreDots {
          font-size: 0.7rem;
          color: #94a3b8;
        }
        .customCalendar .react-calendar__tile--active {
          background: #3b82f6 !important;
          border-radius: 8px;
        }
        .customCalendar .react-calendar__tile--active abbr {
          color: #fff !important;
        }

        /* 상세 섹션 */
        .detailSection {
          padding: 30px 20px 100px 20px;
        }
        .popEffect {
          animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .detailDateTitle {
          font-size: 1.6rem;
          font-weight: 900;
        }
        .detailCard {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .meetingBadge {
          background: #eff6ff;
          color: #3b82f6;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 8px;
          font-weight: 700;
        }
        .bookerName {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }
        .cardTop {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .infoRow {
          display: flex;
          gap: 12px;
          margin-bottom: 6px;
          font-size: 0.9rem;
        }
        .label {
          color: #94a3b8;
          min-width: 40px;
        }
        .val {
          color: #334155;
          font-weight: 500;
        }
        .timeTag {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 4px;
          font-size: 0.8rem;
        }

        /* 플로팅 버튼 */
        .fabButton {
          position: fixed;
          bottom: 30px;
          right: 20px;
          background: #3b82f6;
          color: #fff;
          padding: 12px 24px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
          transition: all 0.2s ease;
          z-index: 100;
          font-weight: 700;
        }

        @media (min-width: 1024px) {
          .bookingsGrid {
            grid-template-columns: 1.2fr 0.8fr;
            padding: 40px 20px;
            gap: 40px;
          }
          .calendarSection {
            border: 1px solid #e2e8f0;
            border-radius: 24px;
          }
        }
      `}</style>
    </div>
  );
}
