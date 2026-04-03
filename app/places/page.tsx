"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

type PlaceId = "worship" | "small1" | "small2";
type Place = {
  id: PlaceId;
  name: string;
  description: string;
  imageCount: number;
};

const PLACES: Place[] = [
  { id: "worship", name: "경배실 (우측 문 이용)", description: "경배와 찬양, 기도하고 말씀 나누는 공간", imageCount: 2 },
  { id: "small1", name: "소모임실 1 (경배실 안쪽)", description: "경배실 안쪽, 5명 내외 소그룹 공간", imageCount: 2 },
  { id: "small2", name: "소모임실 2 (중앙 홀)", description: "중앙 홀 공간, 15명 내외 수용 가능", imageCount: 2 },
];

function useIsMobile(maxWidth = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    } else {
      mq.addListener(apply);
      return () => mq.removeListener(apply);
    }
  }, [maxWidth]);

  return isMobile;
}

function SwipeGallery({
  placeId,
  count,
  height = 240,
}: {
  placeId: string;
  count: number;
  height?: number;
}) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(0);

  const scrollToIndex = React.useCallback((idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    el.scrollTo({ left: idx * w, behavior: "smooth" });
  }, []);

  // ✅ "점 색이 안 바뀜"은 일단 로직 크게 건드리지 않고 유지 (요청대로)
  const onScroll = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    const clamped = Math.max(0, Math.min(count - 1, idx));
    setActive(clamped);
  }, [count]);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    onScroll(); // init
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const images = Array.from({ length: count }).map((_, i) => ({
    src: `/places/${placeId}-${i + 1}.jpg`,
    alt: `${placeId} 사진 ${i + 1}`,
  }));

  const canPrev = active > 0;
  const canNext = active < count - 1;

  return (
    <div style={{ borderTop: "1px solid #e5e7eb", background: "#f3f4f6" }}>
      <div style={{ position: "relative" }}>
        {/* 스크롤 영역 */}
        <div
          ref={scrollerRef}
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "100%",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          aria-label="공간 사진 갤러리"
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {images.map((img, i) => (
            <div
              key={img.src}
              style={{
                position: "relative",
                height,
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
              }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="100vw"
                style={{ objectFit: "cover", objectPosition: "center", display: "block" }}
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* ✅ PC에서도 조작 가능하게 좌/우 버튼 */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollToIndex(Math.max(0, active - 1))}
              disabled={!canPrev}
              aria-label="이전 사진"
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 36,
                height: 36,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.65)",
                background: "rgba(17,24,39,0.45)",
                color: "#fff",
                fontSize: 22,
                lineHeight: "36px",
                cursor: canPrev ? "pointer" : "not-allowed",
                opacity: canPrev ? 1 : 0.35,
                userSelect: "none",
              }}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={() => scrollToIndex(Math.min(count - 1, active + 1))}
              disabled={!canNext}
              aria-label="다음 사진"
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 36,
                height: 36,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.65)",
                background: "rgba(17,24,39,0.45)",
                color: "#fff",
                fontSize: 22,
                lineHeight: "36px",
                cursor: canNext ? "pointer" : "not-allowed",
                opacity: canNext ? 1 : 0.35,
                userSelect: "none",
              }}
            >
              ›
            </button>
          </>
        )}

        {/* ✅ 점을 "사진 안"으로 오버레이 + 점 클릭 시 이동 */}
        {count > 1 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 10,
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none", // 컨테이너는 클릭 막고
            }}
            aria-label="사진 페이지 표시"
          >
            <div
              style={{
                display: "flex",
                gap: 7,
                padding: "8px 10px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.35)",
                backdropFilter: "blur(4px)",
                pointerEvents: "auto", // 점만 클릭 되게
              }}
            >
              {Array.from({ length: count }).map((_, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToIndex(i)}
                    aria-label={`${i + 1}번째 사진으로 이동`}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      border: 0,
                      padding: 0,
                      background: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                      cursor: "pointer",
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceCard({ place }: { place: Place }) {
  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        background: "#fff",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <div style={{ padding: 14, display: "grid", gap: 10, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 900,
              fontSize: 16,
              lineHeight: 1.25,
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {place.name}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#6b7280",
              lineHeight: 1.45,
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {place.description}
          </div>
        </div>

        {/* ✅ 상세보기 없음 / 카드 클릭 없음 / 예약만 */}
        <Link
          href={`/bookings/new?placeId=${encodeURIComponent(place.id)}`}
          style={{
            display: "block",
            padding: "12px 12px",
            borderRadius: 12,
            background: "#111827",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 900,
            textAlign: "center",
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          이 공간 바로 예약하기
        </Link>
      </div>

      <SwipeGallery placeId={place.id} count={place.imageCount} height={240} />
    </article>
  );
}

export default function PlacesPage() {
  const isMobile = useIsMobile(768);

  return (
    <main
      style={{
        padding: isMobile ? 16 : 24,
        maxWidth: 1120,
        width: "100%",
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        minWidth: 0,
      }}
    >
      <h1 style={{ fontSize: 24, margin: "0 0 14px 0" }}>공간 안내</h1>

      {/* ✅ 무조건 1열 */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, minWidth: 0 }}>
        {PLACES.map((p) => (
          <PlaceCard key={p.id} place={p} />
        ))}
      </section>
    </main>
  );
}
