"use client";

import { useRouter } from "next/navigation";
import { Power } from "lucide-react";
import { logout } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { HEALTH_ZONE } from "@/lib/constants";
import type { SessionUser } from "@/lib/types";
import TopbarSearch from "@/components/dashboard/TopbarSearch";

function initials(name: string): string {
  const parts = name.replace(/^(ภก\.|พยาบาล|นพ\.)/, "").trim().split(" ");
  return parts[0]?.slice(0, 2) ?? "US";
}

export default function Topbar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { showToast } = useToast();

  async function handleLogout() {
    await logout();
    showToast("ออกจากระบบแล้ว", "info");
    router.replace("/login");
  }

  return (
    <header className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-border bg-panel px-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-data text-[14px] font-semibold text-white">
        M
      </div>
      <span className="rounded-md bg-bg px-2.5 py-1 text-[11px] text-text-lo">
        เขตสุขภาพ {HEALTH_ZONE}
      </span>

      <TopbarSearch />

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-bg px-2.5 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-dim text-[11px] font-medium text-accent">
            {initials(user.name)}
          </div>
          <span className="text-[12px] text-text-hi">
            {user.name} ({user.hospitalName})
          </span>
        </div>
        <button
          title="ออกจากระบบ"
          onClick={handleLogout}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-lo transition-colors hover:bg-panel-hover hover:text-critical"
        >
          <Power size={15} />
        </button>
      </div>
    </header>
  );
}