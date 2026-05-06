"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../auth/provider";

// ─────────────────────────────────────────────────────
//  분(分鐘) → HH:mm 변환 헬퍼
// ─────────────────────────────────────────────────────
function hhmm(min: number) {
  if (min === undefined || min === null) return "00:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────
 //  AdminSecretDashboard (통합 대시보드)
// ─────────────────────────────────────────────────────
export default function AdminSecretDashboard() {
  // supabase와 현재 세션을 가져오지만,
  // 세션이 없을 때도 페이지를 그대로 보여줍니다.
  const { supabase } = useSupabase();

  // ------------------- [보안 추가] 간단 암호 확인 상태 -------------------
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const ADMIN_PASSWORD = "jnu1234"; // ⬅️ 여기에 사용할 관리자 비밀번호를 입력하세요!

  const [activeTab, setActiveTab] = useState<
    "PENDING" | "CONFIRMED" | "CANCELED" | "SLOTS"
  >("PENDING");

  // ------------------- 상태 -------------------
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [newSlot, setNewSlot] = useState({
    place_id: "",
    start_at: "",
    end_at: "",
  });
  const [loading, setLoading] = useState(false);

  // ------------------- 데이터 로드 -------------------
  const fetchData = useCallback(async () => {
    // 비밀번호 인증 전에는 데이터를 가져오지 않음
    if (!isAdminAuthenticated) return;

    setLoading(true);
    const { data: bData } = await supabase
      .from("bookings")
      .select("*")
      .order("date_iso", { ascending: true });
    if (bData) setBookings(bData);

    const { data: pData } = await supabase.from("places").select("id, name");
    if (pData) setPlaces(pData);

    const { data: sData } = await supabase
      .from("slots")
      .select("*, places(name)")
      .order("start_at", { ascending: true });
    if (sData) setSlots(sData);
    setLoading(false);
  }, [supabase, isAdminAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ------------------- [보안 추가] 암호 확인 함수 -------------------
  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  // ------------------- 예약 일괄 처리 -------------------
  const handleBulkUpdate = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `${selectedIds.length}건을 일괄 ${
          newStatus === "CONFIRMED" ? "승인" : "거절"
        }하시겠습니까?`
      )
    )
      return;

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .in("id", selectedIds);

    if (!error) {
      setSelectedIds([]);
      fetchData();
    } else {
      alert("업데이트 실패: " + error.message);
    }
  };

  // ------------------- [추가] 예약 영구 삭제 처리 -------------------
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `⚠️ 주의: 선택하신 ${selectedIds.length}건의 예약을 시스템에서 영구히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    )
      return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .in("id", selectedIds);

    if (!error) {
      alert("삭제되었습니다.");
      setSelectedIds([]);
      fetchData();
    } else {
      alert("삭제 실패: " + error.message);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ------------------- 슬롯 차단 -------------------
  const handleBlockSlot = async () => {
    const { place_id, start_at, end_at } = newSlot;
    if (!place_id || !start_at || !end_at) {
      return alert("장소와 시작·종료 시간을 모두 선택하세요.");
    }

    const { error } = await supabase.from("slots").insert({
      place_id,
      start_at,
      end_at,
      status: "BLOCKED",
    });

    if (error) alert("슬롯 차단 실패: " + error.message);
    else {
      alert("슬롯이 차단되었습니다.");
      setNewSlot({ place_id: "", start_at: "", end_at: "" });
      fetchData();
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("해당 차단 슬롯을 삭제하시겠습니까?")) return;
    await supabase.from("slots").delete().eq("id", id);
    fetchData();
  };

  // ------------------- 인증 체크 UI 추가 -------------------
  if (!isAdminAuthenticated) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2 style={{ marginBottom: "20px" }}>🔒 관리자 암호 인증</h2>
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="암호를 입력하세요"
          style={{
            padding: "12px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            marginRight: "10px",
            width: "200px"
          }}
        />
        <button
          onClick={handleLogin}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#111",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          확인
        </button>
      </div>
    );
  }

  // ------------------- 화면 -------------------
  const filteredBookings = bookings.filter(
    (b) => b.status === activeTab
  );

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      {/* ── 헤더 ── */}
      <header style={{ marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "900",
            letterSpacing: "-0.5px",
          }}
        >
          📬 관리자 통합 대시보드
        </h1>
        <p style={{ color: "#888", fontSize: "14px" }}>
          예약 신청 및 시설 차단 관리 공간입니다.
        </p>
      </header>

      {/* ── 탭 메뉴 ── */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "30px",
          borderBottom: "1px solid #eee",
        }}
      >
        {(
          ["PENDING", "CONFIRMED", "CANCELED", "SLOTS"] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedIds([]);
            }}
            style={{
              padding: "15px 25px",
              cursor: "pointer",
              border: "none",
              backgroundColor: "transparent",
              borderBottom:
                activeTab === tab ? "3px solid #111" : "none",
              fontWeight: activeTab === tab ? "800" : "500",
              color: activeTab === tab ? "#111" : "#aaa",
              fontSize: "16px",
            }}
          >
            {tab === "PENDING" && "신청 내역"}
            {tab === "CONFIRMED" && "승인 완료"}
            {tab === "CANCELED" && "거절 내역"}
            {tab === "SLOTS" && "🚫 슬롯 차단 관리"}
          </button>
        ))}
      </div>

      {/* ── 예약 탭 (PENDING / CONFIRMED / CANCELED) ── */}
      {activeTab !== "SLOTS" && (
        <>
          {/* 일괄 처리 버튼 영역 (삭제 버튼 추가) */}
          {selectedIds.length > 0 && (
            <div
              style={{
                marginBottom: "15px",
                display: "flex",
                gap: "10px",
                alignItems: "center"
              }}
            >
              {activeTab === "PENDING" && (
                <>
                  <button
                    onClick={() => handleBulkUpdate("CONFIRMED")}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#111",
                      color: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "700",
                    }}
                  >
                    선택 예약 승인 ({selectedIds.length}건)
                  </button>
                  <button
                    onClick={() => handleBulkUpdate("CANCELED")}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#fff",
                      color: "#ef4444",
                      borderRadius: "8px",
                      border: "1px solid #ef4444",
                      cursor: "pointer",
                    }}
                  >
                    선택 거절
                  </button>
                </>
              )}
              {/* 공통 삭제 버튼: PENDING, CONFIRMED, CANCELED 탭 어디서든 선택 시 노출 */}
              <button
                onClick={handleBulkDelete}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
              >
                데이터 영구 삭제 ({selectedIds.length}건)
              </button>
            </div>
          )}

          {/* 예약 테이블 */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #f3f4f6",
                  textAlign: "left",
                  color: "#666",
                }}
              >
                <th style={{ padding: "15px 12px", width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredBookings.length}
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked
                          ? filteredBookings.map((b) => b.id)
                          : []
                      )
                    }
                  />
                </th>
                <th style={{ padding: "15px 12px" }}>
                  예약일자 / 장소
                </th>
                <th style={{ padding: "15px 12px" }}>
                  예약 시간
                </th>
                <th style={{ padding: "15px 12px" }}>
                  예약자 (연락처)
                </th>
                <th style={{ padding: "15px 12px" }}>메모</th>
                <th style={{ padding: "15px 12px" }}>신청일시</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "60px",
                      textAlign: "center",
                      color: "#ccc",
                    }}
                  >
                    표시할 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    style={{ borderBottom: "1px solid #f9f9f9" }}
                  >
                    {/* 체크박스 */}
                    <td style={{ padding: "15px 12px" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b.id)}
                        onChange={() => toggleSelect(b.id)}
                      />
                    </td>

                    {/* 날짜·장소 */}
                    <td style={{ padding: "15px 12px" }}>
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "16px",
                        }}
                      >
                        {b.date_iso}
                      </div>
                      <div
                        style={{
                          color: "#666",
                          fontSize: "12px",
                        }}
                      >
                        장소:{" "}
                        {Array.isArray(b.place_names)
                          ? b.place_names.join(", ")
                          : b.place_names}
                      </div>
                    </td>

                    {/* 시간 (merged_ranges) */}
                    <td style={{ padding: "15px 12px" }}>
                      <span
                        style={{
                          background: "#f3f4f6",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontWeight: "700",
                          color: "#333",
                        }}
                      >
                        {(b.merged_ranges || [])
                          .map(
                            (r: any) =>
                              `${hhmm(r.start_min)}~${hhmm(r.end_min)}`
                          )
                          .join(", ")}
                      </span>
                    </td>

                    {/* 예약자·연락처 */}
                    <td style={{ padding: "15px 12px" }}>
                      <div style={{ fontWeight: "700" }}>
                        {b.booker_name}
                      </div>
                      <div
                        style={{
                          color: "#888",
                          fontSize: "12px",
                        }}
                      >
                        {b.booker_phone}
                      </div>
                    </td>

                    {/* 메모 */}
                    <td
                      style={{
                        padding: "15px 12px",
                        maxWidth: "200px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          background: b.meeting_custom
                            ? "#f9f9f9"
                            : "transparent",
                          padding: b.meeting_custom ? "8px" : "0",
                          borderRadius: "6px",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {b.meeting_custom || "-"}
                      </div>
                    </td>

                    {/* 신청일시 */}
                    <td
                      style={{
                        padding: "15px 12px",
                        fontSize: "12px",
                        color: "#aaa",
                      }}
                    >
                      {new Date(b.created_at).toLocaleString(
                        "ko-KR"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      {/* ── 슬롯 차단 관리 탭 ── */}
      {activeTab === "SLOTS" && (
        <div>
          {/* 차단 추가 폼 */}
          <section
            style={{
              marginBottom: "30px",
              padding: "25px",
              backgroundColor: "#fff1f1",
              borderRadius: "16px",
              border: "1px solid #ffe3e3",
            }}
          >
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "800",
                marginBottom: "20px",
                color: "#c53030",
              }}
            >
              🚫 특정 기간·장소 차단 (점검·내부행사)
            </h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "flex-end",
              }}
            >
              {/* 장소 선택 */}
              <select
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  width: "180px",
                }}
                value={newSlot.place_id}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, place_id: e.target.value })
                }
              >
                <option value="">장소 선택</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* 시작·종료 datetime */}
              <input
                type="datetime-local"
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                }}
                value={newSlot.start_at}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, start_at: e.target.value })
                }
              />
              <input
                type="datetime-local"
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                }}
                value={newSlot.end_at}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, end_at: e.target.value })
                }
              />

              {/* 차단 추가 버튼 */}
              <button
                onClick={handleBlockSlot}
                style={{
                  padding: "13px 25px",
                  backgroundColor: "#c53030",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                차단 추가하기
              </button>
            </div>
          </section>

          {/* 차단된 슬롯 목록 테이블 */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #eee",
                  textAlign: "left",
                  color: "#666",
                }}
              >
                <th style={{ padding: "15px 12px" }}>장소</th>
                <th style={{ padding: "15px 12px" }}>시작 일시</th>
                <th style={{ padding: "15px 12px" }}>종료 일시</th>
                <th style={{ padding: "15px 12px" }}>상태</th>
                <th style={{ padding: "15px 12px", textAlign: "center" }}>
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#aaa",
                    }}
                  >
                    차단된 슬롯이 없습니다.
                  </td>
                </tr>
              ) : (
                slots.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: "1px solid #f9f9f9" }}
                  >
                    <td
                      style={{
                        padding: "15px 12px",
                        fontWeight: "700",
                      }}
                    >
                      {s.places?.name}
                    </td>
                    <td style={{ padding: "15px 12px" }}>
                      {new Date(s.start_at).toLocaleString("ko-KR")}
                    </td>
                    <td style={{ padding: "15px 12px" }}>
                      {new Date(s.end_at).toLocaleString("ko-KR")}
                    </td>
                    <td style={{ padding: "15px 12px" }}>
                      <span
                        style={{
                          color: "#c53030",
                          fontWeight: "bold",
                          background: "#fff1f1",
                          padding: "4px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        차단됨
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "15px 12px",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() => handleDeleteSlot(s.id)}
                        style={{
                          color: "#ef4444",
                          border: "1px solid #ef4444",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "#fff",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
