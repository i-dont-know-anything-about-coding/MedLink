"use client";

import { useMemo } from "react";
import { CalendarClock, ArrowRight, Sparkles, Droplet } from "lucide-react";
import type { BloodExpiryRedistributionItem } from "@/lib/types";
import { componentTypeLabel, formatNumber } from "@/lib/format";

interface BloodExpiryQueueProps {
  items: BloodExpiryRedistributionItem[];
  ownHospitalObjectId: string;
  onAction: (item: BloodExpiryRedistributionItem) => void;
}

function daysUntil(expiryDateIso: string): number {
  return Math.ceil((new Date(expiryDateIso).getTime() - Date.now()) / 86_400_000);
}

function formatExpiryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function BloodExpiryQueue({
  items,
  ownHospitalObjectId,
  onAction,
}: BloodExpiryQueueProps) {
  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(a.expiring_bag.expiry_date).getTime() -
          new Date(b.expiring_bag.expiry_date).getTime()
      ),
    [items]
  );

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-text-lo">
        ไม่มีถุงเลือดเสี่ยงหมดอายุภายใน 7 วันในขณะนี้
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {sorted.map((item) => {
        const days = daysUntil(item.expiring_bag.expiry_date);
        const isUrgent = days <= 3;
        const hasSuggestion = Boolean(item.ai_suggestion.hospital_name);

        return (
          <div
            key={`${item.blood_inventory_id}-${item.expiring_bag.bag_number}`}
            className={`rounded-lg border p-3 transition-colors hover:bg-panel-hover ${
              isUrgent ? "border-critical/25 bg-critical/[0.04]" : "border-warning/25 bg-warning/[0.04]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-1 font-data text-[13px] font-medium text-text-hi">
                <Droplet size={13} className="flex-shrink-0 text-critical" />
                {item.blood_group} — {componentTypeLabel(item.component_type)}
              </span>
              <span
                className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  isUrgent ? "bg-critical/15 text-critical" : "bg-warning/15 text-warning"
                }`}
              >
                เหลือ {days} วัน
              </span>
            </div>

            <div className="mt-1 flex items-center gap-1 text-[11px] text-text-lo">
              <CalendarClock size={12} className="flex-shrink-0" />
              {item.from_hospital === ownHospitalObjectId ? "คลังของเรา" : item.from_hospital}{" "}
              &nbsp;|&nbsp; ถุง {item.expiring_bag.bag_number} &nbsp;|&nbsp; หมดอายุ{" "}
              {formatExpiryDate(item.expiring_bag.expiry_date)} &nbsp;|&nbsp; จำนวน:{" "}
              <strong className={isUrgent ? "text-critical" : "text-warning"}>
                {formatNumber(item.expiring_bag.quantity)}
              </strong>
            </div>

            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-bg px-2.5 py-1.5 text-[11px] text-text-lo">
              <Sparkles size={12} className="mt-0.5 flex-shrink-0 text-accent" />
              <span>
                {hasSuggestion
                  ? `แนะนำโอนไปที่: ${item.ai_suggestion.hospital_name}${
                      typeof item.ai_suggestion.distance_km === "number"
                        ? ` (ห่าง ${item.ai_suggestion.distance_km} กม.)`
                        : ""
                    }`
                  : item.ai_suggestion.reasoning}
              </span>
            </div>

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onAction(item)}
                disabled={!item.ai_suggestion.to_hospital_id}
                className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-border-light disabled:text-text-lo"
              >
                โอนย้ายเลือด <ArrowRight size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
