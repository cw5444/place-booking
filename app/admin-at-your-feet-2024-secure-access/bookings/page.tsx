"use client";

import * as React from "react";
import { useSupabase } from "../../auth/provider";
import { useRouter } from "next/navigation";

function hhmm(min: number) {
  if (min === undefined || min === null) return "00:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function AdminBookingsPage() {
  const { supabase, session } = useSupabase();
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  // 기존 fetchBookings 로직 유지
  const fetchBookings = React.useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("date_iso", { ascending: false });
    if (!error && data) setBookings(data);
    setLoading(false);
  }, [supabase, session]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ✅ 핵심 기능 1: 상태 업데이트 (승인/거절)
  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", id);
    if (!error) fetchBookings();
    else alert("상태 변경 실패");
  };

  if (!session && loading) {
    return <div style={{ padding: 20 }}>관리 권한 확인 중...</div>;
  }

  return (
    <main style={{ padding: 20, maxWidth: 1000, margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: 10, fontSize: 13, color: "#666" }}>
        접속계정: {session?.user?.email} (Admin)
      </div>
      
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>📬 예약 승인 관리</h1>

      {/* ✅ 핵심 기능 2: 슬롯 관리 이동 버튼 (그대로 유지) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", padding: "16px", backgroundColor: "#fef2f2", borderRadius: "12px", border: "1px solid #fee2e2" }}>
        <div>
          <h3 style={{ margin: 0, color: "#991b1b", fontSize: "16px" }}>📅 특정 시간대 차단이 필요하신가요?</h3>
          <p style={{ margin: "4px 0 0", color: "#b91c1c", fontSize: "13px" }}>슬롯 관리 페이지에서 차단할 수 있습니다.</p>
        </div>
        <button onClick={() => router.push("/admin/slots")} style={{ backgroundColor: "#dc2626", color: "white", padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
          슬롯 관리 페이지로 이동
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {bookings.map((b) => (
          <div key={b.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: b.status === "CONFIRMED" ? "#ecfdf5" : b.status === "CANCELED" ? "#fef2f2" : "#fffbeb", color: b.status === "CONFIRMED" ? "#065f46" : b.status === "CANCELED" ? "#991b1b" : "#92400e" }}>
                {b.status}
              </span>
              <div style={{ color: "#6b7280", fontSize: 13 }}>신청일: {new Date(b.created_at).toLocaleDateString()}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{b.date_iso}</div>
                <div style={{ fontWeight: 600 }}>{(b.merged_ranges || []).map((r: any, i: number) => (<span key={i} style={{ marginRight: 8 }}>{hhmm(r.start_min)} ~ {hhmm(r.end_min)}</span>))}</div>
                <div style={{ marginTop: 8, fontSize: 14 }}>장소: {Array.isArray(b.place_names) ? b.place_names.join(", ") : b.place_names}</div>
              </div>
              <div style={{ borderLeft: "1px solid #f3f4f6", paddingLeft: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{b.booker_name}</div>
                <div style={{ fontSize: 14 }}>{b.booker_phone}</div>
                {b.meeting_custom && <div style={{ marginTop: 8, padding: 8, background: "#f9fafb", borderRadius: 6, fontSize: 12 }}>📝 메모: {b.meeting_custom}</div>}
              </div>
            </div>

            {/* ✅ 핵심 기능 3: 승인/거절 액션 버튼 (그대로 유지) */}
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
        {bookings.length === 0 && !loading && <div style={{ textAlign: "center", padding: 40, color: "#999" }}>현재 들어온 예약 신청이 없습니다.</div>}
      </div>
    </main>
  );
}
