// app/bookings/new/BookingNewClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import { supabase } from "@/lib/supabaseClient"; // ← Supabase 클라이언트 (전역 export)
import type { Database } from "@/lib/database.types"; // 자동 생성된 타입 (supabase CLI)

type Slot = { startMin: number; endMin: number };
const STEP = 30;

// 운영시간 (기본)
const DAY_START = 9 * 60; // 09:00
const DAY_END = 21 * 60; // 21:00
// 확장 (24 시간)
const FULL_START = 0;
const FULL_END = 24 * 60;

// ---------- 헬퍼 ----------
function useIsMobile(maxWidth = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    // 구형 브라우저 fallback
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, [maxWidth]);
  return isMobile;
}

function toHHMM(min: number) {
  if (min === 1440) return "24:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dateToISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatKoreanDate(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function buildSlots(rangeStart: number, rangeEnd: number): Slot[] {
  const slots: Slot[] = [];
  for (let t = rangeStart; t < rangeEnd; t += STEP) slots.push({ startMin: t, endMin: t + STEP });
  return slots;
}

function keyOf(slot: Slot) {
  return `${slot.startMin}-${slot.endMin}`;
}

function normalizePhone(input: string) {
  return input.replace(/[^\d]/g, "");
}

function isValidPhoneKR(input: string) {
  const digits = normalizePhone(input);
  return digits.length === 10 || digits.length === 11;
}

function mergeSelected(selected: Slot[]): Array<{ startMin: number; endMin: number }> {
  if (selected.length === 0) return [];
  const sorted = [...selected].sort((a, b) => a.startMin - b.startMin);
  const merged: Array<{ startMin: number; endMin: number }> = [];
  let curStart = sorted[0]!.startMin;
  let curEnd = sorted[0]!.endMin;
  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i]!;
    if (s.startMin === curEnd) curEnd = s.endMin;
    else {
      merged.push({ startMin: curStart, endMin: curEnd });
      curStart = s.startMin;
      curEnd = s.endMin;
    }
  }
  merged.push({ startMin: curStart, endMin: curEnd });
  return merged;
}

// ---------- 장소 ----------
type Place = { id: string; name: string; imageSrcs: [string, string] };
const PLACES: Place[] = [
  { id: "worship", name: "경배실", imageSrcs: ["/places/worship-1.jpg", "/places/worship-2.jpg"] },
  {
    id: "small1",
    name: "소모임실 1 (경배실 안쪽)",
    imageSrcs: ["/places/small1-1.jpg", "/places/small1-2.jpg"],
  },
  { id: "small2", name: "소모임실 2 (중앙 홀)", imageSrcs: ["/places/small2-1.jpg", "/places/small2-2.jpg"] },
];

function isValidPlaceId(v: string | null): v is (typeof PLACES)[number]["id"] {
  if (!v) return false;
  return PLACES.some((p) => p.id === v);
}

// ---------- SlotGrid 컴포넌트 ----------
function SlotGrid({
  title,
  subtitle,
  slots,
  reservedKeys,
  selectedKeys,
  onToggleKey,
}: {
  title: string;
  subtitle?: string;
  slots: Slot[];
  reservedKeys: Set<string>;
  selectedKeys: Set<string>;
  onToggleKey: (k: string) => void;
}) {
  const isMobile = useIsMobile(768);
  return (
    <div
      style={{
        marginTop: 12,
        display: "grid",
        gap: 8,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: 12,
        background: "white",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: 15, color: "#111827" }}>{title}</h3>
      {subtitle && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {subtitle}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
        }}
      >
        {slots.map((s) => {
          const k = keyOf(s);
          const isReserved = reservedKeys.has(k);
          const isSelected = selectedKeys.has(k);
          const label = `${toHHMM(s.startMin)}-${toHHMM(s.endMin)}`;
          return (
            <button
              key={k}
              onClick={() => {
                if (!isReserved) onToggleKey(k);
              }}
              title={isReserved ? "이미 예약됨(선택한 장소 기준)" : "선택/해제"}
              style={{
                borderRadius: 10,
                padding: "10px 10px",
                border: "1px solid #e5e7eb",
                background: isReserved ? "#f3f4f6" : isSelected ? "#111827" : "white",
                color: isReserved ? "#9ca3af" : isSelected ? "white" : "#111827",
                cursor: isReserved ? "not-allowed" : "pointer",
                textAlign: "center",
                fontSize: 13,
                opacity: isReserved ? 0.9 : 1,
                minWidth: 0,
              }}
              aria-pressed={isSelected}
            >
              <div>{label}</div>
              {isReserved && <div style={{ marginTop: 2, fontSize: 11 }}>예약됨</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- 메인 컴포넌트 ----------
export default function BookingNewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isMobile = useIsMobile(960);
  const [showExtended, setShowExtended] = useState(false);

  // 슬롯 정의 (고정)
  const slotsMain = useMemo(() => buildSlots(DAY_START, DAY_END), []);
  const slotsEarly = useMemo(() => buildSlots(FULL_START, DAY_START), []);
  const slotsLate = useMemo(() => buildSlots(DAY_END, FULL_END), []);

  // 선택 상태
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(() => new Set());
  const [date, setDate] = useState<Date | null>(new Date());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [placePhotoIndex, setPlacePhotoIndex] = useState<Record<string, 0 | 1>>({
    worship: 0,
    small1: 0,
    small2: 0,
  });

  // URL 로부터 초기값(관리자 링크에서 장소 미리 선택)
  const didInitFromQueryRef = useRef(false);
  useEffect(() => {
    if (didInitFromQueryRef.current) return;
    const q = searchParams.get("placeId");
    if (!isValidPlaceId(q)) return;
    didInitFromQueryRef.current = true;
    setSelectedPlaceIds(new Set([q]));
  }, [searchParams]);

  // ---------- Supabase 로부터 기존 예약 모두 가져오기 ----------
  const [allBookings, setAllBookings] = useState<Database["public"]["Tables"]["bookings"]["Row"][]>([]);
  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from("bookings").select("*");
      if (error) {
        console.error("예약 로드 실패:", error);
        return;
      }
      setAllBookings(data ?? []);
    };
    fetch();
  }, []);

  // URL 로부터 초기값(날짜)
useEffect(() => {
  const dateStr = searchParams.get("date");
  if (!dateStr) return;
  
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const initialDate = new Date(year, month - 1, day);
    setDate(initialDate);
  } catch (e) {
    console.error("날짜 파싱 실패:", e);
  }
}, [searchParams]);


  // 날짜 문자열
  const dateISO = date ? dateToISO(date) : null;

  // 날짜가 바뀔 때마다 선택된 슬롯 초기화
  useEffect(() => setSelectedKeys(new Set()), [dateISO]);

  // 선택된 장소 객체 배열
  const selectedPlaces = useMemo(() => {
    const ids = Array.from(selectedPlaceIds);
    return PLACES.filter((p) => ids.includes(p.id));
  }, [selectedPlaceIds]);

  // 해당 날짜에 이미 존재하는 예약 (전체)
  const bookingsOfDay = useMemo(() => {
    if (!dateISO) return [];
    return allBookings.filter((b) => b.date_iso === dateISO);
  }, [allBookings, dateISO]);

  // 현재 선택된 장소와 겹치는 기존 예약의 slot key 집합
  const reservedSlotKeysForSelectedPlaces = useMemo(() => {
    const reserved = new Set<string>();
    if (!dateISO) return reserved;
    if (selectedPlaceIds.size === 0) return reserved;

    for (const b of bookingsOfDay) {
      const bPlaceIds = new Set(b.place_ids ?? []);
      let overlaps = false;
      for (const pid of selectedPlaceIds) {
        if (bPlaceIds.has(pid)) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) continue;

      for (const s of b.slots ?? []) reserved.add(`${s.start_min}-${s.end_min}`);
    }
    return reserved;
  }, [bookingsOfDay, selectedPlaceIds, dateISO]);

  // 캘린더에 점(예약된 날짜) 표시용
  const bookedDateSet = useMemo(() => {
    const set = new Set<string>();
    for (const b of allBookings) set.add(b.date_iso);
    return set;
  }, [allBookings]);

  // 화면에 보여줄 slot 배열 (확장 여부에 따라)
  const visibleSlots = useMemo(() => (showExtended ? [...slotsMain, ...slotsEarly, ...slotsLate] : [...slotsMain]), [
    showExtended,
    slotsEarly,
    slotsMain,
    slotsLate,
  ]);

  const selectedSlots = useMemo(() => {
    const arr: Slot[] = [];
    for (const s of visibleSlots) if (selectedKeys.has(keyOf(s))) arr.push(s);
    return arr;
  }, [visibleSlots, selectedKeys]);

  const mergedRanges = useMemo(() => mergeSelected(selectedSlots), [selectedSlots]);

  const showSoundNotice = useMemo(() => selectedPlaceIds.size > 0 && !selectedPlaceIds.has("worship"), [selectedPlaceIds]);

  const canSubmit = Boolean(
    date &&
    selectedPlaceIds.size > 0 &&
    selectedSlots.length > 0 &&
    name.trim() &&
    isValidPhoneKR(phone)
  );

  // ---------- UI 핸들러 ----------
  const toggleSelectAllPlaces = () => {
    setSelectedPlaceIds((prev) => {
      const all = PLACES.map((p) => p.id);
      const isAllSelected = all.every((id) => prev.has(id));
      return isAllSelected ? new Set() : new Set(all);
    });
  };

  // ★★★ 새로운 함수: 공간 추가 시 시간 중복 검증 ★★★
  const handlePlaceToggle = (placeId: string) => {
    setSelectedPlaceIds((prev) => {
      const nxt = new Set(prev);
      const isAdding = !nxt.has(placeId);

      // 공간을 "추가"할 때만 시간 중복 검증
      if (isAdding && selectedSlots.length > 0) {
        const targetPlaceBookings = bookingsOfDay.filter((b) => {
          const bPlaceIds = new Set(b.place_ids ?? []);
          return bPlaceIds.has(placeId);
        });

        for (const booking of targetPlaceBookings) {
          for (const slot of booking.slots ?? []) {
            const slotKey = `${slot.start_min}-${slot.end_min}`;
            if (selectedKeys.has(slotKey)) {
              alert(`"${PLACES.find((p) => p.id === placeId)?.name}"은(는) ${toHHMM(slot.start_min)}–${toHHMM(slot.end_min)}에 이미 예약되어 있습니다.`);
              return prev;
            }
          }
        }
      }

      if (nxt.has(placeId)) nxt.delete(placeId);
      else nxt.add(placeId);
      return nxt;
    });
  };

  const onToggleSlotKey = (k: string) => {
    setSelectedKeys((prev) => {
      const nxt = new Set(prev);
      if (nxt.has(k)) nxt.delete(k);
      else nxt.add(k);
      return nxt;
    });
  };

  // ---------- 확정, Supabase에 저장 ----------
  const onConfirm = async () => {
    if (!date || !canSubmit) return;

    for (const s of selectedSlots) {
      if (reservedSlotKeysForSelectedPlaces.has(keyOf(s))) {
        alert("선택한 장소 중 이미 예약된 시간이 포함되어 있습니다. 다른 시간을 선택해주세요.");
        return;
      }
    }

    const newBooking = {
      booker_name: name.trim(),
      booker_phone: normalizePhone(phone),
      date_iso: dateToISO(date),
      place_ids: Array.from(selectedPlaceIds),
      place_names: selectedPlaces.map((p) => p.name),
      slots: selectedSlots.map((s) => ({ start_min: s.startMin, end_min: s.endMin })),
      merged_ranges: mergedRanges.map((r) => ({ start_min: r.startMin, end_min: r.endMin })),
    } as const;

    const { data, error } = await supabase.from("bookings").insert(newBooking).select("*");
    if (error) {
      console.error("예약 저장 오류:", error);
      alert(`예약에 실패했습니다: ${error.message}`);
      return;
    }

    if (data && data.length > 0) setAllBookings((prev) => [...prev, data as any]);

    alert("예약이 완료되었습니다.");
    router.push(`/bookings/confirm?bookingId=${encodeURIComponent(data?.[0]?.id ?? "")}`);
  };

  // ---------- UI 렌더링 ----------
  const defaultTimeLabel = `${toHHMM(DAY_START)}–${toHHMM(DAY_END)}`;
  const earlyLabel = `${toHHMM(FULL_START)}–${toHHMM(DAY_START)}`;
  const lateLabel = `${toHHMM(DAY_END)}–${toHHMM(FULL_END)}`;

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
      <h1>새 예약</h1>

      <div style={{ display: isMobile ? "grid" : "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: 20 }}>
        {/* ── 좌측: 장소 선택 + 캘린더 ── */}
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, minWidth: 0 }}>
          {/* 장소 선택 */}
          <h2 style={{ marginTop: 0, fontSize: 16 }}>장소 선택 (복수 선택 가능 / 1건 예약)</h2>

          <div style={{ display: "grid", gap: 12 }}>
            {PLACES.map((p) => {
              const checked = selectedPlaceIds.has(p.id);
              const idx = placePhotoIndex[p.id] ?? 0;
              const src = p.imageSrcs[idx];
              return (
                <label
                  key={p.id}
                  style={{
                    display: "grid",
                    gap: 8,
                    gridTemplateColumns: "1fr",
                    alignItems: "start",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handlePlaceToggle(p.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                      <strong style={{ color: "#111827" }}>{p.name}</strong>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>사진 클릭하면 전환</span>
                    </div>
                  </div>

                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPlacePhotoIndex((prev) => ({
                        ...prev,
                        [p.id]: ((prev[p.id] ?? 0) === 0 ? 1 : 0) as 0 | 1,
                      }));
                    }}
                    title="클릭하면 사진 전환"
                  >
                    <img
                      src={src}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      style={{ width: "100%", borderRadius: 8, aspectRatio: "1" }}
                    />
                  </a>
                </label>
              );
            })}
          </div>

          {/* 전체 선택/전체 해제 버튼 */}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={toggleSelectAllPlaces}
              style={{
                borderRadius: 10,
                padding: "8px 10px",
                border: "1px solid #e5e7eb",
                background: "white",
                cursor: "pointer",
              }}
            >
              {PLACES.every((p) => selectedPlaceIds.has(p.id)) ? "장소 전체 해제" : "장소 전체 선택"}
            </button>
          </div>

          {selectedPlaceIds.size === 0 ? (
            <div style={{ marginTop: 12, color: "#6b7280" }}>
              장소를 최소 1개 선택하세요.
            </div>
          ) : (
            <div style={{ marginTop: 12, color: "#111827" }}>
              선택됨: {selectedPlaces.map((p) => p.name).join(", ")}
            </div>
          )}

          {showSoundNotice && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #fde68a",
                background: "#fffbeb",
                color: "#92400e",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              안내: 경배실에서 음향을 크게 사용하는 경우, 같은 시간대에 인접 공간(소모임실) 사용 시 방음이 충분하지 않을 수 있습니다.
              필요 시 시간 조정 또는 장소 변경을 권장합니다.
            </div>
          )}
{/* 캘린더 */}
<div style={{ marginTop: 12, borderRadius: 8, overflow: "hidden" }}>
  <Calendar
    value={date as any}
    onChange={(v) => {
      if (v instanceof Date) {
        setDate(v);
      } else if (Array.isArray(v)) {
        setDate(v[0] instanceof Date ? v[0] : null);
      } else {
        setDate(v ?? null);
      }
    }}
    minDate={
  new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  )
}
    calendarType="gregory"
    locale="ko-KR"
    tileContent={({ date: tileDate, view }) => {
      if (view !== "month") return null;
      const iso = dateToISO(tileDate);
      if (!bookedDateSet.has(iso)) return null;
      return (
        <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 900 }}>●</div>
      );
    }}
  />
</div>

          {dateISO && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
              {bookingsOfDay.length === 0 ? "이 날짜에는 예약이 없습니다." : `이 날짜 예약 ${bookingsOfDay.length}건`}
            </div>
          )}
        </section>

        {/* ── 우측: 시간 선택 & 입력 폼 ── */}
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, minWidth: 0 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>시간 선택 (예약된 시간은 선택 불가)</h2>

          {!date ? (
            <p style={{ color: "#6b7280", marginBottom: 0 }}>왼쪽에서 날짜를 먼저 선택하세요.</p>
          ) : (
            <>
              <p style={{ color: "#6b7280", marginTop: 0 }}>
                선택 날짜: <strong style={{ color: "#111827" }}>{formatKoreanDate(date)}</strong>
              </p>

              {/* 선택 초기화 버튼 */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedKeys(new Set())}
                  style={{
                    borderRadius: 10,
                    padding: "6px 10px",
                    border: "1px solid #e5e7eb",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  시간 선택 초기화
                </button>
              </div>

              {/* 기본시간 */}
              <SlotGrid
                title="기본 시간"
                subtitle={`${defaultTimeLabel} (30분 단위)`}
                slots={slotsMain}
                reservedKeys={reservedSlotKeysForSelectedPlaces}
                selectedKeys={selectedKeys}
                onToggleKey={onToggleSlotKey}
              />

              {/* 확장시간 토글 */}
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={showExtended}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setShowExtended(next);
                      if (!next) {
                        setSelectedKeys((prev) => {
                          const out = new Set(prev);
                          for (const s of [...slotsEarly, ...slotsLate]) out.delete(keyOf(s));
                          return out;
                        });
                      }
                    }}
                  />
                  <span style={{ fontSize: 13, color: "#111827", fontWeight: 800 }}>
                    9시 전 / 21시 이후(24:00) 펼치기
                  </span>
                </label>
              </div>

              {/* 확장 슬롯 표시 */}
              {showExtended && (
                <div style={{ marginTop: 12 }}>
                  {/* 이른 시간 */}
                  <details open style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "white" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 900, color: "#111827" }}>
                      이른 시간 ({earlyLabel})
                      <span style={{ marginLeft: 8, fontWeight: 600, color: "#6b7280", fontSize: 12 }}>30분 단위</span>
                    </summary>
                    <div style={{ marginTop: 10 }}>
                      <SlotGrid
                        title="00:00 ~ 09:00"
                        slots={slotsEarly}
                        reservedKeys={reservedSlotKeysForSelectedPlaces}
                        selectedKeys={selectedKeys}
                        onToggleKey={onToggleSlotKey}
                      />
                    </div>
                  </details>

                  {/* 늦은 시간 */}
                  <details open style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "white" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 900, color: "#111827" }}>
                      늦은 시간 ({lateLabel})
                      <span style={{ marginLeft: 8, fontWeight: 600, color: "#6b7280", fontSize: 12 }}>종료는 24:00 표기</span>
                    </summary>
                    <div style={{ marginTop: 10 }}>
                      <SlotGrid
                        title="21:00 ~ 24:00"
                        slots={slotsLate}
                        reservedKeys={reservedSlotKeysForSelectedPlaces}
                        selectedKeys={selectedKeys}
                        onToggleKey={onToggleSlotKey}
                      />
                    </div>
                  </details>

                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                    ※ 자정(24:00)까지는 가능하지만, <strong>날짜를 넘어가는 예약(예: 23:00–01:00)</strong>은 지원하지 않습니다.
                  </div>
                </div>
              )}

              {/* 폼 입력 */}
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {/* 이름 */}
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>이름</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", outline: "none" }}
                  />
                </label>

                {/* 전화번호 */}
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>전화번호</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="010-1234-5678"
                    style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", outline: "none" }}
                  />
                  {phone && !isValidPhoneKR(phone) && (
                    <span style={{ fontSize: 12, color: "#ef4444" }}>전화번호를 확인해주세요 (숫자 10~11자리)</span>
                  )}
                </label>
              </div>

              {/* 선택 요약 & 확정 버튼 */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                <div style={{ color: "#6b7280", fontSize: 14 }}>선택 요약</div>

                {/* 장소 */}
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>장소</div>
                  <div style={{ color: "#111827" }}>{selectedPlaces.length ? selectedPlaces.map((p) => p.name).join(", ") : "—"}</div>
                </div>

                {/* 시간 리스트 */}
                {selectedSlots.length === 0 ? (
                  <div style={{ marginTop: 10, color: "#6b7280" }}>시간을 선택하세요.</div>
                ) : (
                  <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                    {mergedRanges.map((r) => (
                      <li key={`${r.startMin}-${r.endMin}`}>
                        <strong>{toHHMM(r.startMin)}–{toHHMM(r.endMin)}</strong>
                      </li>
                    ))}
                  </ul>
                )}

                {/* 예약 확정 */}
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={onConfirm}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid #111827",
                    background: canSubmit ? "#111827" : "#9ca3af",
                    color: "white",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                  }}
                >
                  예약 확정
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
