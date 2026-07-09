/**
 * Shared types — สร้างให้ตรงกับ Mongoose Models และ Controllers จริงของ
 * Backend_Medlink-main (Express + MongoDB) ไม่ใช่ตามเอกสารสเปกเดิมที่อ้าง Next.js Route Handlers
 *
 * อ้างอิงไฟล์จริง:
 * - models/Hospital.js, Drug.js, Inventory.js, TransferRequest.js, Delivery.js, User.js, AISuggestionLog.js
 * - controllers/inventoryController.js -> GET /api/inventory/network-overview
 * - controllers/aiController.js        -> GET /api/ai/alert-queue
 * - controllers/transferController.js  -> POST/PATCH /api/transfers/*
 */

export type HospitalType = "A" | "B" | "M" | "F1" | "F2" | "F3";

export interface Hospital {
  _id: string;
  hospital_id: string;
  hospital_name: string;
  hospital_type: HospitalType;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  health_zone: number;
  network_group_id: string;
}

export type DrugCategory = "High-Alert Emergency" | "General" | "Controlled";

export interface Drug {
  _id: string;
  drug_id: string;
  generic_name: string;
  trade_name: string;
  category: DrugCategory;
}

export interface DrugLot {
  _id?: string;
  lot_number: string;
  expiry_date: string;
  quantity_in_lot: number;
}

export type StorageCondition = "Cold Chain 2-8°C" | "Room Temp";

/**
 * Mongoose Inventory document แบบเต็ม (มี lots[] และ quantity รวม)
 * ใช้กับ GET /api/hospitals/:hospital_id/inventory ซึ่ง populate เฉพาะ drug_ref
 * (ไม่ populate hospital_ref เพราะรู้ hospital อยู่แล้วจาก path param)
 */
export interface InventoryItem {
  _id: string;
  hospital_ref: string;
  drug_ref: Drug;
  quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  safety_stock_level: number;
  ward_location: string;
  storage_condition: StorageCondition;
  lots: DrugLot[];
  createdAt?: string;
  updatedAt?: string;
}

/** สถานะสต็อกที่คำนวณจาก backend (Page 2: 2 สถานะตามสเปก MVP — critical/normal, มี YELLOW เป็น Post-MVP) */
export type StockStatus = "RED" | "YELLOW" | "GREEN";

/** GET /api/inventory/network-overview ส่งกลับรายการนี้ */
export interface NetworkOverviewItem {
  inventory_id: string;
  hospital: {
    objectId: string; // Mongo _id ของ Hospital — ใช้ส่งเป็น from_hospital ตอนสร้างคำขอยืม
    id: string;
    name: string;
    type: HospitalType;
    coordinates: [number, number];
  };
  drug: {
    objectId: string; // Mongo _id ของ Drug — ใช้ส่งเป็น drug_ref ตอนสร้างคำขอยืม
    id: string;
    generic_name: string;
    trade_name: string;
    category: DrugCategory;
  };
  available_quantity: number;
  reserved_quantity: number;
  safety_stock_level: number;
  stock_status: StockStatus;
  ward_location: string;
}

/** GET /api/ai/alert-queue ส่งกลับรายการนี้ */
export interface AlertQueueItem {
  alert_id: string;
  drug_name: string;
  trade_name: string;
  category: DrugCategory;
  hospital_in_need: string;
  current_stock: number;
  safety_level: number;
  detected_at: string;
  ai_suggestion: {
    donor_inventory_id?: string;
    hospital_name: string;
    available_quantity?: number;
    distance_km?: number;
    confidence_score: number;
    reasoning: string;
  };
}

export type TransferStatus =
  | "PENDING"
  | "APPROVED"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

/** ตรงกับ models/BloodInventory.js enum จริง */
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
/** PRC=เม็ดเลือดแดงเข้มข้น, FFP=พลาสมาสดแช่แข็ง, PLT=เกล็ดเลือด */
export type ComponentType = "PRC" | "FFP" | "PLT";

export type TransferItemType = "DRUG" | "BLOOD";

/**
 * 🩸 item_type บอกว่าเป็นคำขอยา (DRUG) หรือคำขอเลือด (BLOOD)
 * - DRUG:  drug_ref มีค่า, blood_group/component_type เป็น undefined
 * - BLOOD: blood_group/component_type มีค่า, drug_ref เป็น undefined/null
 * (ดู models/TransferRequest.js — required แบบมีเงื่อนไขตาม item_type)
 */
export interface TransferRequestRecord {
  _id: string;
  from_hospital: string | Hospital;
  to_hospital: string | Hospital;
  item_type: TransferItemType;
  drug_ref?: string | Drug | null;
  blood_group?: BloodGroup;
  component_type?: ComponentType;
  created_by: string;
  approved_by: string | null;
  quantity_requested: number;
  quantity_approved: number;
  status: TransferStatus;
  return_due_date: string;
  return_status: "PENDING" | "RETURNED";
  rejection_reason: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BloodLot {
  _id?: string;
  bag_number: string;
  expiry_date: string;
  quantity_in_bag: number;
}

/**
 * Mongoose BloodInventory document แบบเต็ม — ใช้กับ
 * GET /api/hospitals/:hospital_id/blood-inventory (คลังเลือดของ รพ.ตัวเอง)
 */
export interface BloodInventoryItem {
  _id: string;
  hospital_ref: string;
  blood_group: BloodGroup;
  component_type: ComponentType;
  available_units: number;
  reserved_units: number;
  safety_unit_level: number;
  lots: BloodLot[];
  createdAt?: string;
  updatedAt?: string;
}

/** GET /api/blood/network-overview ส่งกลับรายการนี้ (คู่ขนานกับ NetworkOverviewItem ฝั่งยา) */
export interface NetworkBloodOverviewItem {
  blood_inventory_id: string;
  hospital: {
    objectId: string; // ใช้ส่งเป็น from_hospital ตอนสร้างคำขอยืมเลือด
    id: string;
    name: string;
    type: HospitalType;
    coordinates: [number, number];
  };
  blood_group: BloodGroup;
  component_type: ComponentType;
  available_units: number;
  reserved_units: number;
  safety_unit_level: number;
  stock_status: StockStatus;
}

/** GET /api/ai/blood/alert-queue ส่งกลับรายการนี้ */
export interface BloodAlertQueueItem {
  alert_id: string;
  blood_group: BloodGroup;
  component_type: ComponentType;
  hospital_in_need: string;
  current_stock: number;
  safety_level: number;
  detected_at: string;
  ai_suggestion: {
    donor_inventory_id?: string;
    hospital_name: string;
    available_units?: number;
    distance_km?: number;
    reasoning: string;
  };
}

/** GET /api/ai/blood/expiry-redistribution ส่งกลับรายการนี้ */
export interface BloodExpiryRedistributionItem {
  blood_inventory_id: string;
  blood_group: BloodGroup;
  component_type: ComponentType;
  from_hospital: string;
  expiring_bag: {
    bag_number: string;
    expiry_date: string;
    quantity: number;
  };
  ai_suggestion: {
    to_hospital_id?: string;
    hospital_name: string;
    current_stock?: number;
    distance_km?: number;
    reasoning: string;
  };
}

/** POST /api/ai/blood/search-emergency ส่งกลับรายการนี้ */
export interface EmergencyBloodSearchResult {
  blood_inventory_id: string;
  hospital_id: string;
  hospital_name: string;
  coordinates: { lng: number; lat: number };
  blood_group: BloodGroup;
  /** "ตรงกลุ่ม (Exact Match)" หรือ "กลุ่มทดแทนฉุกเฉิน (Compatible Match)" — AI cross-matching อัตโนมัติ */
  match_type: string;
  available_units: number;
  distance_km: number;
  estimated_time_minutes: number;
  is_estimate?: boolean;
}


export type DeliveryStatus = "PREPARING" | "DISPATCHED" | "EN_ROUTE" | "DELIVERED" | "FAILED";

export interface DeliveryRecord {
  _id: string;
  request_ref: string | TransferRequestRecord;
  ems_unit_name: string;
  route_details: {
    type: "LineString";
    coordinates: [number, number][];
  };
  estimated_arrival: string | null;
  delivery_status: DeliveryStatus;
  received_by: string | null;
  received_at: string | null;
  createdAt?: string;
  updatedAt?: string;
  // ฟิลด์แนบเพิ่มจาก GET /api/delivery (join จาก TransferRequest -> drug_ref/blood_group/from_hospital/to_hospital)
  item_type?: TransferItemType;
  drug_generic_name?: string;
  drug_trade_name?: string;
  blood_group?: BloodGroup | "";
  component_type?: ComponentType | "";
  /** ชื่อรายการพร้อมแสดงผล ใช้ได้ทั้งกรณียาและเลือดโดยไม่ต้องเช็ค item_type เอง */
  item_display_name?: string;
  quantity?: number;
  from_hospital_id?: string;
  from_hospital_name?: string;
  from_coordinates?: [number, number] | null; // [lng, lat]
  to_hospital_id?: string;
  to_hospital_name?: string;
  to_coordinates?: [number, number] | null; // [lng, lat]
}

/** GET /api/drugs/search?q= ส่งกลับรายการนี้ */
export interface DrugSearchResult {
  drugObjectId: string;
  drug_id: string;
  generic_name: string;
  trade_name: string;
  category: DrugCategory;
}

/** GET /api/ai/expiry-redistribution ส่งกลับรายการนี้ */
export interface ExpiryRedistributionItem {
  inventory_id: string;
  drug_id: string;
  drug_name: string;
  trade_name: string;
  category: DrugCategory;
  from_hospital_id: string;
  from_hospital: string;
  expiring_lot: {
    lot_number: string;
    expiry_date: string;
    quantity: number;
  };
  ai_suggestion: {
    to_hospital_id?: string;
    hospital_name: string;
    average_monthly_usage?: number;
    distance_km?: number;
    confidence_score: number;
    reasoning: string;
  };
}

/** POST /api/ai/search-emergency ส่งกลับรายการนี้ */
export interface EmergencySearchResult {
  inventory_id: string;
  hospital_id: string;
  hospital_name: string;
  coordinates: { lng: number; lat: number };
  available_quantity: number;
  distance_km: number;
  estimated_time_minutes: number;
  /** true = คำนวณจาก Longdo Route API ไม่สำเร็จ (เน็ตหลุด/ยังไม่ตั้งค่า key ฝั่ง backend) ใช้ค่าประมาณเส้นตรงแทน */
  is_estimate?: boolean;
  network_zone: string;
}

export type UserRole = "Chief_Pharmacist" | "Nurse" | "Admin";

/**
 * Session ที่เก็บไว้ฝั่ง client หลัง login จริงผ่าน POST /api/auth/login
 * Backend populate hospital_ref แล้วส่ง hospital object เต็มมาให้ในตัว login
 * response เลย (แก้ไว้ใน controllers/authController.js) จึงไม่ต้องไป resolve
 * ชื่อ/รหัส รพ. เพิ่มจากที่อื่นหลัง login
 */
export interface SessionUser {
  token: string;
  userId: string;
  name: string;
  username: string;
  role: UserRole;
  hospitalObjectId: string;
  hospitalCode: string;
  hospitalName: string;
  hospitalType: HospitalType;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}
