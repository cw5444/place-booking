"use client";

import React from "react";

type CalendarProps = {
  value?: Date | null;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, diff: number) {
  return new Date(d.getFullYear(), d.getMonth() + diff, 1);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function clampTimeToNoon(d: Date) {
  // DST/타임존 흔들림 방지용으로 정오로 고정
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}
function isBeforeDay(a: Date, b: Date) {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return aa < bb;
}
function isAfterDay(a: Date, b: Date) {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return aa > bb;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function Calendar({ value = null, onChange, minDate, maxDate }: CalendarProps) {
  const initial = value ?? new Date();
  const [viewMonth, setViewMonth] = React.useState<Date>(() => startOfMonth(initial));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);

  const days: Array<{ date: Date; inMonth: boolean }> = [];

  // 달력은 일요일 시작. monthStart.getDay() 만큼 이전 달 채우기
  const leading = monthStart.getDay();
  for (let i = leading; i > 0; i--) {
    const d = new Date(monthStart);
    d.setDate(monthStart.getDate() - i);
    days.push({ date: d, inMonth: false });
  }

  // 이번 달
  for (let day = 1; day <= monthEnd.getDate(); day++) {
    days.push({ date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day), inMonth: true });
  }

  // trailing: 6주(42칸)로 맞추기
  while (days.length < 42) {
    const last = days[days.length - 1]!.date;
    const d = new Date(last);
    d.setDate(last.getDate() + 1);
    days.push({ date: d, inMonth: false });
  }

  const title = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;

  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "6px 10px", background: "white" }}
        >
          이전
        </button>

        <strong>{title}</strong>

        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "6px 10px", background: "white" }}
        >
          다음
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 10 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 12, color: "#6b7280", padding: "6px 0" }}>
            {w}
          </div>
        ))}

        {days.map(({ date, inMonth }, idx) => {
          const selected = value ? sameDay(date, value) : false;

          const dNoon = clampTimeToNoon(date);
          const disabled =
            (minDate ? isBeforeDay(dNoon, clampTimeToNoon(minDate)) : false) ||
            (maxDate ? isAfterDay(dNoon, clampTimeToNoon(maxDate)) : false);

          return (
            <button
              key={`${date.toISOString()}-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(clampTimeToNoon(date))}
              style={{
                padding: "10px 0",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: selected ? "#111827" : "white",
                color: selected ? "white" : inMonth ? "#111827" : "#9ca3af",
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
              aria-label={`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}
