"use client";

import { useEffect, useState } from "react";

/** Debounce ค่าที่เปลี่ยนบ่อยๆ (เช่น ข้อความค้นหา) ก่อนนำไปยิง API จริง */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
