"use client";

import React from "react";
import Link from "next/link";

export default function AdminPublicPage() {
  return (
    <div
      style={{
        padding: "60px 20px",
        textAlign: "center",
        fontFamily: "sans-serif",
        maxWidth: "500px",
        margin: "0 auto",
        lineHeight: "1.6",
      }}
    >
      {/* 기도 문구 – 줄바꿈 적용 */}
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: "normal",
          color: "#555",
          marginBottom: "40px",
          whiteSpace: "pre-line",
        }}
      >
        예수님이  존귀함 받으시는{"\n"}시간과 공간이 되길 기도합니다
      </h2>

      {/* 후원 계좌 섹션 – 작고 흐린 글씨 */}
      <div
        style={{
          margin: "40px 0",
          padding: "30px 20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "16px",
          border: "1px solid #eee",
        }}
      >
        <p style={{ fontWeight: "bold", marginBottom: "15px", color: "#333" }}>
          경배의집 후원계좌
        </p>
        <div style={{ fontSize: "0.85rem", color: "#999", lineHeight: "1.8" }}>
          <p style={{ margin: "4px 0" }}>카카오뱅크</p>
          <p style={{ margin: "4px 0", fontWeight: "500", color: "#888" }}>
            3333-02-7880053
          </p>
          <p style={{ margin: "4px 0" }}>배성진</p>
        </div>
      </div>

      {/* 홈으로 돌아가기 버튼 */}
      <div style={{ marginTop: "40px" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#000",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
