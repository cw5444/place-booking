"use client";

import * as React from "react";
import { useSupabase } from "../auth/provider";
import { useRouter } from "next/navigation";

function hhmm(min: number) {
  if (min === undefined || min === null) return "00:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const ADMIN_EMAILS = ["admin1@example.com", "admin2@example.com"];

export default function AdminBookingsPage() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("date_iso", { ascending: false });
    if (!error && data) setBookings(data);
    setLoading(false);
  };

  React.useEffect(() => {
    if (authLoading) return;

    if (!session) {
      alert("관리자 권한이 필요합니다.");
      router.replace("/");
      return;
    }

    const whitelist = ADMIN_EMAILS.map((e) => e.toLowerCase().trim());
    const curEmail = (session.user?.email ?? "").toLowerCase().trim();
    if (!whitelist.includes(curEmail)) {
      alert("관리자 전용 페이지입니다.");
      router.replace("/");
      return;
    }

    // [수정] session.user를 안전하게 체크 (Optional Chaining)
    const emailConfirmed =
      (session.user as any)?.email_confirmed_at ||
      (session.user as any)?.email_confirmed;

    if (!emailConfirmed) {
      setLoading(false);
      return;
    }

    fetchBookings();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (newSession?.user?.email === curEmail) {
          const confirmedNow =
            (newSession.user as any)?.email_confirmed_at ||
            (newSession.user as any)?.email_confirmed;
          if (confirmedNow) {
            await fetchBookings();
          }
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [session, authLoading]);

  const resendVerification = async () => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: session?.user?.email ?? "",
    });
    if (error) alert(`재전송 실패: ${error.message}`);
    else alert("인증 메일을 다시 보냈습니다. 메일함을 확인해주세요.");
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", id);
    if (!error) fetchBookings();
    else alert("상태 변경 실패");
  };

  if (authLoading || loading) {
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        인증 및 데이터 로드 중...
      </div>
    );
  }

  // [수정] session.user가 없을 경우를 대비한 안전한 체크
  const emailConfirmedNow =
    (session?.user as any)?.email_confirmed_at ||
    (session?.user as any)?.email_confirmed;

  if (!emailConfirmedNow) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ color: "#991b1b" }}>이메일 인증이 필요합니다.</h2>
        <p>
          관리자 페이지에 접근하려면 <strong>{session?.user?.email}</strong> 로
          전송된 인증 메일을 확인해 주세요.
        </p>
        <button
          onClick={resendVerification}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            padding: "10px 16px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          인증 메일 다시 보내기
        </button>
      </div>
    );
  }

  return (
    <main style={{ padding: 20, maxWidth: 1000, margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: 10, fontSize: 14, color: "#666" }}>
        접속 계정: {session?.user?.email}
      </div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>📬 예약 승인 관리 (전체 목록)</h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          padding: "16px",
          backgroundColor: "#fef2f2",
          borderRadius: "12px",
          border: "1px solid #fee2e2",
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: "#991b1b", fontSize: "16px" }}>
            📅 특정 시간대 차단이 필요하신가요?
          </h3>
          <p style={{ margin: "4px 0 0", color: "#b91c1c", fontSize: "13px" }}>
            점검이나 내부 행사 시 해당 페이지에서 슬롯을 막을 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/slots")}
          style={{
            backgroundColor: "#dc2626",
            color: "white",
            padding: "10px 18px",
            borderRadius: "8px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          슬롯 관리 페이지로 이동
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {bookings.map((b) => (
          <div
            key={b.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 20,
              background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    b.status === "CONFIRMED"
                      ? "#ecfdf5"
                      : b.status === "CANCELED"
                      ? "#fef2f2"
                      : "#fffbeb",
                  color:
                    b.status === "CONFIRMED"
                      ? "#065f46"
                      : b.status === "CANCELED"
                      ? "#991b1b"
                      : "#92400e",
                }}
              >
                {b.status}
              </span>
              <div style={{ color: "#6b7280", fontSize: 14 }}>
                신청일: {new Date(b.created_at).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>예약 정보</div>
                <div style={{ fontSize: 18, fontWeight: 800, margin: "4px 0" }}>{b.date_iso}</div>
                <div style={{ fontWeight: 600, color: "#111827" }}>
                  {(b.merged_ranges || []).map((r: any, i: number) => (
                    <span key={i} style={{ marginRight: 8 }}>
                      {hhmm(r.start_min)} ~ {hhmm(r.end_min)}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 8, color: "#374151" }}>
                  <strong>장소:</strong>{" "}
                  {Array.isArray(b.place_names) ? b.place_names.join(", ") : b.place_names || "-"}
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
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      background: "#f9fafb",
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  >
                    📝 메모: {b.meeting_custom}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
              {b.status === "PENDING" ? (
                <>
                  <button
                    onClick={() => updateStatus(b.id, "CONFIRMED")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "#111827",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    승인하기
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "CANCELED")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "white",
                      color: "#ef4444",
                      border: "1px solid #ef4444",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    거절하기
                  </button>
                </>
              ) : (
                <button
                  onClick={() => updateStatus(b.id, "PENDING")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#f3f4f6",
                    color: "#4b5563",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  대기 상태로 되돌리기
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
