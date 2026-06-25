import type { DeliveryRecord, DeliveryStatus } from "./types";

/**
 * Mock Delivery Layer
 * ----------------------------------------------------------------------
 * Backend จริงมี models/Delivery.js และ transferController.js สร้าง Delivery
 * record อัตโนมัติตอน approve (status DISPATCHED) แต่ยังไม่มี route ให้ GET/PATCH
 * ตรงๆ (ไม่มี routes/deliveryRoutes.js หรือ deliveryController.js)
 *
 * หน้า Delivery (Page 5) จึง mock ข้อมูลไว้ในไฟล์นี้ก่อน เพื่อให้ดีไซน์ Timeline +
 * ปุ่มเซ็นรับยาทำงานได้ตามสเปก โครงสร้างข้อมูลตรงกับ DeliveryRecord (models/Delivery.js)
 * ทุกฟิลด์ เพื่อสลับไปต่อ GET /api/delivery/:id, PATCH /api/delivery/:id/receive
 * ของจริงได้ทันทีโดยไม่ต้องแก้ UI — แก้แค่ฟังก์ชันในไฟล์นี้
 */

export interface MockDeliveryView extends DeliveryRecord {
  drug_generic_name: string;
  drug_trade_name: string;
  quantity: number;
  expected_lot_number: string;
  expiry_date: string;
  storage_condition: string;
  from_hospital_name: string;
  to_hospital_name: string;
}

const STORAGE_KEY = "stocksync_mock_deliveries";

const SEED_DELIVERIES: MockDeliveryView[] = [
  {
    _id: "DEL-20250115-001",
    request_ref: "REQ-001",
    ems_unit_name: "Ambulance Zone 8 / UD-01",
    route_details: { type: "LineString", coordinates: [] },
    estimated_arrival: new Date(Date.now() + 22 * 60 * 1000).toISOString(),
    delivery_status: "EN_ROUTE",
    received_by: null,
    received_at: null,
    drug_generic_name: "Alteplase 50mg (rt-PA)",
    drug_trade_name: "Actilyse® — Boehringer",
    quantity: 3,
    expected_lot_number: "LOT-A112-2024",
    expiry_date: "2026-03-20",
    storage_condition: "Cold Chain 2-8°C",
    from_hospital_name: "รพ.อุดรธานี (รพ.ศูนย์)",
    to_hospital_name: "รพ.กุมภวาปี",
  },
  {
    _id: "DEL-20250114-008",
    request_ref: "REQ-002",
    ems_unit_name: "Ambulance Zone 8 / UD-04",
    route_details: { type: "LineString", coordinates: [] },
    estimated_arrival: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    delivery_status: "DELIVERED",
    received_by: "พยาบาล ณัฐิดา",
    received_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    drug_generic_name: "Heparin Sodium 5,000 IU/ml",
    drug_trade_name: "Heparin® — GPO",
    quantity: 8,
    expected_lot_number: "LOT-H554-2024",
    expiry_date: "2025-09-10",
    storage_condition: "Room Temp",
    from_hospital_name: "รพ.อุดรธานี (รพ.ศูนย์)",
    to_hospital_name: "รพ.หนองหาน",
  },
];

function readAll(): MockDeliveryView[] {
  if (typeof window === "undefined") return SEED_DELIVERIES;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DELIVERIES));
    return SEED_DELIVERIES;
  }
  try {
    return JSON.parse(raw) as MockDeliveryView[];
  } catch {
    return SEED_DELIVERIES;
  }
}

function writeAll(deliveries: MockDeliveryView[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deliveries));
}

export async function fetchDeliveries(): Promise<MockDeliveryView[]> {
  await new Promise((r) => setTimeout(r, 200));
  return readAll();
}

export async function fetchDeliveryById(
  id: string
): Promise<MockDeliveryView | null> {
  await new Promise((r) => setTimeout(r, 150));
  return readAll().find((d) => d._id === id) ?? null;
}

export async function updateDeliveryStatus(
  id: string,
  status: DeliveryStatus
): Promise<MockDeliveryView | null> {
  await new Promise((r) => setTimeout(r, 150));
  const all = readAll();
  const idx = all.findIndex((d) => d._id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], delivery_status: status };
  writeAll(all);
  return all[idx];
}

export interface ReceiveDeliveryParams {
  id: string;
  lotNumber: string;
  receivedBy: string;
}

export interface ReceiveDeliveryResult {
  success: boolean;
  message: string;
  delivery?: MockDeliveryView;
}

/** PATCH /api/delivery/:id/receive (mock) — verify lot_number ตรงตามสเปก ก่อนบันทึก COMPLETED */
export async function receiveDelivery({
  id,
  lotNumber,
  receivedBy,
}: ReceiveDeliveryParams): Promise<ReceiveDeliveryResult> {
  await new Promise((r) => setTimeout(r, 250));
  const all = readAll();
  const idx = all.findIndex((d) => d._id === id);
  if (idx === -1) {
    return { success: false, message: "ไม่พบใบจัดส่งนี้ในระบบ" };
  }

  const delivery = all[idx];
  if (lotNumber.trim() !== delivery.expected_lot_number) {
    return {
      success: false,
      message: `Lot Number ไม่ตรงกับที่คาดหวัง (${delivery.expected_lot_number})`,
    };
  }

  const updated: MockDeliveryView = {
    ...delivery,
    delivery_status: "DELIVERED",
    received_by: receivedBy,
    received_at: new Date().toISOString(),
  };
  all[idx] = updated;
  writeAll(all);

  return { success: true, message: "เซ็นรับยาสำเร็จ", delivery: updated };
}
