"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { TextInput, FormLabel } from "@/components/ui/FormControls";
import type { Drug, Hospital, TransferRequestRecord } from "@/lib/types";
import { formatNumber } from "@/lib/format";

interface ApproveModalProps {
  request: TransferRequestRecord | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (quantityApproved: number) => void;
}

function hospitalName(h: string | Hospital): string {
  return typeof h === "string" ? h : h.hospital_name;
}
function drugName(d: string | Drug): string {
  return typeof d === "string" ? d : d.generic_name;
}

export default function ApproveModal({
  request,
  submitting,
  onClose,
  onConfirm,
}: ApproveModalProps) {
  if (!request) return null;

  return (
    <ApproveModalContent
      // key ตาม _id เพื่อให้ state จำนวนที่อนุมัติ reset ใหม่ทุกครั้งที่เปลี่ยนคำขอ
      // (แทนการใช้ useEffect + setState ซึ่งทำให้เกิด cascading render)
      key={request._id}
      request={request}
      submitting={submitting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function ApproveModalContent({
  request,
  submitting,
  onClose,
  onConfirm,
}: {
  request: TransferRequestRecord;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (quantityApproved: number) => void;
}) {
  const [quantityApproved, setQuantityApproved] = useState(request.quantity_requested);

  const isPartial = quantityApproved > 0 && quantityApproved < request.quantity_requested;
  const isValid = quantityApproved > 0 && quantityApproved <= request.quantity_requested;

  return (
    <Modal
      open
      onClose={onClose}
      title={`อนุมัติคำขอ — ${drugName(request.drug_ref)}`}
      footer={
        <>
          <Button variant="cancel" onClick={onClose} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            variant="approve"
            disabled={!isValid || submitting}
            onClick={() => onConfirm(quantityApproved)}
          >
            {submitting ? "กำลังอนุมัติ..." : "ยืนยันอนุมัติ"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-md bg-bg px-3 py-2 text-[12px] text-text-lo">
          {hospitalName(request.to_hospital)} ขอยืม {drugName(request.drug_ref)} จำนวน{" "}
          <strong className="text-text-hi">{formatNumber(request.quantity_requested)}</strong> หน่วย
        </div>

        <div>
          <FormLabel>จำนวนที่อนุมัติ (รองรับ Partial Fulfillment)</FormLabel>
          <TextInput
            type="number"
            min={1}
            max={request.quantity_requested}
            value={quantityApproved}
            onChange={(e) => setQuantityApproved(Number(e.target.value))}
          />
        </div>

        {isPartial && (
          <div className="flex items-start gap-1.5 rounded-md bg-warning/10 px-3 py-2 text-[11px] text-warning">
            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
            <span>
              อนุมัติเพียงบางส่วน ({formatNumber(quantityApproved)} จาก{" "}
              {formatNumber(request.quantity_requested)} ที่ขอ)
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
