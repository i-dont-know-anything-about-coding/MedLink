"use client";

import { useMemo } from "react";
import { MapPin, ArrowRight, Sparkles, Droplet } from "lucide-react";
import type { BloodAlertQueueItem } from "@/lib/types";
import { componentTypeLabel, formatNumber } from "@/lib/format";

interface BloodAlertQueueProps {
  items: BloodAlertQueueItem[];
  onAction: (item: BloodAlertQueueItem) => void;
}

export default function BloodAlertQueue({ items, onAction }: BloodAlertQueueProps) {
  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
      ),
    [items]
  );

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-text-lo">
        ไม่มีรายการแจ้งเตือนเลือดวิกฤตในขณะนี้ — สต็อกทุกแห่งอยู่ในระดับปลอดภัย
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {sorted.map((item) => {
        const isCritical = item.current_stock <= item.safety_level;
        return (
          <div
            key={item.alert_id}
            className={`rounded-lg border p-3 transition-colors hover:bg-panel-hover ${
              isCritical ? "border-critical/25 bg-critical/[0.04]" : "border-warning/25 bg-warning/[0.04]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-1 font-data text-[13px] font-medium text-text-hi">
                <Droplet size={13} className="flex-shrink-0 text-critical" />
                {item.blood_group} — {componentTypeLabel(item.component_type)}
              </span>
              <span
                className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  isCritical ? "bg-critical/15 text-critical" : "bg-warning/15 text-warning"
                }`}
              >
                {isCritical ? "วิกฤต" : "ใกล้หมด"}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-1 text-[11px] text-text-lo">
              <MapPin size={12} className="flex-shrink-0" />
              {item.hospital_in_need} &nbsp;|&nbsp; คงเหลือ:{" "}
              <strong className={isCritical ? "text-critical" : "text-warning"}>
                {formatNumber(item.current_stock)}
              </strong>{" "}
              &nbsp;|&nbsp; Safety: {formatNumber(item.safety_level)}
            </div>

            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-bg px-2.5 py-1.5 text-[11px] text-text-lo">
              <Sparkles size={12} className="mt-0.5 flex-shrink-0 text-accent" />
              <span>
                แนะนำ: {item.ai_suggestion.hospital_name}
                {typeof item.ai_suggestion.distance_km === "number" &&
                  ` (ห่าง ${item.ai_suggestion.distance_km} กม.)`}
              </span>
            </div>

            <div className="mt-2 flex justify-end">
              <button
                onClick={() => onAction(item)}
                disabled={!item.ai_suggestion.donor_inventory_id}
                className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-border-light disabled:text-text-lo"
              >
                ดำเนินการ <ArrowRight size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
