"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// title을 받을 수 있도록 인터페이스 추가
interface NavProps {
  title?: string;
}

export default function Nav({ title }: NavProps) {
  const pathname = usePathname();

  return (
    <nav className="navContainer">
      <div className="navInner">
        <div className="navLeft">
          <Link href="/" className="navLogo">
            🏠 <span className="logoText">경배의 집</span>
          </Link>
          {title && <span className="navSeparator">/</span>}
          {title && <span className="navCurrentTitle">{title}</span>}
        </div>

        <div className="navLinks">
          <Link href="/bookings" className={`navItem ${pathname === "/bookings" ? "active" : ""}`}>
            예약현황
          </Link>
          <Link href="/bookings/new" className={`navItem ${pathname === "/bookings/new" ? "active" : ""}`}>
            예약하기
          </Link>
        </div>
      </div>

      <style jsx>{`
        .navContainer {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e2e8f0;
        }
        .navInner {
          max-width: 1200px;
          margin: 0 auto;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
        }
        .navLeft {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .navLogo {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 800;
          font-size: 1.1rem;
          color: #1a202c;
          text-decoration: none;
        }
        .navSeparator {
          color: #cbd5e1;
          font-weight: 300;
        }
        .navCurrentTitle {
          font-weight: 600;
          color: #64748b;
          font-size: 0.95rem;
        }
        .navLinks {
          display: flex;
          gap: 20px;
        }
        .navItem {
          text-decoration: none;
          color: #64748b;
          font-weight: 500;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        .navItem.active {
          color: #3b82f6;
          font-weight: 700;
        }
        .navItem:hover {
          color: #1e293b;
        }
      `}</style>
    </nav>
  );
}
