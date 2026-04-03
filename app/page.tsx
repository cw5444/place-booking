import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 0px)",
        padding: 24,
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(17,24,39,0.08), transparent 60%), radial-gradient(900px 500px at 90% 30%, rgba(99,102,241,0.12), transparent 55%), #ffffff",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* ✅ 홈 내부 헤더(At Your Feet/상단 링크) 제거: layout 헤더만 사용 */}

        <section
          style={{
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 20,
              background: "rgba(255,255,255,0.85)",
            }}
          >
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
              경배의 집 공간 예약
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 22,
                lineHeight: 1.6,
                letterSpacing: -0.2,
                color: "#111827",
              }}
            >
              경배찬양과 기도하기 좋은 경배실 공간과 5명 내외 소모임 공간, 10명 이상 모임(어린이
              독서공간 포함)이 가능한 공간을 자유롭게 사용하실 수 있습니다.
            </p>

            <p style={{ margin: "12px 0 0", color: "#374151", lineHeight: 1.6, fontSize: 20 }}>
              장소를 선택하고 예약해주세요.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <Link
                href="/places"
                style={{
                  display: "inline-block",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "#111827",
                  color: "white",
                  textDecoration: "none",
                  border: "1px solid #111827",
                }}
              >
                공간 안내 보기
              </Link>

              <Link
                href="/bookings/new"
                style={{
                  display: "inline-block",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "white",
                  color: "#111827",
                  textDecoration: "none",
                  border: "1px solid #e5e7eb",
                }}
              >
                바로 예약하기
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
