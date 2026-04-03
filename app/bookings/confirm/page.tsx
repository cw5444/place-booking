"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { getBookingById, type Booking } from "@/lib/bookings";

type PlaceId = "worship" | "small1" | "small2";

const PLACE_THUMBS: Record<PlaceId, { name: string; src: string }> = {
  worship: { name: "경배실", src: "/places/worship-1.jpg" },
  small1: { name: "소모임실 1 (경배실 안쪽)", src: "/places/small1-1.jpg" },
  small2: { name: "소모임실 2 (중앙 홀)", src: "/places/small2-1.jpg" },
};

function hhmm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function safeJoinPlaces(b: Booking) {
  const anyB = b as unknown as { placeNames?: string[]; placeName?: string };

  if (Array.isArray(anyB.placeNames) && anyB.placeNames.length > 0) {
    return anyB.placeNames.join(", ");
  }
  if (typeof anyB.placeName === "string" && anyB.placeName.trim()) {
    return anyB.placeName;
  }
  return "-";
}

function safeMeetingType(b: Booking) {
  const anyB = b as unknown as { meetingType?: string; meetingCustom?: string };

  if (typeof anyB.meetingType === "string" && anyB.meetingType.trim()) {
    return anyB.meetingType;
  }
  if (typeof anyB.meetingCustom === "string" && anyB.meetingCustom.trim()) {
    return anyB.meetingCustom;
  }
  return "-";
}

function safePlaceIds(b: Booking): PlaceId[] {
  const anyB = b as unknown as { placeIds?: string[]; placeId?: string };
  const ids: string[] = [];

  if (Array.isArray(anyB.placeIds)) ids.push(...anyB.placeIds);
  if (typeof anyB.placeId === "string") ids.push(anyB.placeId);

  const uniq = Array.from(new Set(ids));
  return uniq.filter((v): v is PlaceId => v === "worship" || v === "small1" || v === "small2");
}

export default function BookingConfirmPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const bookingId = sp.get("bookingId");

  const [booking, setBooking] = React.useState<Booking | null>(null);

  React.useEffect(() => {
    if (!bookingId) return;
    setBooking(getBookingById(bookingId));
  }, [bookingId]);

  const shellStyle: React.CSSProperties = {
    padding: 24,
    maxWidth: 860,
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    color: "#111827",
  };

  const buttonStyle: React.CSSProperties = {
    borderRadius: 12,
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
  };

  if (!bookingId) {
    return (
      <main style={shellStyle}>
        <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>예약 확정</h1>
        <p style={{ color: "#6b7280", margin: "0 0 12px" }}>bookingId가 없습니다.</p>
        <button style={buttonStyle} onClick={() => router.push("/bookings/new")}>
          새 예약
        </button>
      </main>
    );
  }

  if (!booking) {
    return (
      <main style={shellStyle}>
        <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>예약 확정</h1>
        <p style={{ color: "#6b7280", margin: "0 0 12px" }}>
          예약 정보를 찾지 못했습니다. (로컬 저장소가 비었거나 다른 브라우저일 수 있어요)
        </p>
        <button style={buttonStyle} onClick={() => router.push("/bookings/new")}>
          새 예약
        </button>
      </main>
    );
  }

  const placeText = safeJoinPlaces(booking);
  const meetingText = safeMeetingType(booking);
  const placeIds = safePlaceIds(booking);

  // ✅ 예약한 장소만 렌더링
  const reservedThumbs = placeIds
    .map((pid) => ({ pid, meta: PLACE_THUMBS[pid] }))
    .filter((x) => Boolean(x.meta));

  return (
    <main style={shellStyle}>
      <h1 style={{ fontSize: 22, margin: "0 0 6px" }}>예약이 확정되었습니다</h1>
      <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 14 }}>
        예약 내용이 아래와 같이 저장되었습니다.
      </div>

      {reservedThumbs.length > 0 ? (
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 14,
            background: "white",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>선택한 공간</div>

          {/* ✅ 예약한 개수만큼만 보이도록 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(reservedThumbs.length, 3)}, minmax(0, 1fr))`,
              gap: 10,
            }}
          >
            {reservedThumbs.map(({ pid, meta }) => {
              return (
                <div
                  key={pid}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "2px solid #111827",
                    background: "#f9fafb",
                  }}
                  title={meta.name}
                >
                  <div style={{ position: "relative", width: "100%", height: 64, background: "#f3f4f6" }}>
                    <Image
                      src={meta.src}
                      alt={meta.name}
                      fill
                      sizes="(max-width: 860px) 33vw, 260px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div
                    style={{
                      padding: "8px 10px",
                      fontSize: 12,
                      color: "#374151",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {meta.name}
                  </div>
                </div>
              );
            })}
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
            <div style={{ fontWeight: 650 }}>{booking.dateISO}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
            <div style={{ color: "#6b7280" }}>예약자</div>
            <div style={{ fontWeight: 650 }}>
              {booking.name} <span style={{ color: "#9ca3af" }}>/</span> {booking.phoneDigits}
            </div>
          </div>

          <div style={{ paddingTop: 10, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ color: "#6b7280", marginBottom: 6 }}>시간</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
              {booking.merged.map((r, i) => (
                <li key={`${r.startMin}-${r.endMin}-${i}`}>
                  <strong>
                    {hhmm(r.startMin)}–{hhmm(r.endMin)}
                  </strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button style={buttonStyle} onClick={() => router.push("/bookings")}>
          예약 목록 보기
        </button>
        <button
          style={{
            ...buttonStyle,
            border: "1px solid #111827",
            background: "#111827",
            color: "white",
          }}
          onClick={() => router.push("/bookings/new")}
        >
          새 예약
        </button>
      </div>
    </main>
  );
}
