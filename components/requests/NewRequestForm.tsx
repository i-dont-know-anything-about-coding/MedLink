"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Check, Pill, Droplet } from "lucide-react";
import type { NetworkBloodOverviewItem, NetworkOverviewItem } from "@/lib/types";
import { componentTypeLabel, formatNumber } from "@/lib/format";
import { Select, TextArea, TextInput, FormLabel } from "@/components/ui/FormControls";
import Button from "@/components/ui/Button";
import type { RequestPrefill } from "@/lib/request-prefill";

type ItemType = "DRUG" | "BLOOD";

export interface NewRequestSubmitPayload {
  itemType: ItemType;
  itemName: string; // ชื่อยา หรือ "เลือดกรุ๊ป O+ (PRC)" — ใช้แสดง toast/summary เท่านั้น
  drugObjectId?: string;
  bloodGroup?: string;
  componentType?: string;
  donorHospitalObjectId: string;
  donorHospitalName: string;
  quantity: number;
  reason: string;
}

interface NewRequestFormProps {
  networkItems: NetworkOverviewItem[];
  networkBloodItems: NetworkBloodOverviewItem[];
  ownHospitalObjectId: string;
  ownHospitalName: string;
  prefill: RequestPrefill | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: NewRequestSubmitPayload) => void;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const COMPONENT_TYPES = ["PRC", "FFP", "PLT"];

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

function buildBloodDonors(
  networkBloodItems: NetworkBloodOverviewItem[],
  ownHospitalObjectId: string,
  bloodGroup: string,
  componentType: string
) {
  if (!bloodGroup || !componentType) return [];
  return networkBloodItems
    .filter(
      (item) =>
        item.blood_group === bloodGroup &&
        item.component_type === componentType &&
        item.hospital.objectId !== ownHospitalObjectId &&
        item.available_units > 0
    )
    .sort((a, b) => b.available_units - a.available_units);
}

export default function NewRequestForm({
  networkItems,
  networkBloodItems,
  ownHospitalObjectId,
  ownHospitalName,
  prefill,
  submitting,
  onCancel,
  onSubmit,
}: NewRequestFormProps) {
  const [itemType, setItemType] = useState<ItemType>(
    prefill?.itemType === "BLOOD" ? "BLOOD" : "DRUG"
  );

  // ------------------------------------------------------------------
  // 💊 ฝั่งยา
  // ------------------------------------------------------------------
  const drugOptions = useMemo(
    () => buildDrugOptions(networkItems, ownHospitalObjectId),
    [networkItems, ownHospitalObjectId]
  );

  const [drugObjectId, setDrugObjectIdState] = useState<string>(() => {
    if (!prefill || prefill.itemType === "BLOOD") return "";
    if (prefill.drugObjectId) return prefill.drugObjectId;
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
    if (!prefill || prefill.itemType === "BLOOD") return "";
    if (prefill.donorHospitalObjectId) return prefill.donorHospitalObjectId;
    const initialDonors = buildDonors(networkItems, ownHospitalObjectId, drugObjectId);
    const match = initialDonors.find((d) => d.hospital.name === prefill.donorHospitalName);
    return match?.hospital.objectId ?? "";
  });

  // ------------------------------------------------------------------
  // 🩸 ฝั่งเลือด
  // ------------------------------------------------------------------
  const [bloodGroup, setBloodGroup] = useState<string>(() =>
    prefill?.itemType === "BLOOD" ? prefill.bloodGroup ?? "" : ""
  );
  const [componentType, setComponentType] = useState<string>(() =>
    prefill?.itemType === "BLOOD" ? prefill.componentType ?? "" : ""
  );

  const bloodDonors = useMemo(
    () => buildBloodDonors(networkBloodItems, ownHospitalObjectId, bloodGroup, componentType),
    [networkBloodItems, ownHospitalObjectId, bloodGroup, componentType]
  );

  const [bloodDonorHospitalObjectId, setBloodDonorHospitalObjectId] = useState<string>(() => {
    if (!prefill || prefill.itemType !== "BLOOD") return "";
    if (prefill.donorHospitalObjectId) return prefill.donorHospitalObjectId;
    return "";
  });

  const [quantity, setQuantity] = useState(prefill?.suggestedQuantity ?? 5);
  const [reason, setReason] = useState("");

  // เปลี่ยนยาแล้วเคลียร์ donor เดิมทันทีถ้าไม่ตรงกับยาใหม่ (สั่งจาก event handler ไม่ใช่ effect)
  function handleDrugChange(nextDrugObjectId: string) {
    setDrugObjectIdState(nextDrugObjectId);
    const nextDonors = buildDonors(networkItems, ownHospitalObjectId, nextDrugObjectId);
    if (!nextDonors.some((d) => d.hospital.objectId === donorHospitalObjectId)) {
      setDonorHospitalObjectId("");
    }
  }

  function handleBloodGroupOrComponentChange(nextGroup: string, nextComponent: string) {
    setBloodGroup(nextGroup);
    setComponentType(nextComponent);
    const nextDonors = buildBloodDonors(
      networkBloodItems,
      ownHospitalObjectId,
      nextGroup,
      nextComponent
    );
    if (!nextDonors.some((d) => d.hospital.objectId === bloodDonorHospitalObjectId)) {
      setBloodDonorHospitalObjectId("");
    }
  }

  const selectedDonor = donors.find((d) => d.hospital.objectId === donorHospitalObjectId);
  const selectedDrugName =
    drugOptions.find((d) => d.drugObjectId === drugObjectId)?.name ?? prefill?.drugName ?? "";

  const selectedBloodDonor = bloodDonors.find(
    (d) => d.hospital.objectId === bloodDonorHospitalObjectId
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (itemType === "DRUG") {
      if (!drugObjectId || !donorHospitalObjectId || quantity < 1 || !reason.trim() || !selectedDonor) {
        return;
      }
      onSubmit({
        itemType: "DRUG",
        itemName: selectedDrugName,
        drugObjectId,
        donorHospitalObjectId,
        donorHospitalName: selectedDonor.hospital.name,
        quantity,
        reason: reason.trim(),
      });
    } else {
      if (
        !bloodGroup ||
        !componentType ||
        !bloodDonorHospitalObjectId ||
        quantity < 1 ||
        !reason.trim() ||
        !selectedBloodDonor
      ) {
        return;
      }
      onSubmit({
        itemType: "BLOOD",
        itemName: `เลือดกรุ๊ป ${bloodGroup} (${componentType})`,
        bloodGroup,
        componentType,
        donorHospitalObjectId: bloodDonorHospitalObjectId,
        donorHospitalName: selectedBloodDonor.hospital.name,
        quantity,
        reason: reason.trim(),
      });
    }
  }

  const canSubmit =
    itemType === "DRUG"
      ? Boolean(drugObjectId && donorHospitalObjectId && quantity > 0 && reason.trim())
      : Boolean(
          bloodGroup && componentType && bloodDonorHospitalObjectId && quantity > 0 && reason.trim()
        );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-4"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-text-hi">
          <ClipboardList size={16} className="text-accent" />
          ฟอร์มขอยืม{itemType === "DRUG" ? "ยา" : "เลือด"} — {ownHospitalName}
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-bg p-0.5">
          <button
            type="button"
            onClick={() => setItemType("DRUG")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
              itemType === "DRUG" ? "bg-accent text-white" : "text-text-lo hover:text-text-hi"
            }`}
          >
            <Pill size={13} /> ยา
          </button>
          <button
            type="button"
            onClick={() => setItemType("BLOOD")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
              itemType === "BLOOD" ? "bg-accent text-white" : "text-text-lo hover:text-text-hi"
            }`}
          >
            <Droplet size={13} /> เลือด
          </button>
        </div>
      </div>

      {itemType === "DRUG" ? (
        <>
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
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FormLabel>หมู่เลือด</FormLabel>
              <Select
                value={bloodGroup}
                onChange={(e) => handleBloodGroupOrComponentChange(e.target.value, componentType)}
              >
                <option value="">-- เลือกหมู่เลือด --</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FormLabel>ชนิดส่วนประกอบ</FormLabel>
              <Select
                value={componentType}
                onChange={(e) => handleBloodGroupOrComponentChange(bloodGroup, e.target.value)}
              >
                <option value="">-- เลือกชนิด --</option>
                {COMPONENT_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {componentTypeLabel(c)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FormLabel>จำนวนที่ขอ (ยูนิต)</FormLabel>
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
            {!bloodGroup || !componentType ? (
              <div className="rounded-lg border border-border bg-bg p-4 text-center text-[12px] text-text-lo">
                เลือกหมู่เลือดและชนิดส่วนประกอบก่อนเพื่อดูรายการโรงพยาบาลที่มีเลือดให้ยืม
              </div>
            ) : bloodDonors.length === 0 ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-center text-[12px] text-warning">
                ไม่พบโรงพยาบาลที่มีเลือดกรุ๊ปนี้เหลือในเครือข่าย
              </div>
            ) : (
              <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto rounded-lg border border-border bg-bg p-2">
                {bloodDonors.map((d) => (
                  <button
                    key={d.hospital.objectId}
                    type="button"
                    onClick={() => setBloodDonorHospitalObjectId(d.hospital.objectId)}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-[12px] transition-colors ${
                      bloodDonorHospitalObjectId === d.hospital.objectId
                        ? "bg-accent-dim text-accent"
                        : "text-text-hi hover:bg-panel-hover"
                    }`}
                  >
                    <span>{d.hospital.name}</span>
                    <span className="font-data text-text-lo">
                      {formatNumber(d.available_units)} ยูนิต
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div>
        <FormLabel>เหตุผลในการขอยืม</FormLabel>
        <TextArea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            itemType === "DRUG"
              ? "ระบุเหตุผล เช่น: ยาหมดกะทันหัน ผู้ป่วยฉุกเฉิน..."
              : "ระบุเหตุผล เช่น: เลือดขาดตู้ ผู้ป่วยต้องผ่าตัดฉุกเฉิน..."
          }
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
              ส่งคำขอยืม{itemType === "DRUG" ? "ยา" : "เลือด"} <Check size={14} />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
