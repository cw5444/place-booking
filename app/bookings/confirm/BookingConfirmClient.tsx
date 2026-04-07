"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Supabase 연결

type PlaceId = "worship" | "small1" | "small2";

const PLACE_THUMBS: Record<PlaceId, { name: string; src: string }> = {
  worship: { name: "경배실", src: "/places/worship-1.jpg" },
  small1: { name: "소모임실 1 (경배실 안쪽)", src: "/places/small1-1.jpg" },
  small2: { name: "소모임실 2 (중앙 홀)", src: "/places/small2-1.jpg" },
};

// ✅ 시간 포맷 함수 (Invalid Date 방지 및 UI 보존)
function hhmm(min: number) {
  if (min === undefined || min === null) return "00:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ✅ 기존 UI 보존을 위한 헬퍼 함수 100% 유지 (Supabase 컬럼명 대응)
function safeJoinPlaces(b: any) {
  if (Array.isArray(b.place_names) && b.place_names.length > 0) return b.place_names.join(", ");
  if (typeof b.placeName === "string" && b.placeName.trim()) return b.placeName; // 레거시 대응
  return "-";
}

function safeMeetingType(b: any) {
  if (typeof b.meeting_type === "string" && b.meeting_type.trim()) return b.meeting_type;
  if (typeof b.meeting_custom === "string" && b.meeting_custom.trim()) return b.meeting_custom;
  return "-";
}

function safePlaceIds(b: any): PlaceId[] {
  const ids: string[] = [];
  if (Array.isArray(b.place_ids)) ids.push(...b.place_ids);
  if (typeof b.placeId === "string") ids.push(b.placeId); // 레거시 대응
  const uniq = Array.from(new Set(ids));
  return uniq.filter((v): v is PlaceId => v === "worship" || v === "small1" || v === "small2");
}

export default function BookingConfirmClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const bookingId = sp.get("bookingId");

  const [booking, setBooking] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  // ✅ 데이터 로직: Supabase 서버에서 실시간 조회
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
      if (!error && data) setBooking(data);
      setLoading(false);
    };
    fetchBooking();
  }, [bookingId]);

  const shellStyle: React.CSSProperties = {
    padding: 24, paddingBottom: 80, maxWidth: 860, margin: "0 auto",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", color: "#111827",
  };

  const buttonStyle: React.CSSProperties = {
    borderRadius: 12, padding: "10px 12px", border: "1px solid #e5e7eb", background: "white", cursor: "pointer",
  };

  if (loading) return <main style={shellStyle}><p>예약 정보를 불러오는 중...</p></main>;

  if (!bookingId || !booking) {
    return (
      <main style={shellStyle}>
        <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>예약 확정</h1>
        <p style={{ color: "#6b7280", margin: "0 0 12px" }}>예약 정보를 찾지 못했습니다.</p>
        <button style={buttonStyle} onClick={() => router.push("/bookings/new")}>새 예약</button>
      </main>
    );
  }

  const placeText = safeJoinPlaces(booking);
  const meetingText = safeMeetingType(booking);
  const placeIds = safePlaceIds(booking);
  const reservedThumbs = placeIds.map((pid) => ({ pid, meta: PLACE_THUMBS[pid] })).filter((x) => Boolean(x.meta));

  return (
    <main style={shellStyle}>
      <h1 style={{ fontSize: 22, margin: "0 0 6px" }}>예약이 확정되었습니다</h1>
      <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 14 }}>예약 내용이 아래와 같이 저장되었습니다.</div>

      {/* 썸네일 그리드 UI 보존 */}
      {reservedThumbs.length > 0 ? (
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "white", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>선택한 공간</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(reservedThumbs.length, 3)}, minmax(0, 1fr))`, gap: 10 }}>
            {reservedThumbs.map(({ pid, meta }) => (
              <div key={pid} style={{ borderRadius: 12, overflow: "hidden", border: "2px solid #111827", background: "#f9fafb" }}>
                <div style={{ position: "relative", width: "100%", height: 64, background: "#f3f4f6" }}>
                  <Image src={meta.src} alt={meta.name} fill sizes="(max-width: 860px) 33vw, 260px" style={{ objectFit: "cover" }} />
                </div>
                <div style={{ padding: "8px 10px", fontSize: 12, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.name}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, background: "white" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
            <div style={{ color: "#6b7280" }}>장소</div>
            <div style={{ fontWeight: 650 }}>{placeText}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
            <div style={{ color: "#6b7280" }}>모임 성격</div>
            <div style={{ fontWeight: 650 }}>{meetingText}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
            <div style={{ color: "#6b7280" }}>날짜</div>
            <div style={{ fontWeight: 650 }}>{booking.date_iso}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
            <div style={{ color: "#6b7280" }}>예약자</div>
            <div style={{ fontWeight: 650 }}>{booking.booker_name} <span style={{ color: "#9ca3af" }}>/</span> {booking.booker_phone}</div>
          </div>
          <div style={{ paddingTop: 10, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ color: "#6b7280", marginBottom: 6 }}>시간</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
              {(booking.merged_ranges || []).map((r: any, i: number) => (
                <li key={i}><strong>{hhmm(r.start_min)}–{hhmm(r.end_min)}</strong></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button style={buttonStyle} onClick={() => router.push("/bookings")}>예약 현황 보기</button>
        <button style={{ ...buttonStyle, border: "1px solid #111827", background: "#111827", color: "white" }} onClick={() => router.push("/bookings/new")}>새 예약</button>
      </div>
    </main>
  );
}
