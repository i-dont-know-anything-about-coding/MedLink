import type { TransferRequestRecord } from "./types";

/**
 * Mock Transfer List Layer
 * ----------------------------------------------------------------------
 * Backend จริง (routes/transferRoutes.js) มีแค่ 3 endpoints:
 *   POST   /api/transfers              (สร้างคำขอ)
 *   PATCH  /api/transfers/:id/approve  (อนุมัติ + ตัดสต็อกแบบ Transaction)
 *   PATCH  /api/transfers/:id/reject   (ปฏิเสธ)
 * ยังไม่มี GET /api/transfers (list) ให้ดึงรายการ Inbox/Outbox มาแสดงผล
 *
 * หน้า Requests (Page 4) จึง mock "รายการที่แสดงผล" ไว้ในนี้ก่อน แต่ปุ่ม
 * ส่งคำขอ/อนุมัติ/ปฏิเสธ ทั้งหมดยิงไปที่ backend จริงผ่าน lib/api.ts
 * เมื่อ backend เพิ่ม GET /api/transfers แล้ว ให้ตัดไฟล์นี้ออกและดึงข้อมูลจริงแทน
 */

export interface MockTransferView extends TransferRequestRecord {
  drug_name: string;
  from_hospital_name: string;
  to_hospital_name: string;
  our_remaining_quantity?: number;
}

const STORAGE_KEY = "stocksync_mock_transfers";

const now = Date.now();

const SEED_TRANSFERS: MockTransferView[] = [
  {
    _id: "REQ-001",
    from_hospital: "H10664",
    to_hospital: "H11042",
    drug_ref: "TMT-224105",
    created_by: "U-pharm-kbv",
    approved_by: null,
    quantity_requested: 5,
    quantity_approved: 0,
    status: "PENDING",
    return_due_date: new Date(now + 30 * 86_400_000).toISOString(),
    return_status: "PENDING",
    rejection_reason: "",
    createdAt: new Date(now - 2 * 3_600_000).toISOString(),
    drug_name: "Tenecteplase 50mg Injection",
    from_hospital_name: "รพ.กุมภวาปี",
    to_hospital_name: "รพ.อุดรธานี (รพ.ศูนย์)",
    our_remaining_quantity: 15,
  },
  {
    _id: "REQ-002",
    from_hospital: "H11044",
    to_hospital: "H10664",
    drug_ref: "TMT-445566",
    created_by: "U-pharm-nkp",
    approved_by: null,
    quantity_requested: 10,
    quantity_approved: 0,
    status: "PENDING",
    return_due_date: new Date(now + 30 * 86_400_000).toISOString(),
    return_status: "PENDING",
    rejection_reason: "",
    createdAt: new Date(now - 18 * 3_600_000).toISOString(),
    drug_name: "Insulin Human Soluble 100 IU/mL",
    from_hospital_name: "รพ.หนองหาน",
    to_hospital_name: "รพ.อุดรธานี (รพ.ศูนย์)",
    our_remaining_quantity: 34,
  },
  {
    _id: "REQ-003",
    from_hospital: "H11049",
    to_hospital: "H10664",
    drug_ref: "TMT-554312",
    created_by: "U-pharm-non",
    approved_by: null,
    quantity_requested: 8,
    quantity_approved: 0,
    status: "PENDING",
    return_due_date: new Date(now + 30 * 86_400_000).toISOString(),
    return_status: "PENDING",
    rejection_reason: "",
    createdAt: new Date(now - 24 * 3_600_000).toISOString(),
    drug_name: "Norepinephrine 4mg/4mL Injection",
    from_hospital_name: "รพ.โนนสะอาด",
    to_hospital_name: "รพ.อุดรธานี (รพ.ศูนย์)",
    our_remaining_quantity: 22,
  },
  {
    _id: "REQ-010",
    from_hospital: "H10664",
    to_hospital: "H11042",
    drug_ref: "TMT-112233",
    created_by: "U-0001",
    approved_by: "U-0001",
    quantity_requested: 3,
    quantity_approved: 3,
    status: "IN_TRANSIT",
    return_due_date: new Date(now + 30 * 86_400_000).toISOString(),
    return_status: "PENDING",
    rejection_reason: "",
    createdAt: new Date(now - 36 * 3_600_000).toISOString(),
    drug_name: "Alteplase 50mg (rt-PA)",
    from_hospital_name: "รพ.อุดรธานี (รพ.ศูนย์)",
    to_hospital_name: "รพ.กุมภวาปี",
  },
  {
    _id: "REQ-011",
    from_hospital: "H10664",
    to_hospital: "H11044",
    drug_ref: "TMT-994321",
    created_by: "U-0001",
    approved_by: "U-0001",
    quantity_requested: 10,
    quantity_approved: 8,
    status: "COMPLETED",
    return_due_date: new Date(now - 5 * 86_400_000).toISOString(),
    return_status: "RETURNED",
    rejection_reason: "",
    createdAt: new Date(now - 50 * 3_600_000).toISOString(),
    drug_name: "Heparin Sodium 5,000 IU/ml",
    from_hospital_name: "รพ.อุดรธานี (รพ.ศูนย์)",
    to_hospital_name: "รพ.หนองหาน",
  },
];

function readAll(): MockTransferView[] {
  if (typeof window === "undefined") return SEED_TRANSFERS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TRANSFERS));
    return SEED_TRANSFERS;
  }
  try {
    return JSON.parse(raw) as MockTransferView[];
  } catch {
    return SEED_TRANSFERS;
  }
}

function writeAll(list: MockTransferView[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function fetchMockTransfers(): Promise<MockTransferView[]> {
  await new Promise((r) => setTimeout(r, 200));
  return readAll();
}

export function upsertMockTransfer(record: MockTransferView) {
  const all = readAll();
  const idx = all.findIndex((t) => t._id === record._id);
  if (idx === -1) {
    all.unshift(record);
  } else {
    all[idx] = { ...all[idx], ...record };
  }
  writeAll(all);
}

export function patchMockTransferStatus(
  id: string,
  patch: Partial<MockTransferView>
) {
  const all = readAll();
  const idx = all.findIndex((t) => t._id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch };
  writeAll(all);
}
