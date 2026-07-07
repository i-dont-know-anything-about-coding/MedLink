"use client";

import { Truck, CheckCircle, Download } from "lucide-react";
import type { Drug, Hospital, TransferRequestRecord, TransferStatus } from "@/lib/types";
import { formatNumber, formatThaiDateTime } from "@/lib/format";
import { downloadTransferRequestPdf } from "@/lib/transfer-document";

const STATUS_LABEL: Record<TransferStatus, string> = {
  PENDING: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว — กำลังเตรียมจัดส่ง",
  IN_TRANSIT: "กำลังขนส่ง",
  COMPLETED: "เสร็จสิ้น",
  REJECTED: "ถูกปฏิเสธ",
  CANCELLED: "ยกเลิกแล้ว",
};

const STATUS_CLASSES: Record<TransferStatus, string> = {
  PENDING: "bg-warning/15 text-warning",
  APPROVED: "bg-accent/15 text-accent",
  IN_TRANSIT: "bg-accent/15 text-accent",
  COMPLETED: "bg-safe/15 text-safe",
  REJECTED: "bg-critical/15 text-critical",
  CANCELLED: "bg-border-light text-text-lo",
};

export function StatusChip({ status }: { status: TransferStatus }) {
  return (
    <span
      className={`flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** บางครั้ง backend ไม่ populate from_hospital/to_hospital เป็น object (ส่งมาเป็น ObjectId string เฉยๆ)
 * ถ้า id ตรงกับ รพ. ของผู้ใช้ที่ login อยู่ ให้ใช้ชื่อ รพ. ของผู้ใช้แทน ไม่ใช่ขึ้น id ตรงๆ */
function hospitalName(
  h: string | Hospital,
  ownHospitalObjectId?: string,
  ownHospitalName?: string
): string {
  if (typeof h !== "string") return h.hospital_name;
  if (ownHospitalObjectId && ownHospitalName && h === ownHospitalObjectId) return ownHospitalName;
  return h;
}
function drugName(d: string | Drug | null | undefined): string {
  if (!d) return "";
  return typeof d === "string" ? d : d.generic_name;
}

/** 🩸 แสดงชื่อรายการที่ขอยืมได้ทั้งกรณียาและเลือด โดยไม่ต้องเช็ค item_type ซ้ำในทุกจุดที่ใช้ */
function itemDisplayName(item: TransferRequestRecord): string {
  if (item.item_type === "BLOOD") {
    return `เลือดกรุ๊ป ${item.blood_group ?? ""} (${item.component_type ?? ""})`;
  }
  return drugName(item.drug_ref);
}

interface InboxCardProps {
  item: TransferRequestRecord;
  ownHospitalObjectId: string;
  ownHospitalName: string;
  onApprove: () => void;
  onReject: () => void;
  onTrackDelivery: () => void;
  processing: boolean;
}

export function InboxRequestCard({
  item,
  ownHospitalObjectId,
  ownHospitalName,
  onApprove,
  onReject,
  onTrackDelivery,
  processing,
}: InboxCardProps) {
  // สถานะที่ต้องแสดงปุ่มดูการจัดส่ง (อนุมัติแล้วมี Delivery record แล้ว)
  const showTrack = item.status === "APPROVED" || item.status === "IN_TRANSIT";

  return (
    <div className="rounded-lg border border-border bg-panel p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-medium text-text-hi">{itemDisplayName(item)}</div>
          <div className="mt-0.5 text-[11px] text-text-lo">
            ขอจาก: {hospitalName(item.to_hospital, ownHospitalObjectId, ownHospitalName)}
          </div>
        </div>
        <StatusChip status={item.status} />
      </div>

      <div className="mt-2 text-[11px] text-text-lo">
        จำนวนที่ขอ:{" "}
        <span className="font-data text-text-hi">{formatNumber(item.quantity_requested)}</span>
        {item.quantity_approved > 0 && item.status !== "PENDING" && (
          <span className="ml-2">
            อนุมัติ:{" "}
            <span className="font-data text-text-hi">{formatNumber(item.quantity_approved)}</span>
          </span>
        )}
      </div>

      <div className="mt-1 text-[11px] text-text-lo">
        ส่งคำขอเมื่อ: {formatThaiDateTime(item.createdAt)}
      </div>

      {item.status === "PENDING" && (
        <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
          <button
            onClick={onReject}
            disabled={processing}
            className="rounded-md border border-critical/30 bg-critical/15 px-3 py-1.5 text-[11px] font-medium text-critical transition-colors hover:bg-critical/25 disabled:opacity-50"
          >
            ปฏิเสธ
          </button>
          <button
            onClick={onApprove}
            disabled={processing}
            className="rounded-md border border-safe/30 bg-safe/15 px-3 py-1.5 text-[11px] font-medium text-safe transition-colors hover:bg-safe/25 disabled:opacity-50"
          >
            อนุมัติ
          </button>
        </div>
      )}

      {(showTrack || item.status === "COMPLETED" || item.status === "REJECTED") && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
          {item.status === "COMPLETED" ? (
            <div className="flex items-center gap-1.5 text-[11px] text-safe">
              <CheckCircle size={13} />
              ส่งมอบยาเรียบร้อยแล้ว
            </div>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={() =>
                downloadTransferRequestPdf(item, {
                  objectId: ownHospitalObjectId,
                  name: ownHospitalName,
                })
              }
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] text-text-hi transition-colors hover:bg-panel-hover"
            >
              <Download size={13} />
              ดาวน์โหลด PDF
            </button>
            {showTrack && (
              <button
                onClick={onTrackDelivery}
                className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent/90"
              >
                <Truck size={13} />
                ดูสถานะการจัดส่ง
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface OutboxCardProps {
  item: TransferRequestRecord;
  ownHospitalObjectId: string;
  ownHospitalName: string;
  onTrack: () => void;
  onCancel: () => void;
  processing: boolean;
}

export function OutboxRequestCard({
  item,
  ownHospitalObjectId,
  ownHospitalName,
  onTrack,
  onCancel,
  processing,
}: OutboxCardProps) {
  // APPROVED = Delivery สร้างแล้ว (PREPARING), IN_TRANSIT = กำลังขนส่ง — ทั้งสองควรดูได้
  const showTrack = item.status === "APPROVED" || item.status === "IN_TRANSIT";

  return (
    <div className="rounded-lg border border-border bg-panel p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-medium text-text-hi">{itemDisplayName(item)}</div>
          <div className="mt-0.5 text-[11px] text-text-lo">
            ขอจาก: {hospitalName(item.from_hospital, ownHospitalObjectId, ownHospitalName)}
          </div>
        </div>
        <StatusChip status={item.status} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-text-lo">
        <div>
          ขอ:{" "}
          <span className="font-data text-text-hi">{formatNumber(item.quantity_requested)}</span>
        </div>
        <div>
          อนุมัติ:{" "}
          <span className="font-data text-text-hi">
            {item.quantity_approved > 0 ? formatNumber(item.quantity_approved) : "—"}
          </span>
        </div>
      </div>

      {item.status === "REJECTED" && item.rejection_reason && (
        <div className="mt-2 rounded-md bg-critical/10 px-2.5 py-1.5 text-[11px] text-critical">
          เหตุผล: {item.rejection_reason}
        </div>
      )}

      <div className="mt-1 text-[11px] text-text-lo">
        ส่งคำขอเมื่อ: {formatThaiDateTime(item.createdAt)}
      </div>

      <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
        {item.status === "PENDING" && (
          <button
            onClick={onCancel}
            disabled={processing}
            className="rounded-md border border-border px-3 py-1.5 text-[11px] text-text-lo transition-colors hover:bg-panel-hover hover:text-text-hi disabled:opacity-50"
          >
            ยกเลิกคำขอ
          </button>
        )}
        {item.status !== "PENDING" && item.status !== "CANCELLED" && (
          <button
            onClick={() =>
              downloadTransferRequestPdf(item, {
                objectId: ownHospitalObjectId,
                name: ownHospitalName,
              })
            }
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] text-text-hi transition-colors hover:bg-panel-hover"
          >
            <Download size={13} />
            ดาวน์โหลด PDF
          </button>
        )}
        {showTrack && (
          <button
            onClick={onTrack}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent/90"
          >
            <Truck size={13} />
            {item.status === "IN_TRANSIT" ? "ติดตามรถ" : "ดูสถานะจัดส่ง"}
          </button>
        )}
        {item.status === "COMPLETED" && (
          <div className="flex items-center gap-1.5 text-[11px] text-safe">
            <CheckCircle size={13} />
            ส่งมอบยาเรียบร้อยแล้ว
          </div>
        )}
      </div>
    </div>
  );
}