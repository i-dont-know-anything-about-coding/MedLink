"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { LONGDO_MAP_API_KEY } from "@/lib/constants";

interface LongdoRouteMapProps {
  fromHospitalName: string;
  toHospitalName: string;
  /** [longitude, latitude] ตามมาตรฐาน GeoJSON ที่ backend ส่งมา */
  fromCoordinates: [number, number] | null | undefined;
  toCoordinates: [number, number] | null | undefined;
}

// Longdo Map เป็น global script (window.longdo) ต้องโหลดครั้งเดียวต่อหน้าเว็บทั้งหมด
// ใช้ promise เก็บสถานะการโหลดร่วมกัน กันไม่ให้ inject <script> ซ้ำเวลามีหลาย instance ของ component นี้
let longdoScriptPromise: Promise<void> | null = null;

function loadLongdoScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.longdo) return Promise.resolve();
  if (longdoScriptPromise) return longdoScriptPromise;

  longdoScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api.longdo.com/map/?key=${apiKey}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      longdoScriptPromise = null; // เปิดให้ลองโหลดใหม่ได้ถ้าพลาดครั้งนี้ (เช่น เน็ตหลุดตอนโหลด)
      reject(new Error("โหลด Longdo Map script ไม่สำเร็จ"));
    };
    document.head.appendChild(script);
  });

  return longdoScriptPromise;
}

/**
 * แผนที่เส้นทางจริงระหว่าง รพ.ต้นทาง-ปลายทาง ผ่าน Longdo Map JavaScript API
 * (map.Route ค้นหาเส้นทางถนนจริง + คำนวณระยะทาง/เวลาให้อัตโนมัติ)
 * ต้องตั้งค่า NEXT_PUBLIC_LONGDO_MAP_API_KEY ใน .env.local ก่อนใช้งานจริง — ดูวิธีตั้งค่า
 * ใน README.md หัวข้อ "Longdo Map Setup" (ขอ key ได้ฟรีที่ https://map.longdo.com/api)
 */
export default function LongdoRouteMap({
  fromHospitalName,
  toHospitalName,
  fromCoordinates,
  toCoordinates,
}: LongdoRouteMapProps) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const routeInfoRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LongdoMapInstance | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distance: string; time: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const hasCoordinates = Boolean(fromCoordinates && toCoordinates);

  useEffect(() => {
    if (!LONGDO_MAP_API_KEY || !hasCoordinates || !placeholderRef.current) return;

    let cancelled = false;
    setError(null);
    setRouteSummary(null);

    loadLongdoScript(LONGDO_MAP_API_KEY)
      .then(() => {
        if (cancelled || !placeholderRef.current || !window.longdo) return;

        const longdo = window.longdo;

        // ล้างแผนที่เก่าก่อนสร้างใหม่ (กรณี re-render ด้วยเส้นทางใหม่)
        placeholderRef.current.innerHTML = "";
        const map = new longdo.Map({ placeholder: placeholderRef.current });
        mapRef.current = map;

        const origin = { lon: fromCoordinates![0], lat: fromCoordinates![1] };
        const destination = { lon: toCoordinates![0], lat: toCoordinates![1] };

        map.Event.bind("ready", () => {
          if (cancelled) return;

          if (routeInfoRef.current) {
            map.Route.placeholder(routeInfoRef.current);
          }
          map.Route.mode(longdo.RouteMode.Traffic); // เลี่ยงรถติดด้วยข้อมูลเรียลไทม์
          map.Route.label(longdo.RouteLabel.Time);

          map.Route.add(
            new longdo.Marker(origin, { title: fromHospitalName, detail: "โรงพยาบาลต้นทาง" })
          );
          map.Route.add(
            new longdo.Marker(destination, { title: toHospitalName, detail: "โรงพยาบาลปลายทาง" })
          );

          map.Event.bind("guideComplete", () => {
            if (cancelled) return;
            setRouteSummary({
              distance: map.Route.distance(),
              time: map.Route.interval(),
            });
          });

          map.Event.bind("guideError", () => {
            if (cancelled) return;
            setError("ไม่สามารถคำนวณเส้นทางได้ — อาจไม่มีถนนเชื่อมต่อในข้อมูลแผนที่");
          });

          map.Route.search();
        });
      })
      .catch(() => {
        if (!cancelled) setError("โหลดแผนที่ Longdo ไม่สำเร็จ — ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ตั้งใจ re-run เฉพาะตอนพิกัด/ชื่อ รพ. เปลี่ยนจริง
  }, [fromCoordinates?.[0], fromCoordinates?.[1], toCoordinates?.[0], toCoordinates?.[1]]);

  if (!LONGDO_MAP_API_KEY) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-bg p-6 text-center">
        <MapPin size={20} className="text-text-lo" />
        <div className="text-[12px] text-text-lo">
          ยังไม่ได้ตั้งค่า Longdo Map API Key
          <br />
          เพิ่ม <code className="font-data text-accent">NEXT_PUBLIC_LONGDO_MAP_API_KEY</code> ใน{" "}
          <code className="font-data text-accent">.env.local</code> เพื่อแสดงเส้นทางจริง
        </div>
      </div>
    );
  }

  if (!hasCoordinates) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-border bg-bg text-[12px] text-text-lo">
        ไม่มีพิกัด GPS ของโรงพยาบาลต้นทาง/ปลายทางสำหรับแสดงเส้นทาง
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[220px] flex-col gap-2">
      <div className="relative h-full min-h-[180px] overflow-hidden rounded-xl border border-border">
        <div ref={placeholderRef} className="h-full w-full" />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/95 p-4 text-center text-[12px] text-critical">
            {error}
          </div>
        )}
      </div>

      {/* Longdo จะ render รายละเอียดเส้นทาง (เลี้ยวซ้าย/ขวา) ลงใน element นี้เองผ่าน Route.placeholder() */}
      <div
        ref={routeInfoRef}
        className="max-h-28 overflow-y-auto rounded-lg border border-border bg-bg p-2 text-[11px] text-text-lo empty:hidden"
      />

      {routeSummary && (
        <div className="flex items-center justify-between rounded-lg bg-accent-dim px-3 py-2 text-[12px]">
          <span className="text-text-hi">
            {fromHospitalName} → {toHospitalName}
          </span>
          <span className="font-data font-medium text-accent">
            {routeSummary.distance} · {routeSummary.time}
          </span>
        </div>
      )}
    </div>
  );
}
