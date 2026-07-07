"use client";

import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { DeliveryRecord } from "@/lib/types";
import { formatThaiDateTime } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PREPARING: "เตรียมจัดส่ง",
  DISPATCHED: "ออกจากต้นทาง",
  EN_ROUTE: "กำลังจัดส่ง",
  DELIVERED: "ส่งมอบแล้ว",
  FAILED: "ล้มเหลว",
};

interface DeliveryListSidebarProps {
  deliveries: DeliveryRecord[];
  selectedId: string | null;
  myHospitalId?: string; // ใช้แสดงว่าเราเป็นต้นทางหรือปลายทาง
  onSelect: (id: string) => void;
}

export default function DeliveryListSidebar({
  deliveries,
  selectedId,
  myHospitalId,
  onSelect,
}: DeliveryListSidebarProps) {
  return (
    <aside className="flex w-full flex-shrink-0 flex-col gap-2 overflow-y-auto border-b border-border bg-panel p-3 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-1 text-[11px] font-medium uppercase tracking-wide text-text-lo">
        การจัดส่งของโรงพยาบาลฉัน
      </div>
      {deliveries.map((d) => {
        const active = d._id === selectedId;
        const isDelivered = d.delivery_status === "DELIVERED";
        const isFailed = d.delivery_status === "FAILED";

        // บอกว่าเราเป็น "ผู้ส่ง" หรือ "ผู้รับ" — ช่วยให้แต่ละ รพ.เข้าใจบทบาทตัวเองในการจัดส่งนั้น
        const isSender = myHospitalId && d.from_hospital_id === myHospitalId;
        const isReceiver = myHospitalId && d.to_hospital_id === myHospitalId;

        return (
          <button
            key={d._id}
            onClick={() => onSelect(d._id)}
            className={`rounded-lg border p-2.5 text-left transition-colors ${
              active
                ? "border-accent/40 bg-accent-dim"
                : "border-border hover:bg-panel-hover"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-text-hi">
                {d.item_display_name || d.drug_generic_name || "—"}
              </span>
              <span
                className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium ${
                  isDelivered
                    ? "bg-safe/15 text-safe"
                    : isFailed
                      ? "bg-critical/15 text-critical"
                      : "bg-accent/15 text-accent"
                }`}
              >
                {STATUS_LABEL[d.delivery_status] ?? d.delivery_status}
              </span>
            </div>

            {/* แสดงบทบาท รพ.ของเราอย่างชัดเจน */}
            {myHospitalId && (
              <div className="mt-1 flex items-center gap-1 text-[10px]">
                {isSender && (
                  <span className="flex items-center gap-0.5 rounded bg-warning/10 px-1.5 py-0.5 text-warning">
                    <ArrowUpRight size={9} />
                    ส่งออก
                  </span>
                )}
                {isReceiver && (
                  <span className="flex items-center gap-0.5 rounded bg-safe/10 px-1.5 py-0.5 text-safe">
                    <ArrowDownLeft size={9} />
                    รับเข้า
                  </span>
                )}
              </div>
            )}

            <div className="mt-1 text-[10px] text-text-lo">
              {d.from_hospital_name} → {d.to_hospital_name}
            </div>
            {d.estimated_arrival && (
              <div className="mt-0.5 text-[10px] text-text-lo">
                {formatThaiDateTime(d.estimated_arrival)}
              </div>
            )}
          </button>
        );
      })}
      {deliveries.length === 0 && (
        <div className="px-2 py-6 text-center text-[12px] text-text-lo">
          ไม่มีรายการจัดส่ง
        </div>
      )}
    </aside>
  );
}
