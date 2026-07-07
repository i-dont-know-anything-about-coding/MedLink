import { useQuery } from "@tanstack/react-query";
import {
  fetchAlertQueue,
  fetchBloodAlertQueue,
  fetchBloodExpiryRedistribution,
  fetchExpiryRedistribution,
  fetchNetworkBloodOverview,
  fetchNetworkOverview,
} from "@/lib/api";

export function useNetworkOverview() {
  return useQuery({
    queryKey: ["network-overview"],
    queryFn: fetchNetworkOverview,
  });
}

export function useAlertQueue() {
  return useQuery({
    queryKey: ["alert-queue"],
    queryFn: fetchAlertQueue,
  });
}

/** GET /api/ai/expiry-redistribution — รายการล็อตยาเสี่ยงหมดอายุภายใน 90 วัน พร้อม AI แนะนำ รพ.ปลายทาง */
export function useExpiryRedistribution() {
  return useQuery({
    queryKey: ["expiry-redistribution"],
    queryFn: fetchExpiryRedistribution,
  });
}

// =========================================================================
// 🩸 คลังเลือด — คู่ขนานกับ hook ฝั่งยาด้านบน
// =========================================================================

/** GET /api/blood/network-overview — ใช้สร้างตัวเลือก รพ./หมู่เลือดตอนสร้างคำขอยืมเลือด */
export function useNetworkBloodOverview() {
  return useQuery({
    queryKey: ["network-blood-overview"],
    queryFn: fetchNetworkBloodOverview,
  });
}

/** GET /api/ai/blood/alert-queue — คิวแจ้งเตือนเลือดวิกฤตพร้อมคำแนะนำ AI */
export function useBloodAlertQueue() {
  return useQuery({
    queryKey: ["blood-alert-queue"],
    queryFn: fetchBloodAlertQueue,
  });
}

/** GET /api/ai/blood/expiry-redistribution — ถุงเลือดเสี่ยงหมดอายุใน 7 วัน พร้อม AI แนะนำ รพ.ปลายทาง */
export function useBloodExpiryRedistribution() {
  return useQuery({
    queryKey: ["blood-expiry-redistribution"],
    queryFn: fetchBloodExpiryRedistribution,
  });
}
