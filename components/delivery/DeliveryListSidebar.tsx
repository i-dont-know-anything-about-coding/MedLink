"use client";

import type { MockDeliveryView } from "@/lib/mock-delivery";
import { formatThaiDateTime } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  DISPATCHED: "ออกจากต้นทาง",
  EN_ROUTE: "กำลังเดินทาง",
  ARRIVING: "ใกล้ถึง",
  DELIVERED: "ส่งมอบแล้ว",
  FAILED: "ล้มเหลว",
};

interface DeliveryListSidebarProps {
  deliveries: MockDeliveryView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function DeliveryListSidebar({
  deliveries,
  selectedId,
  onSelect,
}: DeliveryListSidebarProps) {
  return (
    <aside className="flex w-64 flex-shrink-0 flex-col gap-2 overflow-y-auto border-r border-border bg-panel p-3">
      <div className="px-1 text-[11px] font-medium uppercase tracking-wide text-text-lo">
        การจัดส่งทั้งหมด
      </div>
      {deliveries.map((d) => {
        const active = d._id === selectedId;
        const isDelivered = d.delivery_status === "DELIVERED";
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
                {d.drug_generic_name}
              </span>
              <span
                className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium ${
                  isDelivered ? "bg-safe/15 text-safe" : "bg-accent/15 text-accent"
                }`}
              >
                {STATUS_LABEL[d.delivery_status] ?? d.delivery_status}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-text-lo">
              {d.from_hospital_name} → {d.to_hospital_name}
            </div>
            <div className="mt-0.5 text-[10px] text-text-lo">
              {formatThaiDateTime(d.estimated_arrival)}
            </div>
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
