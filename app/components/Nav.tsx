"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseLinkStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: "inherit",
} as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/places", label: "Places" },
    { href: "/bookings", label: "Bookings" },
  ];

  return (
    <nav style={{ display: "flex", gap: 8 }}>
      {links.map((l) => {
        const active = isActive(pathname, l.href);

        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              ...baseLinkStyle,
              background: active ? "#111827" : "transparent",
              color: active ? "white" : "inherit",
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
