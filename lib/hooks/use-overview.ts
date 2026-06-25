import { useQuery } from "@tanstack/react-query";
import { fetchAlertQueue, fetchNetworkOverview } from "@/lib/api";

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
