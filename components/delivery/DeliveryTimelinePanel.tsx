"use client";

import type { MockDeliveryView } from "@/lib/mock-delivery";
import { formatNumber, formatThaiDateTime, formatThaiTime } from "@/lib/format";
import { useEffect, useState } from "react";

const CHECKPOINTS = [
  { key: "DISPATCHED", label: "ออกจากต้นทาง" },
  { key: "EN_ROUTE", label: "กำลังเดินทาง" },
  { key: "ARRIVING", label: "ใกล้ถึงปลายทาง" },
  { key: "DELIVERED", label: "ส่งมอบสำเร็จ" },
] as const;

function checkpointIndex(status: string): number {
  return CHECKPOINTS.findIndex((c) => c.key === status);
}

function formatCountdownLabel(targetIso: string | null): string {
  if (!targetIso) return "—";
  const diffMs = new Date(targetIso).getTime() - Date.now();
  if (diffMs <= 0) return "ถึงแล้ว";
  const totalMinutes = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`;
}

function useCountdown(targetIso: string | null): string {
  // ใช้ tick เป็นตัวกระตุ้น re-render ทุก 30 วิ แล้วคำนวณ label จริงตอน render
  // (ไม่ setState ค่าที่ derive ได้ใน effect เพื่อเลี่ยง cascading render)
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!targetIso) return;
    const interval = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(interval);
  }, [targetIso]);

  return formatCountdownLabel(targetIso);
}

interface DeliveryTimelinePanelProps {
  delivery: MockDeliveryView;
  canReceive: boolean;
  onOpenReceiveModal: () => void;
}

export default function DeliveryTimelinePanel({
  delivery,
  canReceive,
  onOpenReceiveModal,
}: DeliveryTimelinePanelProps) {
  const countdown = useCountdown(
    delivery.delivery_status === "DELIVERED" ? null : delivery.estimated_arrival
  );
  const activeIdx = checkpointIndex(delivery.delivery_status);
  const isDelivered = delivery.delivery_status === "DELIVERED";

  return (
    <div className="flex w-full max-w-sm flex-shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-panel p-4">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-text-lo">
          {isDelivered ? "ส่งมอบสำเร็จเมื่อ" : "ถึงปลายทางในอีกประมาณ"}
        </div>
        <div
          className={`mt-1 font-data text-[26px] font-semibold ${
            isDelivered ? "text-safe" : "text-accent"
          }`}
        >
          {isDelivered ? formatThaiTime(delivery.received_at) : countdown}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-3">
        {CHECKPOINTS.map((cp, idx) => {
          const reached = idx <= activeIdx;
          return (
            <div key={cp.key} className="flex items-center gap-3">
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] ${
                  reached
                    ? "border-safe bg-safe/15 text-safe"
                    : "border-border-light text-text-lo"
                }`}
              >
                {reached ? "✓" : ""}
              </div>
              <span
                className={`text-[12px] ${reached ? "text-text-hi" : "text-text-lo"}`}
              >
                {cp.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-[12px]">
        <div className="flex justify-between">
          <span className="text-text-lo">ยาที่ขนส่ง</span>
          <span className="text-right text-text-hi">{delivery.drug_generic_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-lo">จำนวน</span>
          <span className="font-data text-text-hi">{formatNumber(delivery.quantity)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-lo">เงื่อนไขจัดเก็บ</span>
          <span className="text-text-hi">{delivery.storage_condition}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-lo">รถ/หน่วยขนส่ง</span>
          <span className="text-text-hi">{delivery.ems_unit_name}</span>
        </div>
        {isDelivered && (
          <div className="flex justify-between">
            <span className="text-text-lo">ผู้เซ็นรับ</span>
            <span className="text-text-hi">{delivery.received_by}</span>
          </div>
        )}
      </div>

      {!isDelivered && canReceive && (
        <button
          onClick={onOpenReceiveModal}
          className="mt-1 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-white hover:bg-accent/90"
        >
          ✍️ เซ็นรับยา
        </button>
      )}

      {isDelivered && (
        <div className="rounded-lg bg-safe/10 px-3 py-2 text-center text-[12px] text-safe">
          เซ็นรับยาเรียบร้อยเมื่อ {formatThaiDateTime(delivery.received_at)}
        </div>
      )}
    </div>
  );
}
