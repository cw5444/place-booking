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

/* ----------  ★ 수정 시작 ★ ----------
   관리자 이메일 화이트리스트 – 실제 admin 계정 두 개만 입력 */
const ADMIN_EMAILS = ["admin1@example.com", "admin2@example.com"];
// ----------  ★ 수정 종료 ★ ---------- */

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

  /* -------------------------------------------------------------
     ① 세션 로딩·인증 로직 (수정 포인트)
     ② Supabase Auth 상태 변화 감지 (새로운 라인)
  ------------------------------------------------------------- */
  React.useEffect(() => {
    if (authLoading) return; // 아직 Supabase가 로드 중 → 기다림

    // 세션 없으면 홈으로 이동
    if (!session) {
      alert("관리자 권한이 필요합니다.");
      router.replace("/");
      return;
    }

    // ---------- 화이트리스트 검사 ----------
    const whitelist = ADMIN_EMAILS.map((e) => e.toLowerCase().trim());
    const curEmail = (session.user?.email ?? "").toLowerCase().trim();
    if (!whitelist.includes(curEmail)) {
      alert("관리자 전용 페이지입니다.");
      router.replace("/");
      return;
    }

    // ---------- 이메일 인증 검사 ----------
    const emailConfirmed =
      // 최신 SDK : email_confirmed_at
      (session.user as any).email_confirmed_at ||
      // 구버전 SDK : email_confirmed boolean
      (session.user as any).email_confirmed;

    if (!emailConfirmed) {
      // 인증이 아직 안 된 경우 UI에서 재전송 버튼을 보여 주게 하고,
      // 여기서는 fetch를 하지 않음.
      setLoading(false);
      return;
    }

    // 인증·화이트리스트 모두 OK → 데이터 로드
    fetchBookings();

    // ---------  Supabase Auth State Change Listener ----------
    // 이메일 인증이 완료되면 Supabase는 새로운 session을
    // (email_confirmed_at 포함) 반환합니다.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // 로그인·세션 갱신·이메일 인증 완료 등 모든 이벤트
        if (newSession?.user?.email === curEmail) {
          const confirmedNow =
            (newSession.user as any).email_confirmed_at ||
            (newSession.user as any).email_confirmed;
          if (confirmedNow) {
            // 인증이 방금 완료됐으면 바로 예약 데이터를 다시 불러옴
            await fetchBookings();
          }
        }
      }
    );

    // 클린업: 컴포넌트 언마운트 시 리스너 해제
    return () => {
      authListener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authLoading]); // ← 의존성은 그대로 유지 (session이 바뀔 때 재실행)

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

  /* -------------------------------------------------------------
     로딩·인증 UI
  ------------------------------------------------------------- */
  if (authLoading || loading) {
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        인증 및 데이터 로드 중...
      </div>
    );
  }

  // ---------- 인증되지 않은 경우 UI ----------
  const emailConfirmedNow =
    (session.user as any).email_confirmed_at ||
    (session.user as any).email_confirmed;
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

  /* -------------------------------------------------------------
     인증·허용된 관리자일 때 보여지는 메인 UI
  ------------------------------------------------------------- */
  return (
    <main style={{ padding: 20, maxWidth: 1000, margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: 10, fontSize: 14, color: "#666" }}>
        접속 계정: {session?.user?.email}
      </div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>📬 예약 승인 관리 (전체 목록)</h1>

      {/* 슬롯 관리 페이지 이동 안내 박스 */}
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1ff", gap: 16 }}>
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
