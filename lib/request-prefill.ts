export interface RequestPrefill {
  drugName: string;
  donorHospitalName: string;
  donorInventoryId?: string;
}

const PREFILL_KEY = "stocksync_request_prefill";

export function setRequestPrefill(prefill: RequestPrefill) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PREFILL_KEY, JSON.stringify(prefill));
}

export function consumeRequestPrefill(): RequestPrefill | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PREFILL_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(PREFILL_KEY);
  try {
    return JSON.parse(raw) as RequestPrefill;
  } catch {
    return null;
  }
}
