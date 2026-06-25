"use client";

import { useMemo, useState } from "react";
import type { NetworkOverviewItem } from "@/lib/types";
import { formatNumber } from "@/lib/format";

interface HospitalPin {
  hospitalId: string;
  hospitalName: string;
  coordinates: [number, number]; // [lng, lat]
  isCritical: boolean;
  criticalCount: number;
  totalAvailable: number;
}

/**
 * NOTE — Google Maps JS API:
 * สเปกระบุให้ใช้ Google Maps JS API แสดงหมุดแบบ static (fetch ตอน refresh หน้า ไม่ realtime ตาม MVP)
 * แต่การฝัง Google Maps จริงต้องใช้ API Key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) ซึ่งยังไม่ได้ตั้งค่าไว้
 * จึง render เป็นกริดพิกัด lat/lng ของจริงแทนไปก่อน (คำนวณตำแหน่งหมุดจาก coordinates จริงจาก backend)
 * เมื่อมี API Key แล้ว ให้แทนที่ <svg> ด้านในด้วย <GoogleMap> + <Marker> จาก @react-google-maps/api
 * โดยใช้พิกัด hospital.coordinates ชุดเดียวกันนี้ได้ทันที
 */

// กรอบพิกัดคร่าวๆ ของจังหวัดอุดรธานี (จาก seed.js) ใช้ map ค่า lat/lng -> % ตำแหน่งบนกริด
const LNG_RANGE: [number, number] = [102.1, 103.5];
const LAT_RANGE: [number, number] = [16.85, 17.8];

function toPercent(coordinates: [number, number]) {
  const [lng, lat] = coordinates;
  const x = ((lng - LNG_RANGE[0]) / (LNG_RANGE[1] - LNG_RANGE[0])) * 100;
  const y = (1 - (lat - LAT_RANGE[0]) / (LAT_RANGE[1] - LAT_RANGE[0])) * 100;
  return {
    left: `${Math.min(92, Math.max(4, x))}%`,
    top: `${Math.min(90, Math.max(8, y))}%`,
  };
}

export default function MapZone({
  items,
  onRequestDrug,
}: {
  items: NetworkOverviewItem[];
  onRequestDrug: () => void;
}) {
  const [openPinId, setOpenPinId] = useState<string | null>(null);

  const pins = useMemo<HospitalPin[]>(() => {
    const byHospital = new Map<string, HospitalPin>();
    for (const item of items) {
      const key = item.hospital.id;
      const existing = byHospital.get(key);
      const isCritical = item.stock_status === "RED";
      if (!existing) {
        byHospital.set(key, {
          hospitalId: key,
          hospitalName: item.hospital.name,
          coordinates: item.hospital.coordinates,
          isCritical,
          criticalCount: isCritical ? 1 : 0,
          totalAvailable: item.available_quantity,
        });
      } else {
        existing.isCritical = existing.isCritical || isCritical;
        existing.criticalCount += isCritical ? 1 : 0;
        existing.totalAvailable += item.available_quantity;
      }
    }
    return Array.from(byHospital.values());
  }, [items]);

  const criticalCount = pins.filter((p) => p.isCritical).length;
  const safeCount = pins.length - criticalCount;

  return (
    <div className="relative h-full min-h-[320px] flex-1 overflow-hidden rounded-xl border border-border bg-bg">
      {/* Grid background, แทนลวดลาย Hex grid ที่ตัดออกตามสเปก MVP — ใช้สีพื้นธรรมดา */}
      <svg className="absolute inset-0 h-full w-full opacity-60" preserveAspectRatio="none">
        <defs>
          <pattern id="overview-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#overview-grid)" />
      </svg>

      {pins.map((pin) => {
        const pos = toPercent(pin.coordinates);
        const open = openPinId === pin.hospitalId;
        return (
          <div
            key={pin.hospitalId}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={pos}
          >
            <button
              onClick={() => setOpenPinId(open ? null : pin.hospitalId)}
              className={`h-3.5 w-3.5 rounded-full border-2 border-bg shadow-md transition-transform hover:scale-125 ${
                pin.isCritical ? "bg-critical" : "bg-safe"
              }`}
              aria-label={pin.hospitalName}
            />
            {open && (
              <div className="absolute left-1/2 top-5 z-20 w-56 -translate-x-1/2 rounded-lg border border-border bg-panel p-3 shadow-xl shadow-black/30">
                <div className="text-[13px] font-medium text-text-hi">
                  {pin.hospitalName}
                </div>
                <div className="mt-1 text-[11px] text-text-lo">
                  {pin.isCritical ? (
                    <>
                      ยาวิกฤต:{" "}
                      <span className="text-critical">
                        {pin.criticalCount} รายการ
                      </span>
                    </>
                  ) : (
                    <>ปกติ | คลังพร้อมให้ยืม: {formatNumber(pin.totalAvailable)} หน่วย</>
                  )}
                </div>
                <div className="mt-2.5 flex gap-1.5">
                  <button className="flex-1 rounded-md border border-border px-2 py-1.5 text-[11px] text-text-hi hover:bg-panel-hover">
                    ดูคลังยา
                  </button>
                  {pin.isCritical && (
                    <button
                      onClick={onRequestDrug}
                      className="flex-1 rounded-md bg-accent px-2 py-1.5 text-[11px] text-white hover:bg-accent/90"
                    >
                      ขอยืมยา
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="absolute bottom-3 left-3 flex gap-4 rounded-lg border border-border bg-panel/90 px-3 py-2 text-[11px] text-text-lo">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-critical" /> วิกฤต ({criticalCount} แห่ง)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-safe" /> ปกติ ({safeCount} แห่ง)
        </span>
      </div>
    </div>
  );
}
