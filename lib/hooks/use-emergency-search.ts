import { useQuery } from "@tanstack/react-query";
import { searchDrugsByName, searchEmergencyDrug } from "@/lib/api";
import { getSession } from "@/lib/auth";

/** GET /api/drugs/search?q= — debounce ฝั่ง caller ก่อนเรียก (ดู useDebouncedValue) */
export function useDrugNameSearch(query: string) {
  return useQuery({
    queryKey: ["drug-search", query],
    queryFn: () => searchDrugsByName(query),
    enabled: query.trim().length >= 2,
  });
}

/** POST /api/ai/search-emergency — ค้นหา รพ.ที่มียาเหลือ เรียงตามเวลาขนส่งเร็วที่สุด (ต้อง login) */
export function useEmergencyDrugSearch(drugObjectId: string | null) {
  return useQuery({
    queryKey: ["emergency-search", drugObjectId],
    queryFn: () => searchEmergencyDrug(drugObjectId as string),
    enabled: Boolean(drugObjectId) && Boolean(getSession()),
  });
}
