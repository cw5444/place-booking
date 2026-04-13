"use client";

import * as React from "react";
// 경로 수정: 폴더 깊이는 그대로 app/폴더명이므로 ../../ 를 사용합니다.
import { useSupabase } from "../../auth/provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useSupabase();

  // 이제 세션 체크(role 확인 등)를 하지 않습니다. 
  // URL 주소를 아는 관리자라면 누구나 들어올 수 있게 합니다.
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        데이터 로드 중...
      </div>
    );
  }

  // 복잡한 세션 체크 로직을 제거하고 바로 children을 렌더링합니다.
  return <>{children}</>;
}
