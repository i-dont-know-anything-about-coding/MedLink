import { API_ROUTES } from "./constants";
import { authHeader } from "./auth";
import type {
  AlertQueueItem,
  ApiEnvelope,
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
