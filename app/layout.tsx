import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "경배의 집 공간 예약",
  description: "경배의 집 공간 예약 시스템",
};

const brandStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: "inherit",
  fontWeight: 800,
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <header
          style={{
            borderBottom: "1px solid #e5e7eb",
            padding: "12px 16px",
            position: "sticky",
            top: 0,
            background: "white",
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <Link href="/" style={brandStyle}>
              At Your Feet
            </Link>

            <Nav />
          </div>
        </header>

        {/* ✅ children를 960 박스에 가두지 말고, 페이지가 스스로 레이아웃/스크롤을 결정하게 둠 */}
        <main style={{ width: "100%", minWidth: 0 }}>{children}</main>
      </body>
    </html>
  );
}
