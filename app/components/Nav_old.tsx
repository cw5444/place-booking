"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabase } from "../auth/provider";

const baseLinkStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: "inherit",
  fontSize: "14px",
  fontWeight: 500,
} as const;

const adminEmails = ["cw5444@gmail.com", "24umut@gmail.com"];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // 정확히 일치하거나 하위 경로일 때 활성화
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

export default function Nav() {
  const pathname = usePathname();
  const { session } = useSupabase();

  // 로그인한 사용자가 관리자인지 확인
  const isAdmin = session?.user?.email && adminEmails.includes(session.user.email);

  // 기본 메뉴
  const links = [
    { href: "/", label: "Home" },
    { href: "/places", label: "장소 선택" },
    { href: "/bookings", label: "내 예약 내역" },
  ];

  // 관리자 전용 메뉴 (로그인 시에만 추가)
  const adminLinks = [
    { href: "/admin", label: "🛠️ 대시보드" },
    { href: "/admin/slots", label: "📅 슬롯 차단" },
    { href: "/admin/bookings", label: "📬 예약 승인" },
  ];

  return (
    <header style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "20px", padding: "10px 0" }}>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {/* 일반 메뉴 출력 */}
        {links.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                ...baseLinkStyle,
                background: active ? "#111827" : "transparent",
                color: active ? "white" : "#4b5563",
              }}
            >
              {l.label}
            </Link>
          );
        })}

        {/* 관리자일 때만 구분선과 관리자 메뉴 출력 */}
        {isAdmin && (
          <>
            <div style={{ width: "1px", height: "20px", background: "#d1d5db", margin: "0 8px" }} />
            {adminLinks.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    ...baseLinkStyle,
                    background: active ? "#ef4444" : "#fef2f2", // 관리자 메뉴는 붉은 계열로 구분
                    color: active ? "white" : "#b91c1c",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </header>
  );
}
