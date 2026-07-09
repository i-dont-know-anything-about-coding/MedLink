export interface RequestPrefill {
  itemType?: "DRUG" | "BLOOD";
  drugName: string;
  donorHospitalName: string;
  donorInventoryId?: string;
  /** ใส่มาตรงๆ เมื่อรู้ ObjectId ที่แน่ชัด (เช่น มาจาก AI expiry-redistribution หรือ emergency search) — แม่นยำกว่าการจับคู่ชื่อ */
  drugObjectId?: string;
  donorHospitalObjectId?: string;
  /** จำนวนแนะนำให้กรอกล่วงหน้า (เช่น จำนวนล็อตที่เสี่ยงหมดอายุที่อยากโอนย้ายทั้งหมด) */
  suggestedQuantity?: number;
  /** 🩸 ใช้เมื่อ itemType === "BLOOD" แทน drugObjectId */
  bloodGroup?: string;
  componentType?: string;
}

const PREFILL_KEY = "medlink_request_prefill";

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
