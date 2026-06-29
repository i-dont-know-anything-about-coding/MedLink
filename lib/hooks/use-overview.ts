import { useQuery } from "@tanstack/react-query";
import { fetchAlertQueue, fetchExpiryRedistribution, fetchNetworkOverview } from "@/lib/api";

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
