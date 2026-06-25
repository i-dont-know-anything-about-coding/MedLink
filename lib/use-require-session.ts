"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

// Cache snapshot ไว้ — useSyncExternalStore ต้องการให้ getSnapshot
// return reference เดิมถ้าข้อมูลไม่เปลี่ยน มิฉะนั้น React จะ loop ไม่หยุด
let cachedSnapshot: SessionUser | null = null;

function getClientSnapshot(): SessionUser | null {
  const fresh = getSession();
  const freshToken = fresh?.token ?? null;
  const cachedToken = cachedSnapshot?.token ?? null;
  if (freshToken !== cachedToken) {
    cachedSnapshot = fresh;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): SessionUser | null {
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useRequireSession(): SessionUser | null {
  const router = useRouter();
  const user = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  return user;
}