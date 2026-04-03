// app/bookings/new/BookingNewClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import { addBooking, loadBookings, type Booking } from "@/lib/bookings";

type Slot = { startMin: number; endMin: number };

const STEP = 30;

// 기본 운영시간(메인)
const DAY_START = 9 * 60; // 09:00
const DAY_END = 21 * 60; // 21:00

// 확장(24시간)
const FULL_START = 0; // 00:00
const FULL_END = 24 * 60; // 24:00(=1440)

function useIsMobile(maxWidth = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    } else {
      // eslint-disable-next-line deprecation/deprecation
      mq.addListener(apply);
      // eslint-disable-next-line deprecation/deprecation
      return () => mq.removeListener(apply);
    }
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

type CalendarValue = Date | null;

const MEETING_PRESETS = ["한국어교실", "악기레슨", "예배", "기도회", "회의", "기타"] as const;
type MeetingPreset = (typeof MEETING_PRESETS)[number];
type MeetingSelectValue = "" | MeetingPreset;

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
    <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "baseline",
          flexWrap: "wrap",
          minWidth: 0,
        }}
      >
        <div style={{ fontWeight: 900, color: "#111827" }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 12, color: "#6b7280" }}>{subtitle}</div> : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
          gap: 8,
          minWidth: 0,
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
              type="button"
              disabled={isReserved}
              onClick={() => {
                if (isReserved) return;
                onToggleKey(k);
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
              {isReserved ? <div style={{ marginTop: 2, fontSize: 11 }}>예약됨</div> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BookingNewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ 2열 레이아웃을 유지하기에 충분한 폭이 아닐 때(대략 < 960px) 1열로 떨어뜨려 찌그러짐 방지
  const isMobile = useIsMobile(960);

  const [showExtended, setShowExtended] = useState(false);

  const slotsMain = useMemo(() => buildSlots(DAY_START, DAY_END), []);
  const slotsEarly = useMemo(() => buildSlots(FULL_START, DAY_START), []);
  const slotsLate = useMemo(() => buildSlots(DAY_END, FULL_END), []);

  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(() => new Set([PLACES[0]!.id]));
  const [date, setDate] = useState<Date | null>(new Date());

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [meetingPreset, setMeetingPreset] = useState<MeetingSelectValue>("");
  const [meetingCustom, setMeetingCustom] = useState("");

  const meetingType = useMemo(() => {
    if (meetingPreset === "") return "";
    if (meetingPreset !== "기타") return meetingPreset;
    const v = meetingCustom.trim();
    return v ? `기타: ${v}` : "";
  }, [meetingPreset, meetingCustom]);

  const isMeetingValid = useMemo(() => {
    if (meetingPreset === "") return false;
    if (meetingPreset === "기타") return meetingCustom.trim().length > 0;
    return true;
  }, [meetingPreset, meetingCustom]);

  const [placePhotoIndex, setPlacePhotoIndex] = useState<Record<string, 0 | 1>>(() => ({
    worship: 0,
    small1: 0,
    small2: 0,
  }));

  const didInitFromQueryRef = useRef(false);
  useEffect(() => {
    if (didInitFromQueryRef.current) return;

    const q = searchParams.get("placeId");
    if (!isValidPlaceId(q)) return;

    didInitFromQueryRef.current = true;
    setSelectedPlaceIds(new Set([q]));
  }, [searchParams]);

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  useEffect(() => {
    setAllBookings(loadBookings());
  }, []);

  const dateISO = date ? dateToISO(date) : null;

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [dateISO]);

  const selectedPlaces = useMemo(() => {
    const ids = Array.from(selectedPlaceIds);
    return PLACES.filter((p) => ids.includes(p.id));
  }, [selectedPlaceIds]);

  const bookingsOfDay = useMemo(() => {
    if (!dateISO) return [];
    return allBookings.filter((b) => b.dateISO === dateISO);
  }, [allBookings, dateISO]);

  const reservedSlotKeysForSelectedPlaces = useMemo(() => {
    const reserved = new Set<string>();
    if (!dateISO) return reserved;
    if (selectedPlaceIds.size === 0) return reserved;

    for (const b of bookingsOfDay) {
      const bPlaceIds = new Set(b.placeIds ?? []);
      let overlaps = false;
      for (const pid of selectedPlaceIds) {
        if (bPlaceIds.has(pid)) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) continue;

      for (const s of b.slots) reserved.add(`${s.startMin}-${s.endMin}`);
    }
    return reserved;
  }, [bookingsOfDay, selectedPlaceIds, dateISO]);

  const bookedDateSet = useMemo(() => {
    const s = new Set<string>();
    for (const b of allBookings) s.add(b.dateISO);
    return s;
  }, [allBookings]);

  const visibleSlots = useMemo(() => {
    return showExtended ? [...slotsMain, ...slotsEarly, ...slotsLate] : [...slotsMain];
  }, [showExtended, slotsEarly, slotsMain, slotsLate]);

  const selectedSlots = useMemo(() => {
    const picked: Slot[] = [];
    for (const s of visibleSlots) if (selectedKeys.has(keyOf(s))) picked.push(s);
    return picked;
  }, [visibleSlots, selectedKeys]);

  const selectedSlotsSorted = useMemo(() => [...selectedSlots].sort((a, b) => a.startMin - b.startMin), [selectedSlots]);
  const mergedRanges = useMemo(() => mergeSelected(selectedSlotsSorted), [selectedSlotsSorted]);

  const showSoundNotice = useMemo(() => {
    return selectedPlaceIds.size > 0 && !selectedPlaceIds.has("worship");
  }, [selectedPlaceIds]);

  const canSubmit = Boolean(
    date &&
      selectedPlaceIds.size > 0 &&
      selectedSlotsSorted.length > 0 &&
      name.trim() &&
      isValidPhoneKR(phone) &&
      isMeetingValid
  );

  const toggleSelectAllPlaces = () => {
    setSelectedPlaceIds((prev) => {
      const all = PLACES.map((p) => p.id);
      const isAllSelected = all.every((id) => prev.has(id));
      return isAllSelected ? new Set() : new Set(all);
    });
  };

  const onToggleSlotKey = (k: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const onConfirm = () => {
    if (!date || !canSubmit) return;

    for (const s of selectedSlotsSorted) {
      if (reservedSlotKeysForSelectedPlaces.has(keyOf(s))) {
        alert("선택한 장소 중 이미 예약된 시간이 포함되어 있습니다. 다른 시간을 선택해주세요.");
        return;
      }
    }

    const id = crypto.randomUUID();
    const booking: Booking = {
      id,
      placeIds: Array.from(selectedPlaceIds),
      placeNames: selectedPlaces.map((p) => p.name),
      meetingType,
      dateISO: dateToISO(date),
      slots: selectedSlotsSorted.map((s) => ({ startMin: s.startMin, endMin: s.endMin })),
      merged: mergedRanges.map((r) => ({ startMin: r.startMin, endMin: r.endMin })),
      name: name.trim(),
      phoneDigits: normalizePhone(phone),
      createdAtISO: new Date().toISOString(),
    };

    addBooking(booking);
    setAllBookings((prev) => [...prev, booking]);
    router.push(`/bookings/confirm?bookingId=${encodeURIComponent(id)}`);
  };

  const defaultTimeLabel = `${toHHMM(DAY_START)}–${toHHMM(DAY_END)}`;
  const earlyLabel = `${toHHMM(FULL_START)}–${toHHMM(DAY_START)}`;
  const lateLabel = `${toHHMM(DAY_END)}–${toHHMM(FULL_END)}`;

  return (
    <main
      style={{
        padding: isMobile ? 16 : 24,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 1120,
        width: "100%",
        margin: "0 auto",
        minWidth: 0,
      }}
    >
      <h1>새 예약</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(360px, 420px) minmax(520px, 1fr)",
          gap: 16,
          alignItems: "start",
          minWidth: 0,
        }}
      >
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, minWidth: 0 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 8 }}>장소 선택 (복수 선택 가능 / 1건 예약)</div>

            <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
              {PLACES.map((p) => {
                const checked = selectedPlaceIds.has(p.id);
                const idx = placePhotoIndex[p.id] ?? 0;
                const src = p.imageSrcs[idx];

                return (
                  <label
                    key={p.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "20px 72px 1fr",
                      alignItems: "center",
                      gap: 10,
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 10,
                      cursor: "pointer",
                      userSelect: "none",
                      background: checked ? "#f9fafb" : "white",
                      minWidth: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedPlaceIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(p.id)) next.delete(p.id);
                          else next.add(p.id);
                          return next;
                        });
                      }}
                    />

                    <div
                      style={{
                        width: 72,
                        height: 48,
                        borderRadius: 10,
                        overflow: "hidden",
                        border: "1px solid #e5e7eb",
                        background: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
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
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => {
                          const el = e.currentTarget;
                          el.style.display = "none";
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                      <strong style={{ color: "#111827" }}>{p.name}</strong>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>체크해서 선택 / 사진 클릭하면 전환</span>
                    </div>
                  </label>
                );
              })}
            </div>

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
              <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>장소를 최소 1개 선택하세요.</div>
            ) : (
              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                선택됨: <span style={{ color: "#111827" }}>{selectedPlaces.map((p) => p.name).join(", ")}</span>
              </div>
            )}

            {showSoundNotice ? (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 12,
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
            ) : null}
          </div>

          <Calendar
            value={date as CalendarValue}
            onChange={(v) => {
              const next = Array.isArray(v) ? v[0] : v;
              setDate(next ?? null);
            }}
            minDate={new Date()}
            calendarType="gregory"
            locale="ko-KR"
            tileContent={({ date: tileDate, view }) => {
              if (view !== "month") return null;
              const iso = dateToISO(tileDate);
              if (!bookedDateSet.has(iso)) return null;
              return (
                <div
                  style={{
                    marginTop: 2,
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "#ef4444", display: "inline-block" }} />
                </div>
              );
            }}
          />

          {dateISO ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
              {bookingsOfDay.length === 0 ? <span>이 날짜에는 예약이 없습니다.</span> : <span>이 날짜 예약 {bookingsOfDay.length}건</span>}
            </div>
          ) : null}
        </div>

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, minWidth: 0 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>시간 선택 (예약된 시간은 선택 불가)</h2>

          {!date ? (
            <p style={{ color: "#6b7280", marginBottom: 0 }}>왼쪽에서 날짜를 먼저 선택하세요.</p>
          ) : (
            <>
              <p style={{ color: "#6b7280", marginTop: 0 }}>
                선택 날짜: <strong style={{ color: "#111827" }}>{formatKoreanDate(date)}</strong>
              </p>

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

              <SlotGrid
                title="기본 시간"
                subtitle={`${defaultTimeLabel} (30분 단위)`}
                slots={slotsMain}
                reservedKeys={reservedSlotKeysForSelectedPlaces}
                selectedKeys={selectedKeys}
                onToggleKey={onToggleSlotKey}
              />

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  background: "#fafafa",
                }}
              >
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>확장 시간 (필요 시)</div>
                  <div style={{ fontWeight: 900, color: "#111827" }}>
                    {earlyLabel} / {lateLabel}
                  </div>
                </div>

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
                  <span style={{ fontSize: 13, color: "#111827", fontWeight: 800 }}>9시 전 / 21시 이후(24:00) 펼치기</span>
                </label>
              </div>

              {showExtended ? (
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
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
              ) : null}

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>모임 성격</span>
                  <div style={{ display: "grid", gap: 8 }}>
                    <select
                      value={meetingPreset}
                      onChange={(e) => setMeetingPreset(e.target.value as MeetingSelectValue)}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: "10px 12px",
                        outline: "none",
                        background: "white",
                      }}
                    >
                      <option value="" disabled>
                        모임성격을 선택해주세요
                      </option>
                      {MEETING_PRESETS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>

                    {meetingPreset === "기타" ? (
                      <input
                        value={meetingCustom}
                        onChange={(e) => setMeetingCustom(e.target.value)}
                        placeholder="예: 찬양연습, 세미나, 상담 등"
                        style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", outline: "none" }}
                      />
                    ) : null}
                  </div>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>이름</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", outline: "none" }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>전화번호</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="010-1234-5678"
                    style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", outline: "none" }}
                  />
                  {!phone || isValidPhoneKR(phone) ? null : (
                    <span style={{ fontSize: 12, color: "#ef4444" }}>전화번호를 확인해주세요 (숫자 10~11자리)</span>
                  )}
                </label>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                <div style={{ color: "#6b7280", fontSize: 14 }}>선택 요약</div>

                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>장소</div>
                  <div style={{ color: "#111827" }}>{selectedPlaces.length ? selectedPlaces.map((p) => p.name).join(", ") : "—"}</div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>모임 성격</div>
                  <div style={{ color: "#111827" }}>{meetingType || "—"}</div>
                </div>

                {selectedSlotsSorted.length === 0 ? (
                  <div style={{ marginTop: 10, color: "#6b7280" }}>시간을 선택하세요.</div>
                ) : (
                  <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                    {mergedRanges.map((r) => (
                      <li key={`${r.startMin}-${r.endMin}`}>
                        <strong>
                          {toHHMM(r.startMin)}–{toHHMM(r.endMin)}
                        </strong>
                      </li>
                    ))}
                  </ul>
                )}

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
