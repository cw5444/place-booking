"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type BookingRecord = {
  id: string;
  place_name?: string;
  place_names?: string[]; // ✅ 추가
  place_id?: string;
  date_iso?: string;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  start_min?: number;
  end_min?: number;
  merged_ranges?: any; // ✅ 추가
  booker_name?: string;
  user_name?: string;
  // 기타 필요 필드: 이 파일에선 안전하게 Optional로 처리
  [key: string]: any;
};

export default function BookingConfirmClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId"); // URL 쿼리에 있는 bookingId를 사용
  const [booking, setBooking] = React.useState<BookingRecord | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (!error && data) {
        setBooking(data as BookingRecord);
      } else {
        setBooking(null);
      }
      setLoading(false);
    };
    fetchBooking();
  }, [bookingId]);

  const shellStyle: React.CSSProperties = {
    paddingTop: 40,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 80,
    maxWidth: 600,
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#111827",
  };

  const buttonStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: 12,
    padding: "14px",
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  };

  // 장소 표기 (수정: place_names 배열 처리 추가)
  const placeDisplay = React.useMemo(() => {
    if (Array.isArray(booking?.place_names)) return booking.place_names.join(", ");
    return booking?.place_name ?? booking?.place_id ?? "General Space";
  }, [booking]);

  // Date 표기 (date_iso 또는 booking_date 중 사용 가능)
  const dateDisplay = booking?.date_iso ?? booking?.booking_date ?? "";

  // Time 표기 (수정: merged_ranges 배열 처리 추가)
  const timeDisplay = React.useMemo(() => {
    const toHHMM = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${pad(h)}:${pad(m)}`;
    };

    if (Array.isArray(booking?.merged_ranges) && booking.merged_ranges.length > 0) {
      return booking.merged_ranges
        .map((r: any) => `${toHHMM(r.start_min)} - ${toHHMM(r.end_min)}`)
        .join(", ");
    }
    
    if (booking?.start_time || booking?.end_time) {
      const s = booking.start_time ?? "";
      const e = booking.end_time ?? "";
      return `${s} - ${e}`.trim();
    }
    
    if (booking?.start_min != null && booking?.end_min != null) {
      return `${toHHMM(booking.start_min)} - ${toHHMM(booking.end_min)}`;
    }
    
    return "-";
  }, [booking]);

  if (loading) {
    return (
      <main style={shellStyle}>
        <p>Loading...</p>
      </main>
    );
  }

  if (!bookingId || !booking) {
    return (
      <main style={shellStyle}>
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Booking not found</h2>
          <button style={{ ...buttonStyle, maxWidth: 200 }} onClick={() => router.push("/bookings")}>
            Go Back
          </button>
        </div>
      </main>
    );
  }

  // 로컬 이미지 경로 (place_id에 따라 다르게 가능)
  const imageSrcs = [
    `/places/${booking.place_id ?? "worship"}-1.jpg`,
    `/places/${booking.place_id ?? "worship"}-2.jpg`,
  ];

  return (
    <main style={shellStyle}>
      {/* 헤더 */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>
          Reservation Confirmed
        </h2>
        <div style={{ color: "#6b7280", fontSize: 14 }}>
          Your booking has been successfully saved.
        </div>
      </div>

      {/* 로컬 썸네일 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {imageSrcs.map((src, idx) => (
          <div key={idx} style={{ position: "relative", height: 180, borderRadius: 16, overflow: "hidden", border: "1px solid #f1f5f9" }}>
            <Image
              src={src}
              alt="place"
              fill
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </div>
        ))}
      </div>

      {/* 상세 정보 */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          background: "white",
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          {/* 장소 */}
          <div>
            <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>
              Place
            </label>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{placeDisplay}</div>
          </div>

          {/* 날짜/시간 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>
                Date
              </label>
              <div style={{ fontWeight: 600 }}>{dateDisplay}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>
                Time
              </label>
              <div style={{ fontWeight: 600 }}>{timeDisplay}</div>
            </div>
          </div>

          {/* 예약자 */}
          <div style={{ paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>
              Booked By
            </label>
            <div style={{ fontWeight: 600 }}>{booking.booker_name ?? booking.user_name ?? "Guest User"}</div>
          </div>
        </div>
      </section>

      {/* 버튼들 */}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button style={buttonStyle} onClick={() => router.push("/bookings")}>
          View Bookings
        </button>
        <button style={{ ...buttonStyle, background: "#111827", color: "white", border: "none" }} onClick={() => router.push("/bookings/new")}>
          New Booking
        </button>
      </div>
    </main>
  );
}
