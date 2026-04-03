// app/places/[placeId]/PlaceImages.tsx
"use client";

import * as React from "react";
import Image from "next/image";

const FRAME_HEIGHT = 320;

type PlaceId = "worship" | "small1" | "small2";

export default function PlaceImages({
  placeId,
  placeName,
}: {
  placeId: PlaceId;
  placeName: string;
}) {
  const [idx, setIdx] = React.useState<0 | 1>(0);
  const src = `/places/${placeId}-${idx === 0 ? 1 : 2}.jpg`;

  return (
    <div style={{ width: "100%", minWidth: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setIdx(0)}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: idx === 0 ? "1px solid #111827" : "1px solid #e5e7eb",
            background: idx === 0 ? "#111827" : "#fff",
            color: idx === 0 ? "#fff" : "#111827",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          사진 1
        </button>

        <button
          type="button"
          onClick={() => setIdx(1)}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: idx === 1 ? "1px solid #111827" : "1px solid #e5e7eb",
            background: idx === 1 ? "#111827" : "#fff",
            color: idx === 1 ? "#fff" : "#111827",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          사진 2
        </button>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: FRAME_HEIGHT, // ✅ 높이 고정(항상 동일)
          borderRadius: 12,
          overflow: "hidden",
          background: "#f3f4f6",
          border: "1px solid #e5e7eb",
        }}
      >
        <Image
          src={src}
          alt={`${placeName} 사진 ${idx + 1}`}
          fill
          priority
          sizes="(max-width: 1120px) 100vw, 784px"
          style={{ objectFit: "cover", objectPosition: "center", display: "block" }}
        />
      </div>
    </div>
  );
}
