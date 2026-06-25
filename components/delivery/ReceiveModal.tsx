"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { TextInput, FormLabel } from "@/components/ui/FormControls";
import type { MockDeliveryView } from "@/lib/mock-delivery";

interface ReceiveModalProps {
  delivery: MockDeliveryView | null;
  receivedByName: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (lotNumber: string) => void;
}

/**
 * Page 5 ตามสเปก MVP: พิมพ์ lot number ด้วยมือ (ไม่ใช้กล้อง QR ตามที่ตัดออกใน MVP)
 * ระบบ verify lot ถูกต้องก่อนบันทึก received_by, received_at และเปลี่ยนเป็น DELIVERED
 */
export default function ReceiveModal({
  delivery,
  receivedByName,
  submitting,
  onClose,
  onConfirm,
}: ReceiveModalProps) {
  const [lotNumber, setLotNumber] = useState("");

  if (!delivery) return null;

  function handleClose() {
    setLotNumber("");
    onClose();
  }

  return (
    <Modal
      open={!!delivery}
      onClose={handleClose}
      title="เซ็นรับยา — ยืนยัน Lot Number"
      footer={
        <>
          <Button variant="cancel" onClick={handleClose} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            disabled={!lotNumber.trim() || submitting}
            onClick={() => onConfirm(lotNumber.trim())}
          >
            {submitting ? "กำลังบันทึก..." : "ยืนยันรับยา"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-md bg-bg px-3 py-2 text-[12px] text-text-lo">
          {delivery.drug_generic_name} จำนวน {delivery.quantity} หน่วย จาก{" "}
          {delivery.from_hospital_name}
        </div>

        <div>
          <FormLabel>พิมพ์ Lot Number บนกล่อง/ฉลากยาที่ได้รับ</FormLabel>
          <TextInput
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value)}
            placeholder="เช่น LOT-A112-2024"
            className="font-data"
            autoFocus
          />
        </div>

        <div className="rounded-md bg-accent/10 px-3 py-2 text-[11px] text-accent">
          ผู้เซ็นรับ: {receivedByName}
        </div>
      </div>
    </Modal>
  );
}
