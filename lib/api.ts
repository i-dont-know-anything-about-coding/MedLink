import { API_ROUTES } from "./constants";
import { authHeader } from "./auth";
import type {
  AlertQueueItem,
  ApiEnvelope,
  DeliveryRecord,
  DeliveryStatus,
  DrugSearchResult,
  EmergencySearchResult,
  ExpiryRedistributionItem,
  InventoryItem,
  NetworkOverviewItem,
  TransferRequestRecord,
} from "./types";

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  let body: ApiEnvelope<T> | undefined;
  try {
    body = await res.json();
  } catch {
    // เผื่อ response ไม่ใช่ JSON (เช่น server ล้ม)
  }
  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return body.data;
}

/** GET /api/inventory/network-overview — ใช้ปักหมุดแผนที่หน้า Overview (Page 2), ไม่ต้อง login */
export async function fetchNetworkOverview(): Promise<NetworkOverviewItem[]> {
  const res = await fetch(API_ROUTES.networkOverview);
  return parseJsonOrThrow<NetworkOverviewItem[]>(res);
}

/** GET /api/ai/alert-queue — คิวแจ้งเตือนวิกฤตพร้อมคำแนะนำ AI (Page 2), ไม่ต้อง login */
export async function fetchAlertQueue(): Promise<AlertQueueItem[]> {
  const res = await fetch(API_ROUTES.alertQueue);
  return parseJsonOrThrow<AlertQueueItem[]>(res);
}

/** GET /api/ai/expiry-redistribution — รายการยาเสี่ยงหมดอายุ พร้อม AI แนะนำ รพ.ปลายทางที่ควรโอนไปให้ (Page 2), ไม่ต้อง login */
export async function fetchExpiryRedistribution(): Promise<ExpiryRedistributionItem[]> {
  const res = await fetch(API_ROUTES.expiryRedistribution);
  return parseJsonOrThrow<ExpiryRedistributionItem[]>(res);
}

/** GET /api/drugs/search?q= — ค้นหายาด้วยชื่อสามัญ/ชื่อการค้า สำหรับช่องค้นหายาฉุกเฉินบน Topbar */
export async function searchDrugsByName(query: string): Promise<DrugSearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(API_ROUTES.drugSearch(query.trim()));
  return parseJsonOrThrow<DrugSearchResult[]>(res);
}

/**
 * POST /api/ai/search-emergency — ค้นหา รพ.ที่มียาตัวนี้เหลือพร้อมปล่อยยืม เรียงตามเวลาขนส่งที่เร็วที่สุด
 * ต้อง login (backend ดึง from_hospital_id จาก JWT อัตโนมัติ)
 */
export async function searchEmergencyDrug(drugId: string): Promise<EmergencySearchResult[]> {
  const res = await fetch(API_ROUTES.searchEmergency, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ drug_id: drugId }),
  });
  return parseJsonOrThrow<EmergencySearchResult[]>(res);
}

/**
 * GET /api/hospitals/:hospital_id/inventory — คลังยาของ รพ.ตัวเอง (Page 3)
 * ต้อง login (protect middleware) และ hospitalObjectId ต้องตรงกับ รพ.ที่ login อยู่เท่านั้น
 * (backend เช็คสิทธิ์เทียบกับ req.user.hospital_id จาก JWT ให้แล้ว)
 */
export async function fetchHospitalInventory(
  hospitalObjectId: string
): Promise<InventoryItem[]> {
  const res = await fetch(API_ROUTES.hospitalInventory(hospitalObjectId), {
    headers: authHeader(),
  });
  return parseJsonOrThrow<InventoryItem[]>(res);
}

/** GET /api/transfers/inbox — คำขอที่ รพ.เราเป็นผู้ให้ยืม รออนุมัติ (Page 4 Inbox), ต้อง login */
export async function fetchInboxTransfers(): Promise<TransferRequestRecord[]> {
  const res = await fetch(API_ROUTES.transfersInbox, { headers: authHeader() });
  return parseJsonOrThrow<TransferRequestRecord[]>(res);
}

/** GET /api/transfers/outbox — คำขอที่ รพ.เราส่งออกไปขอยืม (Page 4 Outbox), ต้อง login */
export async function fetchOutboxTransfers(): Promise<TransferRequestRecord[]> {
  const res = await fetch(API_ROUTES.transfersOutbox, { headers: authHeader() });
  return parseJsonOrThrow<TransferRequestRecord[]>(res);
}

/**
 * POST /api/transfers — สร้างคำขอยืมยาใหม่ (Page 4 New Request), ต้อง login
 * ส่งแค่ from_hospital (รพ.ต้นทาง/ผู้ให้ยืมที่เลือก) — backend จะดึง to_hospital
 * (รพ.ของเราเอง) จาก JWT token เสมอ ไม่ต้องส่งมาจากฝั่งเรา
 */
export interface CreateTransferPayload {
  from_hospital: string;
  drug_ref: string;
  quantity_requested: number;
}

export async function createTransferRequest(
  payload: CreateTransferPayload
): Promise<TransferRequestRecord> {
  const res = await fetch(API_ROUTES.transfers, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<TransferRequestRecord>(res);
}

/** PATCH /api/transfers/:id/approve — รองรับ Partial Fulfillment, ต้อง login + role Chief_Pharmacist */
export async function approveTransferRequest(
  id: string,
  quantityApproved?: number
): Promise<TransferRequestRecord> {
  const res = await fetch(API_ROUTES.transferApprove(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(
      quantityApproved ? { quantity_approved: quantityApproved } : {}
    ),
  });
  return parseJsonOrThrow<TransferRequestRecord>(res);
}

/** PATCH /api/transfers/:id/reject — บังคับกรอก rejection_reason, ต้อง login + role Chief_Pharmacist */
export async function rejectTransferRequest(
  id: string,
  rejectionReason: string
): Promise<TransferRequestRecord> {
  const res = await fetch(API_ROUTES.transferReject(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
  return parseJsonOrThrow<TransferRequestRecord>(res);
}

/** GET /api/delivery — รายการจัดส่งทั้งหมดที่ รพ.เราเกี่ยวข้อง (ต้นทางหรือปลายทาง), ต้อง login */
export async function fetchDeliveries(): Promise<DeliveryRecord[]> {
  const res = await fetch(API_ROUTES.deliveries, { headers: authHeader() });
  return parseJsonOrThrow<DeliveryRecord[]>(res);
}

/** PATCH /api/delivery/:id/status — เปลี่ยนสถานะระหว่างทาง (PREPARING/EN_ROUTE/FAILED), ต้อง login */
export async function updateDeliveryStatus(
  id: string,
  status: Exclude<DeliveryStatus, "DELIVERED" | "DISPATCHED">,
  estimatedArrival?: string
): Promise<DeliveryRecord> {
  const res = await fetch(API_ROUTES.deliveryStatus(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({
      delivery_status: status,
      ...(estimatedArrival ? { estimated_arrival: estimatedArrival } : {}),
    }),
  });
  return parseJsonOrThrow<DeliveryRecord>(res);
}

export interface ReceiveDeliveryResult {
  success: boolean;
  message: string;
  data?: DeliveryRecord;
}

/** PATCH /api/delivery/:id/receive — เซ็นรับยา (ตรวจ lot_number), ต้อง login */
export async function receiveDelivery(
  id: string,
  lotNumber: string
): Promise<ReceiveDeliveryResult> {
  const res = await fetch(API_ROUTES.deliveryReceive(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ lot_number: lotNumber }),
  });
  let body: ReceiveDeliveryResult | undefined;
  try {
    body = await res.json();
  } catch {
    // เผื่อ response ไม่ใช่ JSON
  }
  if (!body) {
    return { success: false, message: `Request failed (${res.status})` };
  }
  return body;
}
