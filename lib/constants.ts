/**
 * Backend จริงรันที่ Express server (server.js, app.listen(PORT=5000))
 * ตั้งค่า NEXT_PUBLIC_API_BASE_URL ใน .env.local ถ้า backend รันคนละ host/port
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const API_ROUTES = {
  login: `${API_BASE_URL}/api/auth/login`,
  logout: `${API_BASE_URL}/api/auth/logout`,
  networkOverview: `${API_BASE_URL}/api/inventory/network-overview`,
  alertQueue: `${API_BASE_URL}/api/ai/alert-queue`,
  expiryRedistribution: `${API_BASE_URL}/api/ai/expiry-redistribution`,
  searchEmergency: `${API_BASE_URL}/api/ai/search-emergency`,
  drugSearch: (q: string) =>
    `${API_BASE_URL}/api/drugs/search?q=${encodeURIComponent(q)}`,
  hospitalInventory: (hospitalObjectId: string) =>
    `${API_BASE_URL}/api/hospitals/${hospitalObjectId}/inventory`,
  transfersInbox: `${API_BASE_URL}/api/transfers/inbox`,
  transfersOutbox: `${API_BASE_URL}/api/transfers/outbox`,
  transfers: `${API_BASE_URL}/api/transfers`,
  transferApprove: (id: string) => `${API_BASE_URL}/api/transfers/${id}/approve`,
  transferReject: (id: string) => `${API_BASE_URL}/api/transfers/${id}/reject`,
  deliveries: `${API_BASE_URL}/api/delivery`,
  deliveryStatus: (id: string) => `${API_BASE_URL}/api/delivery/${id}/status`,
  deliveryReceive: (id: string) => `${API_BASE_URL}/api/delivery/${id}/receive`,
  // 🩸 คลังเลือด — คู่ขนานกับ endpoint ฝั่งยาด้านบน
  networkBloodOverview: `${API_BASE_URL}/api/blood/network-overview`,
  bloodAlertQueue: `${API_BASE_URL}/api/ai/blood/alert-queue`,
  bloodExpiryRedistribution: `${API_BASE_URL}/api/ai/blood/expiry-redistribution`,
  searchEmergencyBlood: `${API_BASE_URL}/api/ai/blood/search-emergency`,
  hospitalBloodInventory: (hospitalObjectId: string) =>
    `${API_BASE_URL}/api/hospitals/${hospitalObjectId}/blood-inventory`,
} as const;

export const HEALTH_ZONE = 8;

/**
 * Longdo Map API Key — ต้องตั้งค่าใน .env.local (root โปรเจกต์ FE):
 *   NEXT_PUBLIC_LONGDO_MAP_API_KEY=...
 * ขอ key ได้ฟรีที่ https://map.longdo.com/api (ไม่ต้องผูกบัตรเครดิต)
 * ดูรายละเอียดที่ README.md หัวข้อ "Longdo Map Setup"
 */
export const LONGDO_MAP_API_KEY = process.env.NEXT_PUBLIC_LONGDO_MAP_API_KEY ?? "";
