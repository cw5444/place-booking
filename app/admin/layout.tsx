"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 1. 로딩 중일 때는 아무것도 하지 않음
    if (status === "loading") return;

    // 2. 비로그인 상태면 로그인 페이지로
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    // 3. 로그인은 됐는데 role이 admin이 아닌 경우 (as any로 타입 오류 해결)
    const userRole = (session?.user as any)?.role;
    
    console.log("현재 세션의 역할(Role):", userRole);

    if (userRole !== "admin") {
      alert("관리자 전용 페이지입니다.");
      router.replace("/");
    }
  }, [session, status, router]);

  // 로딩 중이거나 권한 확인 중일 때 보여줄 화면
  if (status === "loading") {
    return <div className="p-8 text-center text-gray-500">권한 확인 중...</div>;
  }

  // 권한이 admin인 경우에만 자식 컴포넌트(children)를 렌더링
  if (status === "authenticated" && (session?.user as any)?.role === "admin") {
    return <>{children}</>;
  }

  // 그 외의 경우(리다이렉트 전) 빈 화면
  return <div className="p-8 text-center text-gray-400">접근 권한이 없습니다.</div>;
}
