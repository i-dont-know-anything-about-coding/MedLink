"use client";

import { useEffect, useState } from "react";

function formatCountdownLabel(targetIso: string | null): string {
  if (!targetIso) return "—";
  const diffMs = new Date(targetIso).getTime() - Date.now();
  if (diffMs <= 0) return "ถึงแล้ว";
  const totalMinutes = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`;
}

/** นับเวลาถอยหลังถึง ETA แบบ derive ตอน render ทุก 30 วิ (ไม่ setState ค่าที่ derive ได้ใน effect) */
export function useCountdown(targetIso: string | null): string {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!targetIso) return;
    const interval = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(interval);
  }, [targetIso]);

  return formatCountdownLabel(targetIso);
}
