import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDeliveries,
  receiveDelivery,
  updateDeliveryStatus,
} from "@/lib/api";
import type { DeliveryStatus } from "@/lib/types";

const DELIVERIES_KEY = ["deliveries"];

export function useDeliveries() {
  return useQuery({
    queryKey: DELIVERIES_KEY,
    queryFn: fetchDeliveries,
    // Polling เบาๆ ทุก 20 วิ เพื่อให้สถานะ/ตำแหน่งจัดส่งอัปเดตใกล้เคียง real-time
    // โดยไม่ต้องเปิด WebSocket (เกินสโคป MVP)
    refetchInterval: 20_000,
  });
}

export interface ReceiveDeliveryParams {
  id: string;
  lotNumber: string;
}

export function useReceiveDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, lotNumber }: ReceiveDeliveryParams) => receiveDelivery(id, lotNumber),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: DELIVERIES_KEY });
      }
    },
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Exclude<DeliveryStatus, "DELIVERED" | "DISPATCHED">;
    }) => updateDeliveryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERIES_KEY });
    },
  });
}
