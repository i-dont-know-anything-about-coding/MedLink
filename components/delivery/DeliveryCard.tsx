"use client";

import { Package, Truck, PackageCheck, PackageX, Clock3, PenLine, MapPinned } from "lucide-react";
import type { DeliveryRecord } from "@/lib/types";
import { formatNumber, formatThaiDateTime, formatThaiTime } from "@/lib/format";
import { useCountdown } from "@/lib/use-countdown";

const STATUS_META: Record<
  DeliveryRecord["delivery_status"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  PREPARING: {
    label: "เตรียมจัดส่ง",
    className: "bg-warning/15 text-warning",
    icon: <Package size={12} />,
  },
  DISPATCHED: {
    label: "ออกจากต้นทาง",
    className: "bg-accent/15 text-accent",
    icon: <Truck size={12} />,
  },
  EN_ROUTE: {
    label: "กำลังจัดส่ง",
    className: "bg-accent/15 text-accent",
    icon: <Truck size={12} />,
  },
  DELIVERED: {
    label: "ส่งมอบแล้ว",
    className: "bg-safe/15 text-safe",
    icon: <PackageCheck size={12} />,
  },
  FAILED: {
    label: "ส่งไม่สำเร็จ",
    className: "bg-critical/15 text-critical",
    icon: <PackageX size={12} />,
  },
};

interface DeliveryCardProps {
  delivery: DeliveryRecord;
  canReceive: boolean;
  canAdvanceStatus: boolean;
  advancing: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpenReceiveModal: () => void;
  onMarkEnRoute: () => void;
}

export default function DeliveryCard({
  delivery,
  canReceive,
  canAdvanceStatus,
  advancing,
  selected,
  onSelect,
  onOpenReceiveModal,
  onMarkEnRoute,
}: DeliveryCardProps) {
  const isDelivered = delivery.delivery_status === "DELIVERED";
  const isFailed = delivery.delivery_status === "FAILED";
  const isPreparing = delivery.delivery_status === "PREPARING";
  const countdown = useCountdown(isDelivered || isFailed ? null : delivery.estimated_arrival);
  const meta = STATUS_META[delivery.delivery_status];

  return (
    <button
      onClick={onSelect}
      className={`flex w-full flex-col gap-3 rounded-xl border p-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between ${
        selected ? "border-accent/50 bg-accent-dim" : "border-border bg-panel hover:bg-panel-hover"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-text-hi">
            {delivery.drug_generic_name || "—"}
          </span>
          <span
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.className}`}
          >
            {meta.icon}
            {meta.label}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-[11px] text-text-lo">
          <MapPinned size={12} className="flex-shrink-0" />
          {delivery.from_hospital_name} → {delivery.to_hospital_name}
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-lo">
          <span>จำนวน: {formatNumber(delivery.quantity ?? 0)}</span>
          <span>{delivery.ems_unit_name}</span>
        </div>

        {isDelivered && (
          <div className="mt-1.5 text-[11px] text-safe">
            เซ็นรับแล้วเมื่อ {formatThaiDateTime(delivery.received_at)}
          </div>
        )}
      </div>

      <div
        className="flex flex-shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {!isDelivered && !isFailed && delivery.estimated_arrival && (
          <div className="flex items-center gap-1.5 text-right">
            <Clock3 size={14} className="text-accent" />
            <div>
              <div className="text-[10px] text-text-lo">ถึงปลายทางในอีก</div>
              <div className="font-data text-[15px] font-semibold text-accent">{countdown}</div>
            </div>
          </div>
        )}
        {isDelivered && (
          <div className="text-right">
            <div className="text-[10px] text-text-lo">ส่งมอบสำเร็จเมื่อ</div>
            <div className="font-data text-[15px] font-semibold text-safe">
              {formatThaiTime(delivery.received_at)}
            </div>
          </div>
        )}

        {isPreparing && canAdvanceStatus && (
          <button
            onClick={onMarkEnRoute}
            disabled={advancing}
            className="flex items-center gap-1.5 rounded-lg border border-accent/40 px-3.5 py-2 text-[12px] font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
          >
            <Truck size={13} /> {advancing ? "กำลังอัปเดต..." : "เริ่มจัดส่ง"}
          </button>
        )}

        {delivery.delivery_status === "EN_ROUTE" && canReceive && (
          <button
            onClick={onOpenReceiveModal}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[12px] font-medium text-white hover:bg-accent/90"
          >
            <PenLine size={13} /> เซ็นรับยา
          </button>
        )}
      </div>
    </button>
  );
}
