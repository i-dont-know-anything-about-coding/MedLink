"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

/**
 * บั๊กเดิม: getServerSnapshot() คืนค่า null เสมอ (เพราะฝั่ง server ไม่มี window/localStorage)
 * ตอนกด F5 รีโหลดหน้าทั้งหน้า ระหว่างที่ client ยังไม่ได้ค่า session จริงจาก localStorage
 * (render แรกสุดตอน hydrate จะใช้ค่า server snapshot ก่อน) ค่า `user` ที่เห็นจะเป็น null
 * เหมือนกับกรณี "ไม่มี session จริง ๆ" ทุกประการ — ถ้า effect เช็คแค่ `if (!user)` แล้ว
 * ดันทำงานในช่วงนั้นพอดี จะ redirect ออกไปหน้า login ทั้งที่ session ยังอยู่จริงในเครื่อง
 *
 * แก้โดยแยก 2 สถานะที่หน้าตาเหมือนกัน (ยัง "ไม่รู้"  vs "รู้แล้วว่าไม่มี session") ออกจากกัน
 * ด้วย sentinel คนละตัว: LOADING (แค่ค่าเริ่มต้นตอนยังไม่ได้เช็ค localStorage จริง)
 * กับ UNAUTHENTICATED (เช็ค localStorage แล้วจริง ๆ ว่าไม่มี token) — effect จะ redirect
 * ก็ต่อเมื่อเจอ UNAUTHENTICATED เท่านั้น ไม่มีทาง false-positive จาก LOADING อีกต่อไป
 * ไม่ว่า render รอบไหนจะยิง effect นี้ก่อน/หลังก็ตาม
 */
const LOADING = Symbol("session-loading");
const UNAUTHENTICATED = Symbol("session-unauthenticated");
type SessionSnapshot = SessionUser | typeof LOADING | typeof UNAUTHENTICATED;

// Cache snapshot ไว้ — useSyncExternalStore ต้องการให้ getSnapshot
// return reference เดิมถ้าข้อมูลไม่เปลี่ยน มิฉะนั้น React จะ loop ไม่หยุด
let cachedSnapshot: SessionUser | typeof UNAUTHENTICATED = UNAUTHENTICATED;
let cachedToken: string | null = null;

function getClientSnapshot(): SessionSnapshot {
  const fresh = getSession();
  const freshToken = fresh?.token ?? null;
  if (freshToken !== cachedToken) {
    cachedToken = freshToken;
    cachedSnapshot = fresh ?? UNAUTHENTICATED;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): SessionSnapshot {
  return LOADING;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useRequireSession(): SessionUser | null {
  const router = useRouter();
  const snapshot = useSyncExternalStore<SessionSnapshot>(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  // redirect เฉพาะตอนที่เช็ค localStorage ฝั่ง client แล้วจริง ๆ ว่าไม่มี session
  // (UNAUTHENTICATED) เท่านั้น — ไม่ใช่ตอนที่ยังโหลดอยู่ (LOADING)
  useEffect(() => {
    if (snapshot === UNAUTHENTICATED) {
      router.replace("/login");
    }
  }, [snapshot, router]);

  return snapshot === LOADING || snapshot === UNAUTHENTICATED ? null : snapshot;
}
