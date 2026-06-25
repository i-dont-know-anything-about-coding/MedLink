"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { TextArea, FormLabel } from "@/components/ui/FormControls";
import type { Drug, Hospital, TransferRequestRecord } from "@/lib/types";

interface RejectModalProps {
  request: TransferRequestRecord | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

function hospitalName(h: string | Hospital): string {
  return typeof h === "string" ? h : h.hospital_name;
}
function drugName(d: string | Drug): string {
  return typeof d === "string" ? d : d.generic_name;
}

export default function RejectModal({
  request,
  submitting,
  onClose,
  onConfirm,
}: RejectModalProps) {
  const [reason, setReason] = useState("");

  if (!request) return null;

  function handleClose() {
    setReason("");
    onClose();
  }

  return (
    <Modal
      open={!!request}
      onClose={handleClose}
      title={`ปฏิเสธคำขอ — ${drugName(request.drug_ref)}`}
      footer={
        <>
          <Button variant="cancel" onClick={handleClose} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            variant="reject"
            disabled={!reason.trim() || submitting}
            onClick={() => onConfirm(reason.trim())}
          >
            {submitting ? "กำลังบันทึก..." : "ยืนยันปฏิเสธ"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-md bg-bg px-3 py-2 text-[12px] text-text-lo">
          {hospitalName(request.to_hospital)} ขอยืม {drugName(request.drug_ref)}
        </div>
        <div>
          <FormLabel>เหตุผลในการปฏิเสธ (จำเป็น)</FormLabel>
          <TextArea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ระบุเหตุผล เช่น: สต็อกไม่เพียงพอ ต้องสำรองไว้ใช้ในหน่วยงาน..."
          />
        </div>
      </div>
    </Modal>
  );
}
