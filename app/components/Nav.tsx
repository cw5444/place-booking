"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabase } from "../auth/provider";

const baseLinkStyle = { padding: "8px 12px", borderRadius: 8, textDecoration: "none", color: "inherit", fontSize: "14px", fontWeight: 500 } as const;
const adminEmails = ["cw5444@gmail.com", "24umut@gmail.com"];

export default function Nav() {
  const pathname = usePathname();
  const { session } = useSupabase();
  
  // ✅ 세션 정보가 실제로 있고, 이메일이 관리자 리스트에 있을 때만 true
  const isAdmin = !!(session?.user?.email && adminEmails.includes(session.user.email));

  const links = [
    { href: "/", label: "Home" },
    { href: "/places", label: "장소 선택" },
    { href: "/bookings", label: "예약 현황" }, // 👈 이름 변경 완료
  ];

  const adminLinks = [
    { href: "/admin", label: "🛠️ 대시보드" },
    { href: "/admin/slots", label: "📅 슬롯 차단" },
    { href: "/admin/bookings", label: "📬 예약 승인" },
  ];

  return (
    <header style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "20px", padding: "10px 0" }}>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} style={{ ...baseLinkStyle, background: pathname === l.href ? "#111827" : "transparent", color: pathname === l.href ? "white" : "#4b5563" }}>{l.label}</Link>
        ))}
        {/* ✅ isAdmin 일 때만 관리자 메뉴가 보입니다 */}
        {isAdmin && (
          <>
            <div style={{ width: "1px", height: "20px", background: "#d1d5db", margin: "0 8px" }} />
            {adminLinks.map((l) => (
              <Link key={l.href} href={l.href} style={{ ...baseLinkStyle, background: pathname.startsWith(l.href) ? "#ef4444" : "#fef2f2", color: pathname.startsWith(l.href) ? "white" : "#b91c1c" }}>{l.label}</Link>
            ))}
          </>
        )}
      </nav>
    </header>
  );
}
