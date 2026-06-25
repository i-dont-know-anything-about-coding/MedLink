"use client";

import { Truck, PackageCheck, PackageX, Clock3, PenLine } from "lucide-react";
import type { MockDeliveryView } from "@/lib/mock-delivery";
import { formatNumber, formatThaiDateTime, formatThaiTime } from "@/lib/format";
import { useCountdown } from "@/lib/use-countdown";

const STATUS_META: Record<
  MockDeliveryView["delivery_status"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  DISPATCHED: {
    label: "ออกจากต้นทาง",
    className: "bg-accent/15 text-accent",
    icon: <Truck size={12} />,
  },
  EN_ROUTE: {
    label: "กำลังเดินทาง",
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
  delivery: MockDeliveryView;
  canReceive: boolean;
  onOpenReceiveModal: () => void;
}

export default function DeliveryCard({
  delivery,
  canReceive,
  onOpenReceiveModal,
}: DeliveryCardProps) {
  const isDelivered = delivery.delivery_status === "DELIVERED";
  const isFailed = delivery.delivery_status === "FAILED";
  const countdown = useCountdown(isDelivered || isFailed ? null : delivery.estimated_arrival);
  const meta = STATUS_META[delivery.delivery_status];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-text-hi">
            {delivery.drug_generic_name}
          </span>
          <span
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.className}`}
          >
            {meta.icon}
            {meta.label}
          </span>
        </div>

        <div className="mt-1 text-[11px] text-text-lo">
          {delivery.from_hospital_name} → {delivery.to_hospital_name}
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-lo">
          <span>จำนวน: {formatNumber(delivery.quantity)}</span>
          <span>{delivery.storage_condition}</span>
          <span>{delivery.ems_unit_name}</span>
        </div>

        {isDelivered && (
          <div className="mt-1.5 text-[11px] text-safe">
            เซ็นรับโดย {delivery.received_by} เมื่อ {formatThaiDateTime(delivery.received_at)}
          </div>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
        {!isDelivered && !isFailed && (
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

        {!isDelivered && !isFailed && canReceive && (
          <button
            onClick={onOpenReceiveModal}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[12px] font-medium text-white hover:bg-accent/90"
          >
            <PenLine size={13} /> เซ็นรับยา
          </button>
        )}
      </div>
    </div>
  );
}
