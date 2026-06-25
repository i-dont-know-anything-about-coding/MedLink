"use client";

interface DeliveryMapProps {
  fromHospitalName: string;
  toHospitalName: string;
  status: string;
}

/**
 * Page 5 ตามสเปก MVP: แผนที่ static แสดงหมุดต้นทาง-ปลายทางคงที่ (ไม่ animate)
 * ตัด Socket.io / animated dot วิ่งตามเส้นทางจริงออกตามสเปก (Post-MVP)
 */
export default function DeliveryMap({
  fromHospitalName,
  toHospitalName,
  status,
}: DeliveryMapProps) {
  const progress =
    status === "DISPATCHED" ? 15 : status === "EN_ROUTE" ? 55 : status === "ARRIVING" ? 85 : 100;

  return (
    <div className="relative h-full min-h-[220px] overflow-hidden rounded-xl border border-border bg-bg">
      <svg className="absolute inset-0 h-full w-full opacity-50">
        <defs>
          <pattern id="delivery-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#delivery-grid)" />
      </svg>

      {/* เส้นทางคงที่ระหว่างต้นทาง-ปลายทาง */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line
          x1="15"
          y1="75"
          x2="85"
          y2="25"
          stroke="var(--color-border-light)"
          strokeWidth="0.6"
          strokeDasharray="2,2"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="15"
          y1="75"
          x2={15 + (85 - 15) * (progress / 100)}
          y2={75 + (25 - 75) * (progress / 100)}
          stroke="var(--color-accent)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* หมุดต้นทาง */}
      <div className="absolute bottom-[25%] left-[15%] -translate-x-1/2 translate-y-1/2 text-center">
        <div className="h-3.5 w-3.5 rounded-full border-2 border-bg bg-accent shadow-md" />
        <div className="mt-1 max-w-[110px] text-[10px] text-text-lo">{fromHospitalName}</div>
      </div>

      {/* หมุดปลายทาง */}
      <div className="absolute right-[15%] top-[25%] -translate-x-1/2 -translate-y-1/2 text-center">
        <div
          className={`h-3.5 w-3.5 rounded-full border-2 border-bg shadow-md ${
            status === "DELIVERED" ? "bg-safe" : "bg-critical"
          }`}
        />
        <div className="mt-1 max-w-[110px] text-[10px] text-text-lo">{toHospitalName}</div>
      </div>

      {/* EMS unit — ตำแหน่งคงที่ตาม progress (อัปเดตด้วยมือ ไม่ใช่ GPS อัตโนมัติ) */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 text-[16px]"
        style={{
          left: `${15 + (85 - 15) * (progress / 100)}%`,
          top: `${75 + (25 - 75) * (progress / 100)}%`,
        }}
      >
        🚑
      </div>
    </div>
  );
}
