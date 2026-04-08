"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav({ title }: { title?: string }) {
  const pathname = usePathname();

  return (
    <nav className="navBar">
      <div className="navContainer">
        

        <div className="navRight">
          {/* ✅ '경배의 집' 메뉴 링크를 삭제하고, Places를 맨 앞으로 옮겼습니다. */}
          <Link href="/places" className={`navLink spaceBtn ${pathname === "/places" ? "active" : ""}`}>
            <span className="dot"></span> Places
          </Link>
          <Link href="/bookings" className={`navLink ${pathname === "/bookings" ? "active" : ""}`}>
            Bookings
          </Link>
          <Link href="/admin" className="adminLinkMini">
            Admin
          </Link>
        </div>
      </div>

      <style jsx>{`
        .navBar {
          background: #fff;
          border-bottom: 1px solid #eee;
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 60px;
          display: flex;
          align-items: center;
        }
        .navContainer {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .navLeft { display: flex; align-items: center; gap: 12px; }
        .logo { font-weight: 900; font-size: 1.1rem; color: #111; text-decoration: none; }
        .titleDivider { color: #94a3b8; font-size: 0.95rem; font-weight: 500; }
        .navRight { display: flex; align-items: center; gap: 20px; }
        .navLink { text-decoration: none; color: #64748b; font-size: 0.9rem; font-weight: 600; }
        .navLink.active { color: #3b82f6; }
        .spaceBtn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          padding: 6px 14px;
          border-radius: 20px;
          color: #475569;
        }
        .spaceBtn .dot { width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; }
        .adminLinkMini {
          margin-left: 10px;
          font-size: 0.7rem;
          color: #cbd5e1;
          border: 1px solid #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          text-decoration: none;
        }
      `}</style>
    </nav>
  );
}
