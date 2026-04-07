"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format, isSameDay, parseISO } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import Nav from "@/app/components/Nav";

// -------------------------------------------------------------------------
// 1. HELPERS & TYPES
// -------------------------------------------------------------------------
interface Booking {
  id: string;
  date_iso: string;
  booker_name: string;
  meeting_type: string;
  merged_ranges?: string;
  place_ids?: string[] | string; // legacy support
}

const safeJoinPlaces = (p: any): string => {
  if (!p) return "장소미지정";
  if (Array.isArray(p)) return p.join(", ");
  return String(p);
};

const getResolvedPlaceIds = (b: Booking): string[] => {
  if (!b.place_ids) return [];
  if (Array.isArray(b.place_ids)) return b.place_ids;
  try {
    const parsed = JSON.parse(b.place_ids as string);
    return Array.isArray(parsed) ? parsed : [b.place_ids as string];
  } catch {
    return [b.place_ids as string];
  }
};

const hhmm = (val: any) => {
  if (!val) return "";
  const s = String(val).padStart(4, "0");
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
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

  // FETCH
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("date_iso", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter for Bottom Detail
  const dayBookings = useMemo(() => {
    if (!selectedDate) return [];
    return bookings.filter((b) => isSameDay(parseISO(b.date_iso), selectedDate));
  }, [bookings, selectedDate]);

  // Calendar Tile Content (Informative Density)
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;
    const matches = bookings.filter((b) => isSameDay(parseISO(b.date_iso), date));
    if (matches.length === 0) return null;

    const displayItems = matches.slice(0, 4);
    const hasMore = matches.length > 4;

    return (
      <div className="mtWrap">
        {displayItems.map((m) => (
          <div key={m.id} className="mtItem">
            {m.booker_name}
          </div>
        ))}
        {hasMore && <div className="moreDots">...</div>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loadingWrap">
        <Nav title="예약 현황" />
        <div style={{ padding: "100px 20px", textAlign: "center", color: "#666" }}>
          데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="pageContainer">
      <Nav title="예약 현황" />

      <div className="bookingsGrid">
        {/* 수정된 부분: ref 할당 시 값을 반환하지 않도록 중괄호 사용 */}
        <section 
          ref={(el) => { calendarSectionRef.current = el; }} 
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
            <h2 className="detailDateTitle">
              {selectedDate ? format(selectedDate, "M월 d일 (EEEE)", { locale: require("date-fns/locale/ko") }) : "날짜 선택"}
            </h2>
            <p className="detailCount">총 {dayBookings.length}건의 예약</p>
          </div>

          <div className="detailList">
            {dayBookings.length === 0 ? (
              <div className="emptyState">해당 날짜에 예약이 없습니다.</div>
            ) : (
              dayBookings.map((b) => (
                <div key={b.id} className="detailCard">
                  <div className="cardTop">
                    <span className="meetingBadge">{b.meeting_type}</span>
                    <span className="bookerName">{b.booker_name}</span>
                  </div>
                  <div className="cardInfo">
                    <div className="infoRow">
                      <span className="label">장소</span>
                      <span className="val">{safeJoinPlaces(b.place_ids)}</span>
                    </div>
                    <div className="infoRow">
                      <span className="label">시간</span>
                      <span className="val">
                        {b.merged_ranges ? (
                          (JSON.parse(b.merged_ranges) as {startMin:number, endMin:number}[]).map((r, i) => (
                            <span key={i} className="timeTag">{hhmm(r.startMin)} - {hhmm(r.endMin)}</span>
                          ))
                        ) : "시간 정보 없음"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style jsx global>{`
        .pageContainer {
          min-height: 100vh;
          background: #f8fafc;
          padding-bottom: 50px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .bookingsGrid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }

        /* CALENDAR SECTION */
        .calendarSection {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .calendarSection.isActive {
          background: #111827; /* Deep Black Active */
        }

        .bigCalendarWrap {
          padding: 10px;
        }

        /* React Calendar Custom Overrides */
        .customCalendar.react-calendar {
          width: 100%;
          border: none;
          background: transparent;
        }
        .customCalendar .react-calendar__navigation {
          height: 60px;
          margin-bottom: 10px;
        }
        .customCalendar .react-calendar__navigation button {
          font-size: 1.2rem;
          font-weight: 800;
          color: #111827;
        }
        .calendarSection.isActive .customCalendar .react-calendar__navigation button {
          color: #fff;
        }

        .customCalendar .react-calendar__month-view__weekdays {
          text-transform: none;
          font-weight: 700;
          font-size: 0.85rem;
          color: #64748b;
          padding-bottom: 10px;
        }
        .calendarSection.isActive .customCalendar .react-calendar__month-view__weekdays {
          color: #94a3b8;
        }

        /* Tile Style */
        .customCalendar .react-calendar__tile {
          height: 125px; /* Dense but enough height for 4 items */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 8px 4px !important;
          border-radius: 4px;
          border: 1px solid transparent;
          position: relative;
        }
        /* Date Number Clarity */
        .customCalendar .react-calendar__tile abbr {
          font-size: 1.1rem;
          font-weight: 900;
          color: #111827;
          margin-bottom: 4px;
          z-index: 2;
        }
        .calendarSection.isActive .customCalendar .react-calendar__tile abbr {
          color: rgba(255, 255, 255, 0.9);
        }

        /* Information Density: Mini Items */
        .mtWrap {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 2px;
          overflow: hidden;
        }
        .mtItem {
          background: #f1f5f9;
          color: #334155;
          font-size: 0.65rem;
          padding: 2px 4px;
          border-radius: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
          font-weight: 600;
        }
        .calendarSection.isActive .mtItem {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .moreDots {
          font-size: 0.7rem;
          color: #94a3b8;
          text-align: center;
          line-height: 1;
        }

        /* Selection States */
        .customCalendar .react-calendar__tile--active {
          background: #3b82f6 !important;
          border-radius: 8px;
        }
        .customCalendar .react-calendar__tile--active abbr {
          color: #fff !important;
        }
        .customCalendar .react-calendar__tile--now {
          background: #f1f5f9;
        }
        .calendarSection.isActive .customCalendar .react-calendar__tile--now {
          background: rgba(255, 255, 255, 0.05);
        }

        /* DETAIL SECTION */
        .detailSection {
          padding: 30px 20px;
          transition: transform 0.3s ease;
        }
        .popEffect {
          animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .detailHeader {
          margin-bottom: 24px;
        }
        .detailDateTitle {
          font-size: 1.6rem;
          font-weight: 900;
          color: #111827;
          margin: 0;
        }
        .detailCount {
          color: #64748b;
          font-size: 0.95rem;
          margin-top: 4px;
          font-weight: 600;
        }

        .detailList {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .detailCard {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .cardTop {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .meetingBadge {
          background: #eff6ff;
          color: #3b82f6;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .bookerName {
          font-weight: 800;
          font-size: 1.1rem;
          color: #1e293b;
        }
        .cardInfo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .infoRow {
          display: flex;
          align-items: center;
        }
        .infoRow .label {
          width: 50px;
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 600;
        }
        .infoRow .val {
          font-size: 0.9rem;
          color: #334155;
          font-weight: 700;
        }
        .timeTag {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 4px;
        }

        @media (min-width: 1024px) {
          .bookingsGrid {
            grid-template-columns: 1.2fr 0.8fr;
            padding: 40px 20px;
            gap: 40px;
            align-items: start;
          }
          .calendarSection {
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </div>
  );
}
