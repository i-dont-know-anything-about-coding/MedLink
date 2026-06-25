"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Check } from "lucide-react";
import type { NetworkOverviewItem } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { Select, TextArea, TextInput, FormLabel } from "@/components/ui/FormControls";
import Button from "@/components/ui/Button";
import type { RequestPrefill } from "@/lib/request-prefill";

interface NewRequestFormProps {
  networkItems: NetworkOverviewItem[];
  ownHospitalObjectId: string;
  ownHospitalName: string;
  prefill: RequestPrefill | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: {
    drugObjectId: string;
    drugName: string;
    donorHospitalObjectId: string;
    donorHospitalName: string;
    quantity: number;
    reason: string;
  }) => void;
}

interface DrugOption {
  drugObjectId: string;
  name: string;
}

function buildDrugOptions(
  networkItems: NetworkOverviewItem[],
  ownHospitalObjectId: string
): DrugOption[] {
  const map = new Map<string, string>();
  for (const item of networkItems) {
    if (item.hospital.objectId === ownHospitalObjectId) continue;
    if (item.available_quantity <= 0) continue;
    map.set(item.drug.objectId, item.drug.generic_name);
  }
  return Array.from(map.entries()).map(([drugObjectId, name]) => ({ drugObjectId, name }));
}

function buildDonors(
  networkItems: NetworkOverviewItem[],
  ownHospitalObjectId: string,
  drugObjectId: string
) {
  if (!drugObjectId) return [];
  return networkItems
    .filter(
      (item) =>
        item.drug.objectId === drugObjectId &&
        item.hospital.objectId !== ownHospitalObjectId &&
        item.available_quantity > 0
    )
    .sort((a, b) => b.available_quantity - a.available_quantity);
}

export default function NewRequestForm({
  networkItems,
  ownHospitalObjectId,
  ownHospitalName,
  prefill,
  submitting,
  onCancel,
  onSubmit,
}: NewRequestFormProps) {
  // รายชื่อยาที่ รพ. อื่นในเครือข่ายมีให้ยืม (ไม่รวมของ รพ.เราเอง)
  const drugOptions = useMemo(
    () => buildDrugOptions(networkItems, ownHospitalObjectId),
    [networkItems, ownHospitalObjectId]
  );

  // Pre-fill จาก Alert Queue (Page 2) — คำนวณค่าเริ่มต้นแบบ sync ตอน mount
  // (lazy useState initializer แทนการ setState ใน useEffect เพื่อเลี่ยง cascading render)
  const [drugObjectId, setDrugObjectIdState] = useState<string>(() => {
    if (!prefill) return "";
    const match = drugOptions.find((opt) =>
      opt.name.toLowerCase().includes(prefill.drugName.toLowerCase())
    );
    return match?.drugObjectId ?? "";
  });

  const donors = useMemo(
    () => buildDonors(networkItems, ownHospitalObjectId, drugObjectId),
    [networkItems, ownHospitalObjectId, drugObjectId]
  );

  const [donorHospitalObjectId, setDonorHospitalObjectId] = useState<string>(() => {
    if (!prefill) return "";
    const initialDonors = buildDonors(networkItems, ownHospitalObjectId, drugObjectId);
    const match = initialDonors.find((d) => d.hospital.name === prefill.donorHospitalName);
    return match?.hospital.objectId ?? "";
  });

  const [quantity, setQuantity] = useState(5);
  const [reason, setReason] = useState("");

  // เปลี่ยนยาแล้วเคลียร์ donor เดิมทันทีถ้าไม่ตรงกับยาใหม่ (สั่งจาก event handler ไม่ใช่ effect)
  function handleDrugChange(nextDrugObjectId: string) {
    setDrugObjectIdState(nextDrugObjectId);
    const nextDonors = buildDonors(networkItems, ownHospitalObjectId, nextDrugObjectId);
    if (!nextDonors.some((d) => d.hospital.objectId === donorHospitalObjectId)) {
      setDonorHospitalObjectId("");
    }
  }

  const selectedDonor = donors.find((d) => d.hospital.objectId === donorHospitalObjectId);
  const selectedDrugName = drugOptions.find((d) => d.drugObjectId === drugObjectId)?.name ?? "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !drugObjectId ||
      !donorHospitalObjectId ||
      quantity < 1 ||
      !reason.trim() ||
      !selectedDonor
    ) {
      return;
    }
    onSubmit({
      drugObjectId,
      drugName: selectedDrugName,
      donorHospitalObjectId,
      donorHospitalName: selectedDonor.hospital.name,
      quantity,
      reason: reason.trim(),
    });
  }

  const canSubmit = Boolean(
    drugObjectId && donorHospitalObjectId && quantity > 0 && reason.trim()
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-4"
    >
      <div className="flex items-center gap-2 border-b border-border pb-3 text-[14px] font-semibold text-text-hi">
        <ClipboardList size={16} className="text-accent" />
        ฟอร์มขอยืมยา — {ownHospitalName}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FormLabel>เลือกยาที่ต้องการขอยืม</FormLabel>
          <Select value={drugObjectId} onChange={(e) => handleDrugChange(e.target.value)}>
            <option value="">-- เลือกยา --</option>
            {drugOptions.map((opt) => (
              <option key={opt.drugObjectId} value={opt.drugObjectId}>
                {opt.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FormLabel>จำนวนที่ขอ</FormLabel>
          <TextInput
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <FormLabel>เลือกโรงพยาบาลต้นทาง (เรียงตามปริมาณสต็อก มาก → น้อย)</FormLabel>
        {!drugObjectId ? (
          <div className="rounded-lg border border-border bg-bg p-4 text-center text-[12px] text-text-lo">
            เลือกยาก่อนเพื่อดูรายการโรงพยาบาลที่มียาให้ยืม
          </div>
        ) : donors.length === 0 ? (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-center text-[12px] text-warning">
            ไม่พบโรงพยาบาลที่มียาตัวนี้เหลือในเครือข่าย
          </div>
        ) : (
          <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto rounded-lg border border-border bg-bg p-2">
            {donors.map((d) => (
              <button
                key={d.hospital.objectId}
                type="button"
                onClick={() => setDonorHospitalObjectId(d.hospital.objectId)}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-[12px] transition-colors ${
                  donorHospitalObjectId === d.hospital.objectId
                    ? "bg-accent-dim text-accent"
                    : "text-text-hi hover:bg-panel-hover"
                }`}
              >
                <span>{d.hospital.name}</span>
                <span className="font-data text-text-lo">
                  {formatNumber(d.available_quantity)} หน่วย
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <FormLabel>เหตุผลในการขอยืม</FormLabel>
        <TextArea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="ระบุเหตุผล เช่น: ยาหมดกะทันหัน ผู้ป่วยฉุกเฉิน..."
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-3">
        <Button type="button" variant="cancel" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={!canSubmit || submitting}>
          {submitting ? (
            "กำลังส่ง..."
          ) : (
            <>
              ส่งคำขอยืมยา <Check size={14} />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
