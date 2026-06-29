"use client";

import { Check, Truck, PenLine, Building2 } from "lucide-react";
import type { DeliveryRecord } from "@/lib/types";
import { formatNumber, formatThaiDateTime, formatThaiTime } from "@/lib/format";
import { useCountdown } from "@/lib/use-countdown";

// Pipeline จัดส่ง: อนุมัติ → เตรียมจัดส่ง → กำลังจัดส่ง → ส่งมอบสำเร็จ
const CHECKPOINTS = [
  { key: "PREPARING", label: "เตรียมจัดส่ง" },
  { key: "EN_ROUTE", label: "กำลังจัดส่ง" },
  { key: "DELIVERED", label: "ส่งมอบสำเร็จ" },
] as const;

function checkpointIndex(status: DeliveryRecord["delivery_status"]): number {
  if (status === "FAILED") return -1;
  // DISPATCHED ถือเป็น legacy = EN_ROUTE
  const normalized = status === "DISPATCHED" ? "EN_ROUTE" : status;
  return CHECKPOINTS.findIndex((c) => c.key === normalized);
}

interface DeliveryTimelinePanelProps {
  delivery: DeliveryRecord;
  myHospitalId?: string; // ใช้แสดงบทบาทของ รพ.ปัจจุบัน
  canReceive: boolean;
  canAdvanceStatus: boolean;
  advancing: boolean;
  onOpenReceiveModal: () => void;
  onMarkEnRoute: () => void;
}

export default function DeliveryTimelinePanel({
  delivery,
  myHospitalId,
  canReceive,
  canAdvanceStatus,
  advancing,
  onOpenReceiveModal,
  onMarkEnRoute,
}: DeliveryTimelinePanelProps) {
  const isDelivered = delivery.delivery_status === "DELIVERED";
  const isFailed = delivery.delivery_status === "FAILED";
  const isPreparing = delivery.delivery_status === "PREPARING";
  const countdown = useCountdown(isDelivered || isFailed ? null : delivery.estimated_arrival);
  const activeIdx = checkpointIndex(delivery.delivery_status);

  const isSender = myHospitalId && delivery.from_hospital_id === myHospitalId;
  const isReceiver = myHospitalId && delivery.to_hospital_id === myHospitalId;

  return (
    <div className="flex w-full flex-shrink-0 flex-col gap-4 overflow-y-auto lg:max-w-sm">
      <div className="rounded-xl border border-border bg-panel p-4">

        {/* บทบาทของ รพ.ปัจจุบันในการจัดส่งนี้ */}
        {myHospitalId && (isSender || isReceiver) && (
          <div className={`mb-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
            isSender ? "bg-warning/10 text-warning" : "bg-safe/10 text-safe"
          }`}>
            <Building2 size={12} />
            {isSender
              ? `โรงพยาบาลของฉัน (${delivery.from_hospital_name}) เป็นผู้ส่งยา`
              : `โรงพยาบาลของฉัน (${delivery.to_hospital_name}) เป็นผู้รับยา`}
          </div>
        )}

        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-lo">
            {isDelivered
              ? "ส่งมอบสำเร็จเมื่อ"
              : isFailed
                ? "สถานะ"
                : delivery.estimated_arrival
                  ? "ถึงปลายทางในอีกประมาณ"
                  : "สถานะปัจจุบัน"}
          </div>
          <div
            className={`mt-1 font-data text-[26px] font-semibold ${
              isDelivered ? "text-safe" : isFailed ? "text-critical" : "text-accent"
            }`}
          >
            {isDelivered
              ? formatThaiTime(delivery.received_at)
              : isFailed
                ? "ส่งไม่สำเร็จ"
                : delivery.estimated_arrival
                  ? countdown
                  : isPreparing
                    ? "กำลังเตรียมยา"
                    : "กำลังเดินทาง"}
          </div>
        </div>

        {/* Pipeline Checkpoints */}
        {!isFailed && (
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-3">
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
                    {reached ? <Check size={11} strokeWidth={3} /> : ""}
                  </div>
                  <span className={`text-[12px] ${reached ? "text-text-hi" : "text-text-lo"}`}>
                    {cp.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ข้อมูลสรุปการจัดส่ง */}
        <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-3 text-[12px]">
          <div className="flex justify-between">
            <span className="text-text-lo">ยาที่ขนส่ง</span>
            <span className="text-right text-text-hi">{delivery.drug_generic_name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-lo">จำนวน</span>
            <span className="font-data text-text-hi">{formatNumber(delivery.quantity ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-lo">ต้นทาง</span>
            <span className="text-right text-text-hi">{delivery.from_hospital_name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-lo">ปลายทาง</span>
            <span className="text-right text-text-hi">{delivery.to_hospital_name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-lo">รถ/หน่วยขนส่ง</span>
            <span className="text-text-hi">{delivery.ems_unit_name}</span>
          </div>
          {isDelivered && (
            <div className="flex justify-between">
              <span className="text-text-lo">เซ็นรับเมื่อ</span>
              <span className="text-text-hi">{formatThaiDateTime(delivery.received_at)}</span>
            </div>
          )}
        </div>

        {/* ปุ่มเริ่มจัดส่ง — แสดงเฉพาะผู้ส่ง (isSender) และมีสิทธิ์ */}
        {isPreparing && canAdvanceStatus && isSender && (
          <button
            onClick={onMarkEnRoute}
            disabled={advancing}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent/40 px-4 py-2.5 text-[13px] font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
          >
            <Truck size={15} />
            {advancing ? "กำลังอัปเดต..." : "เริ่มจัดส่ง"}
          </button>
        )}

        {/* ปุ่มเซ็นรับยา — แสดงเฉพาะผู้รับ (isReceiver) และมีสิทธิ์ */}
        {delivery.delivery_status === "EN_ROUTE" && canReceive && isReceiver && (
          <button
            onClick={onOpenReceiveModal}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-white hover:bg-accent/90"
          >
            <PenLine size={15} />
            เซ็นรับยา
          </button>
        )}

        {/* กรณีที่ไม่มีสิทธิ์กดปุ่ม แต่อยู่ในสถานะที่ต้องดำเนินการ — แสดงข้อความแจ้งแทน */}
        {isPreparing && isSender && !canAdvanceStatus && (
          <div className="mt-4 rounded-lg bg-warning/10 px-3 py-2 text-center text-[11px] text-warning">
            รอเภสัชกรหัวหน้ายืนยันการเริ่มจัดส่ง
          </div>
        )}
        {delivery.delivery_status === "EN_ROUTE" && isReceiver && !canReceive && (
          <div className="mt-4 rounded-lg bg-accent/10 px-3 py-2 text-center text-[11px] text-accent">
            รอพยาบาลหรือเภสัชกรหัวหน้าเซ็นรับยา
          </div>
        )}

        {isDelivered && (
          <div className="mt-4 rounded-lg bg-safe/10 px-3 py-2 text-center text-[12px] text-safe">
            เซ็นรับยาเรียบร้อยเมื่อ {formatThaiDateTime(delivery.received_at)}
          </div>
        )}
      </div>
    </div>
  );
}
