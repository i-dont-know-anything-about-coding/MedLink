# MedLink — Frontend (MVP v4, AI Expiry Queue + Emergency Search + Real Delivery + Google Maps)

Next.js 16 (App Router) + Tailwind CSS v4 + TypeScript + TanStack Query + lucide-react

ทำตามสเปก MVP 14 วัน: **Page 1 (Login) → Page 5 (Delivery)**
Page 6 (AI Log) และ Page 7 (Return & Clearing) **ตัดออกทั้งหน้าตามแผน**

## สิ่งที่เปลี่ยนในรอบนี้ (v4)

- **Page 2 (Overview)** เพิ่มแผง **"ยาเสี่ยงหมดอายุ"** ข้าง คิวแจ้งเตือนวิกฤต — ดึงจาก
  `GET /api/ai/expiry-redistribution` แสดงล็อตยาที่จะหมดอายุใน 90 วัน พร้อม AI แนะนำ รพ.ปลายทาง
  ที่ควรรับยาไปใช้ก่อนหมดอายุ มีปุ่ม "สร้างฟอร์มโอนย้ายยา" ที่พรีฟิลฟอร์มขอยืมอัตโนมัติ
  (ปุ่มนี้จะกดได้เฉพาะตอน login อยู่ที่ รพ.ที่ AI แนะนำให้เป็นผู้รับยา เพราะฟอร์มขอยืมยาสร้างจากมุมมอง
  "เราขอยืม" เสมอ — รพ.ต้นทางที่มียาเสี่ยงหมดอายุจะเห็นข้อความ "รอ [รพ.ปลายทาง] กดสร้างคำขอ" แทน)
- **ค้นหายาฉุกเฉิน** — พิมพ์ชื่อยาใน TopbarSearch แล้วเลือกยาที่ตรงกัน จะเปิด Modal แสดงรายชื่อ
  โรงพยาบาลที่มียาเหลือพร้อมปล่อยยืม **เรียงตามเวลาขนส่งที่เร็วที่สุด** (คำนวณจาก
  `POST /api/ai/search-emergency` ซึ่งเรียก **Longdo Map "Calculate route" REST API จริง**
  เพื่อหาระยะทาง+เวลาตามถนนจริง ไม่ใช่เส้นตรงโดยประมาณแล้ว — ถ้า Longdo เรียกไม่สำเร็จราย รพ. ใด
  ระบบจะ fallback เป็นค่าประมาณเส้นตรงเฉพาะรายนั้นอัตโนมัติ และมีไอคอนเตือนกำกับไว้ที่การ์ดนั้น)
  กดปุ่ม "สร้างใบยืมยา" ที่การ์ดไหนก็ได้เพื่อพรีฟิลฟอร์มขอยืมไปยัง รพ.นั้นทันที — ใช้
  `GET /api/drugs/search?q=` (เพิ่มใหม่) สำหรับค้นหาชื่อยาแบบ debounce
- **Page 5 (Delivery)** เขียนใหม่ทั้งหน้า ต่อ backend จริงแล้ว (เลิก mock):
  - Pipeline สถานะใหม่ตรงกับที่ขอ: **อนุมัติ → เตรียมจัดส่ง (PREPARING) → กำลังจัดส่ง (EN_ROUTE) → ส่งมอบแล้ว (DELIVERED)**
    (ของเดิมเริ่มที่ DISPATCHED ทันทีตอนอนุมัติ ไม่มีขั้นเตรียมจัดส่งแยก)
  - Layout ใหม่: Sidebar รายการจัดส่งทั้งหมด + แผนที่เส้นทางจริง (Google Maps) + Timeline สถานะ/ปุ่มดำเนินการ
  - ปุ่ม "เริ่มจัดส่ง" (PREPARING → EN_ROUTE) และ "เซ็นรับยา" (EN_ROUTE → DELIVERED)
  - ต่อ `GET /api/delivery`, `PATCH /api/delivery/:id/status`, `PATCH /api/delivery/:id/receive` (เพิ่มใหม่ทั้งหมด)
- **แผนที่ Longdo Map จริง** ในหน้า Delivery — ใช้ Longdo Map **JavaScript API** (`map.Route` ค้นหา
  เส้นทางถนนจริงพร้อมคำนวณระยะทาง/เวลาให้อัตโนมัติ) แสดงเส้นทางจริงระหว่าง รพ.ต้นทาง-ปลายทางจากพิกัด
  GPS จริงในฐานข้อมูล ดูวิธีตั้งค่า API Key ด้านล่าง (ฟรี ไม่ต้องผูกบัตรเครดิต)

## ⚠️ ต้องตั้งค่า Longdo Map API Key ก่อนแผนที่จะแสดงผล

แผนที่ในหน้า Delivery ใช้ **Longdo Map JavaScript API** (เปลี่ยนจาก Google Maps Embed API เดิม
เพราะ Longdo ขอ Key ได้ฟรีทันที ไม่ต้องผูกบัตรเครดิตเหมือน Google) ต้องมี API Key จริงจาก Longdo
ก่อนแผนที่จะแสดงผล

### ขั้นตอนตั้งค่า

1. ไปที่ [https://map.longdo.com/api](https://map.longdo.com/api) แล้วเข้าสู่ระบบ (สมัครสมาชิกก่อนถ้ายังไม่มี)
2. กด **"สร้าง API Key ใหม่"**
3. กรอกฟอร์ม:
   - **โดเมนที่อนุญาต (Authorized Domain)**: ใส่ `localhost` (ตอน dev) และ domain จริงตอน deploy
     (ไม่ต้องระบุ `http://` หรือ `https://`)
   - ชื่อผู้ติดต่อ, เบอร์โทร, ประเภทการใช้งาน, ประเภทผลิตภัณฑ์ (เลือก "Longdo Map")
   - ติ๊กยอมรับข้อตกลงการใช้งาน
4. กด **"สร้าง API Key"** — ไม่ต้องผูกบัตรเครดิตใดๆ ได้ Key ทันที (ฟรี ใช้ได้ถึง 800,000
   ครั้ง/เดือน ซึ่งเกินพอสำหรับงานนี้)
5. เปิดไฟล์ **`.env.local`** ที่ root ของโปรเจกต์ frontend (สร้างไฟล์นี้ถ้ายังไม่มี — อยู่ระดับเดียวกับ
   `package.json`, path เต็ม: `MedLink-main/.env.local`) แล้วเพิ่มบรรทัด:

   ```
   NEXT_PUBLIC_LONGDO_MAP_API_KEY=คีย์จริงของคุณ...
   ```

6. รีสตาร์ท `npm run dev` (Next.js อ่าน `.env.local` ตอน start เท่านั้น ไม่ hot-reload ค่า env)
7. ถ้า deploy บน Vercel ต้องไปเพิ่ม environment variable ชื่อเดียวกันนี้ใน
   Project Settings → Environment Variables ด้วย ไม่งั้นจะ build ผ่านแต่แผนที่จะไม่ขึ้นบน production
   (และอย่าลืมเพิ่ม domain จริงของ Vercel ในหน้า "โดเมนที่อนุญาต" ที่ map.longdo.com/api ด้วย)

ถ้ายังไม่ได้ตั้งค่า Key, หน้า Delivery จะโชว์ข้อความแจ้งเตือนแทนแผนที่ (ไม่ error/พังทั้งหน้า) —
ดูโค้ดที่ `components/delivery/LongdoRouteMap.tsx`

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
cd Backend_Medlink-main
npm install
cp .env.example .env  # แล้วใส่ MONGO_URI, JWT_SECRET, LONGDO_MAP_API_KEY ของจริง
npm run seed        # ใส่ข้อมูล hospital/drug/inventory ตัวอย่าง
node seedUsers.js    # ใส่ข้อมูล user/login ตัวอย่าง (รันแยกจาก seed.js)
npm run dev          # รันที่ port 5000
```

⚠️ **`LONGDO_MAP_API_KEY` ใน backend `.env` เป็นคนละตัวแปรกับ `NEXT_PUBLIC_LONGDO_MAP_API_KEY`
ใน frontend `.env.local`** — ต้องตั้งค่าทั้งสองฝั่ง (ใช้ Longdo Key เดียวกันได้ ถ้า Authorized
Domain ครอบคลุมทั้ง frontend และ backend) ฝั่ง backend ใช้เรียก Longdo REST API คำนวณเส้นทางจริง
ใน `POST /api/ai/search-emergency`; ถ้าไม่ตั้งค่าจะ fallback เป็นค่าประมาณเส้นตรงอัตโนมัติ ไม่ error

ถ้า backend รันคนละ host/port ให้สร้างไฟล์ `.env.local` แล้วกำหนด:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_LONGDO_MAP_API_KEY=...
```
**สำคัญ: ห้ามมี `/` ต่อท้าย `NEXT_PUBLIC_API_BASE_URL`** — จะทำให้ path ต่อกันเป็น `//` แล้ว backend
(เช่น Vercel) อาจ 308 redirect ซึ่งเบราว์เซอร์จะมองว่าเป็น CORS error

## Backend ที่แก้ไปด้วยรอบนี้ (ดู `Backend_Medlink-main/`)

| ไฟล์ | แก้อะไร | ทำไม |
|---|---|---|
| `controllers/drugController.js` **(ใหม่)** | `searchDrugs` — ค้นหายาด้วย regex จาก generic_name/trade_name | TopbarSearch ต้องมี endpoint ค้นหายาแบบพิมพ์ทีละตัวอักษร (debounce) เพื่อหา drugObjectId ไปยิง `search-emergency` ต่อ |
| `routes/drugRoutes.js` **(ใหม่)** | `GET /api/drugs/search?q=` | คู่กับ controller ข้างบน |
| `controllers/deliveryController.js` **(ใหม่)** | `getDeliveries`, `updateDeliveryStatus`, `receiveDelivery` | หน้า Delivery เดิม mock ข้อมูลไว้เพราะไม่มี route จริงเลย ตอนนี้ต่อ `Delivery` model จริงแล้ว พร้อม join ข้อมูลยา/รพ./จำนวนจาก `TransferRequest` |
| `routes/deliveryRoutes.js` **(ใหม่)** | `GET /`, `PATCH /:id/status`, `PATCH /:id/receive` | คู่กับ controller ข้างบน |
| `models/Delivery.js` | เพิ่ม `PREPARING` ใน enum สถานะ และเปลี่ยน default เป็น `PREPARING` | ของเดิมไม่มีขั้น "เตรียมจัดส่ง" แยกจาก "ออกจากต้นทาง" |
| `controllers/transferController.js` | `approveTransferRequest` สร้าง Delivery เริ่มที่ `PREPARING` (เดิมเริ่มที่ `DISPATCHED`) | ให้ตรงกับ pipeline ใหม่: อนุมัติ → เตรียมจัดส่ง → กำลังจัดส่ง → ส่งมอบแล้ว |
| `controllers/aiController.js` | `getExpiryRedistribution` เพิ่ม `drug_id` และ `from_hospital_id` (Mongo ObjectId) ในผลลัพธ์ | เดิมส่งมาแต่ชื่อ (string) ทำให้ frontend หา ObjectId ที่แน่ชัดไปสร้างคำขอโอนย้ายต่อไม่ได้ |
| `controllers/aiController.js` | `searchEmergencyDrug` เรียก Longdo Map "Calculate route" REST API จริง (เพิ่มฟังก์ชัน `calculateRealRoute`) แทนการประมาณด้วย Haversine + สมมติความเร็วคงที่ | เวลา "ถึงใน X นาที" เดิมเป็นเลขมั่ว ไม่สนใจถนนจริง/รถติด ตอนนี้ใช้เส้นทางจริงจาก Longdo แล้ว (ยัง fallback เป็น Haversine อัตโนมัติเฉพาะรายที่ Longdo เรียกไม่สำเร็จ พร้อมแจ้ง `is_estimate: true` กลับไปให้ frontend แสดงไอคอนเตือน) |
| `server.js` | mount `/api/drugs` และ `/api/delivery` | คู่กับ route ใหม่ทั้งสองชุดข้างบน |

ของเดิมจาก v3 (login จริง, transfers inbox/outbox, network-overview ObjectId) ยังอยู่เหมือนเดิม ไม่ได้แก้ซ้ำ

## ส่วนที่ยังเป็น Mock (รอ Backend เพิ่ม)

| ขาดอะไร | Mock อยู่ที่ไฟล์ | ใช้ที่หน้า |
|---|---|---|
| `PATCH /api/transfers/:id/cancel` (ไม่มี route นี้เลย) | `lib/hooks/use-transfers.ts` (`useCancelTransfer`) | Page 4 Outbox (ปุ่มยกเลิกคำขอ) — กดแล้วจะแสดง error แจ้งว่ายังใช้ไม่ได้ ไม่ได้ mock เงียบๆ |

`lib/mock-delivery.ts` **เลิกใช้แล้ว** (หน้า Delivery ต่อ backend จริงผ่าน `lib/api.ts` /
`lib/hooks/use-delivery.ts`) — ไฟล์เดิมยังอยู่ในโปรเจกต์เผื่ออ้างอิง แต่ไม่มีที่ไหน import ใช้แล้ว
ลบออกได้อย่างปลอดภัยถ้าต้องการ

## โครงสร้างไฟล์ (อัปเดต)

```
app/
  login/page.tsx                 — Page 1
  dashboard/
    layout.tsx                   — Topbar + Sidebar shell (auth guard)
    overview/page.tsx            — Page 2 (Stat Cards + Alert Queue + Expiry Queue)
    inventory/page.tsx           — Page 3
    requests/page.tsx            — Page 4 (Inbox/Outbox)
    delivery/page.tsx            — Page 5 (Sidebar + Google Map + Timeline)
components/
  dashboard/   — Topbar, TopbarSearch, EmergencySearchModal (ใหม่), Sidebar
  overview/    — NetworkStatCards, AlertQueue, ExpiryQueue (ใหม่)
  inventory/   — FilterPanel, InventoryTable
  requests/    — NewRequestForm, RequestCard, Approve/RejectModal
  delivery/    — DeliveryListSidebar, DeliveryTimelinePanel, LongdoRouteMap (ใหม่), DeliveryCard, ReceiveModal
  ui/          — Button, Modal, ExpandablePanel, FormControls
lib/
  api.ts                    — fetch client ต่อ backend จริง พร้อม Authorization header (เพิ่ม drug search, expiry, emergency search, delivery)
  auth.ts                    — login/logout จริงผ่าน JWT, เก็บ session ใน localStorage
  use-debounced-value.ts     — (ใหม่) debounce ทั่วไปสำหรับ search input
  hooks/
    use-overview.ts          — เพิ่ม useExpiryRedistribution
    use-emergency-search.ts  — (ใหม่) useDrugNameSearch, useEmergencyDrugSearch
    use-delivery.ts          — เขียนใหม่ ต่อ backend จริงแทน mock
  types.ts                   — type ตรงกับ Mongoose models จริง (เพิ่ม PREPARING, DrugSearchResult, ExpiryRedistributionItem, EmergencySearchResult)
  constants.ts                — เพิ่ม route ใหม่ + LONGDO_MAP_API_KEY
  use-countdown.ts            — countdown hook สำหรับ ETA (ใช้ในหน้า Delivery)
  types/longdo.d.ts           — (ใหม่) type declarations สำหรับ Longdo Map global script (ไม่มี @types package)
```

## Page ที่ตัดออกตามสเปก MVP

- **Page 6 (AI Suggestion Log)** — ไม่มีหน้านี้ใน routing เลย ไม่มี nav item
- **Page 7 (Return & Clearing)** — ไม่มีหน้านี้ใน routing เลย ไม่มี nav item

Backend ฝั่ง AI_SUGGESTION_LOG ยังบันทึก log ตามปกติ (ไม่กระทบ UI)
