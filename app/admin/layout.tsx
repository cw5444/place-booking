// app/admin/layout.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession(); // session 데이터를 가져옵니다.

  useEffect(() => {
    if (status === "loading") return;

    // 1. 로그인 자체가 안 된 경우
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    // 2. 로그인은 됐는데 role이 admin이 아닌 경우
    // 콘솔에서 실제 어떤 값이 들어오는지 확인하는 로그 추가
    console.log("현재 세션의 역할(Role):", session?.user?.role);
    
    if (session?.user?.role !== "admin") {
      alert("관리자 전용 페이지입니다."); // 아까 보셨던 알림창의 범인이 여기일 확률이 높습니다.
      router.replace("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        관리자 권한 확인 중...
      </div>
    );
  }

  // 세션이 있고 역할이 admin일 때만 화면을 보여줌
  if (status === "authenticated" && session?.user?.role === "admin") {
    return <>{children}</>;
  }

  // 그 외의 경우(권한 확인 중 등)는 아무것도 보여주지 않음
  return null;
}
