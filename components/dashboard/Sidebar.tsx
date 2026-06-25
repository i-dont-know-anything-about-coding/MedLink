"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, FileText, Truck } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/overview", label: "ภาพรวม", Icon: LayoutDashboard },
  { href: "/dashboard/inventory", label: "คลังยา", Icon: Package },
  { href: "/dashboard/requests", label: "คำขอ", Icon: FileText },
  { href: "/dashboard/delivery", label: "จัดส่ง", Icon: Truck },
  // Page 6 (AI Suggestion Log) ตัดออกจาก MVP ทั้งหน้าตามสเปก — ไม่มี nav item นี้โดยตั้งใจ
] as const;

interface SidebarProps {
  requestBadgeCount?: number;
}

export default function Sidebar({ requestBadgeCount }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex w-16 flex-shrink-0 flex-col items-center gap-1 border-r border-border bg-panel py-4">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex w-14 flex-col items-center gap-1 rounded-lg py-2.5 text-[10px] transition-colors ${
              active
                ? "bg-accent-dim text-accent"
                : "text-text-lo hover:bg-panel-hover hover:text-text-hi"
            }`}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{label}</span>
            {href === "/dashboard/requests" &&
              !!requestBadgeCount &&
              requestBadgeCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 font-data text-[9px] font-semibold text-white">
                  {requestBadgeCount}
                </span>
              )}
          </Link>
        );
      })}
    </nav>
  );
}
