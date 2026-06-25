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
  hospitalInventory: (hospitalObjectId: string) =>
    `${API_BASE_URL}/api/hospitals/${hospitalObjectId}/inventory`,
  transfersInbox: `${API_BASE_URL}/api/transfers/inbox`,
  transfersOutbox: `${API_BASE_URL}/api/transfers/outbox`,
  transfers: `${API_BASE_URL}/api/transfers`,
  transferApprove: (id: string) => `${API_BASE_URL}/api/transfers/${id}/approve`,
  transferReject: (id: string) => `${API_BASE_URL}/api/transfers/${id}/reject`,
} as const;

export const HEALTH_ZONE = 8;
