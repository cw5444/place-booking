"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";

// 시간 포맷 처리용 (Invalid Date 해결)
function hhmm(min: number) {
  if (min === undefined || min === null) return "00:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("date_iso", { ascending: false });
    if (!error && data) setBookings(data);
    setLoading(false);
  };

  React.useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", id);
    if (!error) fetchBookings();
    else alert("상태 변경 실패");
  };

  if (loading) return <div style={{ padding: 20 }}>로딩 중...</div>;

  return (
    <main style={{ padding: 20, maxWidth: 1000, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>📬 예약 승인 관리 (전체 목록)</h1>
      <div style={{ display: "grid", gap: 16 }}>
        {bookings.map((b) => (
          <div key={b.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
              <span style={{ 
                padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: b.status === "CONFIRMED" ? "#ecfdf5" : b.status === "CANCELED" ? "#fef2f2" : "#fffbeb",
                color: b.status === "CONFIRMED" ? "#065f46" : b.status === "CANCELED" ? "#991b1b" : "#92400e"
              }}>
                {b.status}
              </span>
              <div style={{ color: "#6b7280", fontSize: 14 }}>신청일: {new Date(b.created_at).toLocaleDateString()}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>예약 정보</div>
                <div style={{ fontSize: 18, fontWeight: 800, margin: "4px 0" }}>{b.date_iso}</div>
                <div style={{ fontWeight: 600, color: "#111827" }}>
                  {/* 시간대 표시 (Invalid Date 해결) */}
                  {(b.merged_ranges || []).map((r: any, i: number) => (
                    <span key={i} style={{ marginRight: 8 }}>{hhmm(r.start_min)} ~ {hhmm(r.end_min)}</span>
                  ))}
                </div>
                <div style={{ marginTop: 8, color: "#374151" }}>
                  <strong>장소:</strong> {Array.isArray(b.place_names) ? b.place_names.join(", ") : b.place_names || "-"}
                </div>
                <div style={{ color: "#374151" }}>
                  <strong>모임성격:</strong> {b.meeting_type || "-"}
                </div>
              </div>

              <div style={{ borderLeft: "1px solid #f3f4f6", paddingLeft: 16 }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>신청자 정보</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{b.booker_name}</div>
                <div style={{ color: "#4b5563" }}>{b.booker_phone}</div>
                {b.meeting_custom && (
                  <div style={{ marginTop: 8, padding: 8, background: "#f9fafb", borderRadius: 6, fontSize: 13 }}>
                     📝 메모: {b.meeting_custom}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
              {b.status === "PENDING" ? (
                <>
                  <button onClick={() => updateStatus(b.id, "CONFIRMED")} style={{ flex: 1, padding: "10px", background: "#111827", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>승인하기</button>
                  <button onClick={() => updateStatus(b.id, "CANCELED")} style={{ flex: 1, padding: "10px", background: "white", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 8, cursor: "pointer" }}>거절하기</button>
                </>
              ) : (
                <button onClick={() => updateStatus(b.id, "PENDING")} style={{ flex: 1, padding: "10px", background: "#f3f4f6", color: "#4b5563", border: "none", borderRadius: 8, cursor: "pointer" }}>대기 상태로 되돌리기</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
