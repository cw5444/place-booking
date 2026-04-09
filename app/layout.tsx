import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Nav from "./components/Nav";
import SupabaseProvider from "./auth/provider"; 

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* SessionProvider를 여기서 지우고, SupabaseProvider가 안에서 처리하도록 했습니다 */}
        <SupabaseProvider>
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

          <main style={{ width: "100%", minWidth: 0 }}>{children}</main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
