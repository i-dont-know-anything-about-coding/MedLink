# StockSync — Frontend (MVP v3, Real Auth + Real Transfers)

Next.js 16 (App Router) + Tailwind CSS v4 + TypeScript + TanStack Query + lucide-react

ทำตามสเปก MVP 14 วัน: **Page 1 (Login) → Page 5 (Delivery)**
Page 6 (AI Log) และ Page 7 (Return & Clearing) **ตัดออกทั้งหน้าตามแผน**

## สิ่งที่เปลี่ยนจากเวอร์ชันก่อน

- **Login จริงแล้ว** — ต่อ `POST /api/auth/login` (JWT) ไม่มี hospital dropdown แล้ว
  เพราะ backend ดึงโรงพยาบาลจาก user account ให้อัตโนมัติ
- **Page 3 (Inventory)** ต่อ `GET /api/hospitals/:id/inventory` จริง (ไม่ filter จาก network-overview แบบเดิม)
- **Page 4 (Requests)** ต่อ `GET /api/transfers/inbox` และ `/outbox` จริงทั้งคู่ (ไม่มี mock list แล้ว)
- **Page 2 (Overview)** ตัดแผนที่ออก เปลี่ยนเป็น Stat Cards (จำนวน รพ.วิกฤต/ปกติ) + List แจ้งเตือนเรียงตามเวลาล่าสุด
- **Page 5 (Delivery)** ตัดแผนที่ออก เปลี่ยนเป็น List การจัดส่งแบบ Card เดียว มีปุ่มเซ็นรับยาในตัว, สถานะตรงกับ backend จริง (DISPATCHED/EN_ROUTE/DELIVERED/FAILED — ไม่มี ARRIVING)
- **ไอคอนทั้งหมดเปลี่ยนจาก emoji เป็น lucide-react**
- Panel ที่เนื้อหาอาจไม่เต็มจอ (เช่น คิวแจ้งเตือนหน้า Overview) มีปุ่มขยายเต็มจอ (`ExpandablePanel`)

## วิธีรัน

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 — จะ redirect ไปหน้า `/login` อัตโนมัติ

**Login:** ใช้ username/password ที่สร้างไว้แล้วใน `seedUsers.js` ของ backend
รูปแบบ `pharm_h10664` / `nurse_h10664` (ตามรหัส รพ.) รหัสผ่านทุกคน `password123`

## รัน Backend คู่กัน

```bash
cd Backend_Stocksync-main
npm install
npm run seed        # ใส่ข้อมูล hospital/drug/inventory ตัวอย่าง
node seedUsers.js    # ใส่ข้อมูล user/login ตัวอย่าง (รันแยกจาก seed.js)
npm run dev          # รันที่ port 5000
```

ถ้า backend รันคนละ host/port ให้สร้างไฟล์ `.env.local` แล้วกำหนด:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```
**สำคัญ: ห้ามมี `/` ต่อท้าย URL** — จะทำให้ path ต่อกันเป็น `//` แล้ว backend (เช่น Vercel) อาจ 308 redirect ซึ่งเบราว์เซอร์จะมองว่าเป็น CORS error

## Backend ที่แก้ไปด้วย (ดู `Backend_Stocksync-main/`)

แก้ 3 ไฟล์เพื่อให้ flow การยืม-คืนยาทำงานถูกต้องและให้ frontend มีข้อมูลพอจะแสดงผล:

| ไฟล์ | แก้อะไร | ทำไม |
|---|---|---|
| `controllers/transferController.js` | `createTransferRequest` รับ `from_hospital` จาก body แทนการ derive จาก token, เพิ่ม `getOutgoingTransfers` | เดิม backend บังคับให้ผู้ login เป็นผู้ให้ยืมเสมอ ซึ่งผิด — รพ.ไหนก็ต้องขอยืมจาก รพ.ไหนก็ได้ และไม่มี endpoint สำหรับ Outbox |
| `routes/transferRoutes.js` | เพิ่ม `GET /outbox` | คู่กับ controller ข้างบน |
| `controllers/authController.js` | `loginUser` populate hospital_ref แล้วส่ง hospital object (objectId, hospital_id, hospital_name, hospital_type) กลับไปในตัว login response | เดิมส่งแค่ Mongo ObjectId ของ รพ. กลับมา ไม่มีทางรู้ชื่อ/รหัส รพ. ของตัวเองเลยหลัง login |
| `controllers/inventoryController.js` | `network-overview` response เพิ่ม `hospital.objectId` และ `drug.objectId` | เดิมมีแต่รหัสมนุษย์อ่าน (เช่น H10664, TMT-224105) แต่ `POST /api/transfers` ต้องการ Mongo ObjectId ทำให้ frontend หา ID ที่ถูกต้องไปส่งไม่ได้เลย |

## ส่วนที่ยังเป็น Mock (รอ Backend เพิ่ม)

| ขาดอะไร | Mock อยู่ที่ไฟล์ | ใช้ที่หน้า |
|---|---|---|
| `GET/PATCH /api/delivery/...` (ไม่มี route นี้เลย) | `lib/mock-delivery.ts` | Page 5 (Delivery) |
| `PATCH /api/transfers/:id/cancel` (ไม่มี route นี้เลย) | `lib/hooks/use-transfers.ts` (`useCancelTransfer`) | Page 4 Outbox (ปุ่มยกเลิกคำขอ) — กดแล้วจะแสดง error แจ้งว่ายังใช้ไม่ได้ ไม่ได้ mock เงียบๆ |

ทุกจุด mock มีคอมเมนต์อธิบายไว้ในไฟล์ว่าขาด endpoint ไหน และต้องแก้ตรงไหนเมื่อ backend ทำเสร็จ

## โครงสร้างไฟล์

```
app/
  login/page.tsx                 — Page 1
  dashboard/
    layout.tsx                   — Topbar + Sidebar shell (auth guard)
    overview/page.tsx            — Page 2 (Stat Cards + Alert Queue)
    inventory/page.tsx           — Page 3
    requests/page.tsx            — Page 4 (Inbox/Outbox)
    delivery/page.tsx            — Page 5 (List การจัดส่ง)
components/
  dashboard/   — Topbar, TopbarSearch, Sidebar
  overview/    — NetworkStatCards, AlertQueue
  inventory/   — FilterPanel, InventoryTable
  requests/    — NewRequestForm, RequestCard, Approve/RejectModal
  delivery/    — DeliveryCard, ReceiveModal
  ui/          — Button, Modal, ExpandablePanel, FormControls
lib/
  api.ts                — fetch client ต่อ backend จริง พร้อม Authorization header
  auth.ts                — login/logout จริงผ่าน JWT, เก็บ session ใน localStorage
  mock-delivery.ts       — mock delivery + receive flow (ยังไม่มี backend route)
  hooks/                 — TanStack Query hooks ต่อข้อมูลแต่ละหน้า
  types.ts               — type ตรงกับ Mongoose models จริง
  use-countdown.ts       — countdown hook สำหรับ ETA (ใช้ในหน้า Delivery)
```

## Page ที่ตัดออกตามสเปก MVP

- **Page 6 (AI Suggestion Log)** — ไม่มีหน้านี้ใน routing เลย ไม่มี nav item
- **Page 7 (Return & Clearing)** — ไม่มีหน้านี้ใน routing เลย ไม่มี nav item

Backend ฝั่ง AI_SUGGESTION_LOG ยังบันทึก log ตามปกติ (ไม่กระทบ UI)
