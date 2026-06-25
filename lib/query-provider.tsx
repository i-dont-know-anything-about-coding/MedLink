"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

/**
 * Wraps the app with a single TanStack Query client.
 * - Realtime/Socket.io ถูกตัดออกจาก MVP ตามสเปก ดังนั้นไม่ตั้ง refetchInterval อัตโนมัติ
 * - หน้าที่ต้องการความสดของข้อมูล (Overview, Delivery) ใช้ปุ่ม "รีเฟรช" แทน (manual refetch)
 */
export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
