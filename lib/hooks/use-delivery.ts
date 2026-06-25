import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDeliveries,
  receiveDelivery,
  type ReceiveDeliveryParams,
} from "@/lib/mock-delivery";

const DELIVERIES_KEY = ["deliveries"];

export function useDeliveries() {
  return useQuery({
    queryKey: DELIVERIES_KEY,
    queryFn: fetchDeliveries,
  });
}

export function useReceiveDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ReceiveDeliveryParams) => receiveDelivery(params),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: DELIVERIES_KEY });
      }
    },
  });
}
