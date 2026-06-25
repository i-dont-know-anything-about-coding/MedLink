"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { useRequireSession } from "@/lib/use-require-session";
import { usePendingInboxCount } from "@/lib/hooks/use-transfers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useRequireSession();
  const pendingInboxCount = usePendingInboxCount();

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg text-text-lo">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg">
      <Topbar user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar requestBadgeCount={pendingInboxCount} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
