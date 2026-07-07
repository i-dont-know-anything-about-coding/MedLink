"use client";

import { useMemo, type ReactNode } from "react";
import { Building2, AlertTriangle, CheckCircle2, Pill, Droplet } from "lucide-react";
import type { NetworkBloodOverviewItem, NetworkOverviewItem } from "@/lib/types";
import { componentTypeLabel, formatNumber, stockStatusLabel } from "@/lib/format";

export type StatCardType =
  | "all"
  | "critical-hospitals"
  | "normal-hospitals"
  | "critical-drugs"
  | "critical-blood";

type ItemTab = "drug" | "blood";

interface NetworkStatCardsProps {
  itemTab: ItemTab;
  drugItems: NetworkOverviewItem[];
  bloodItems: NetworkBloodOverviewItem[];
  selectedCard: StatCardType | null;
  onSelectCard: (card: StatCardType | null) => void;
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  accentClassName: string;
  active: boolean;
  onClick: () => void;
}

interface HospitalSummary {
  id: string;
  name: string;
  type: string;
  itemCount: number;
  criticalCount: number;
  totalAvailable: number;
}

/** แถวสรุปยอดเลือดทั้งเครือข่าย แยกตามหมู่เลือด x ชนิดคอมโพเนนต์ (รวมทุก รพ.) */
interface BloodGroupSummaryRow {
  bloodGroup: string;
  componentType: string;
  totalAvailable: number;
  totalReserved: number;
  hospitalsReporting: number;
  criticalHospitals: number;
}

function StatCard({ icon, label, value, accentClassName, active, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 items-center gap-3 rounded-xl border bg-panel p-4 text-left transition-colors hover:border-accent/60 hover:bg-panel-hover ${
        active ? "border-accent shadow-[0_0_0_1px_rgba(18,143,220,0.35)]" : "border-border"
      }`}
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${accentClassName}`}>
        {icon}
      </div>
      <div>
        <div className="font-data text-[22px] font-semibold leading-none text-text-hi">
          {value}
        </div>
        <div className="mt-1 text-[12px] text-text-lo">{label}</div>
      </div>
    </button>
  );
}

export default function NetworkStatCards({
  itemTab,
  drugItems,
  bloodItems,
  selectedCard,
  onSelectCard,
}: NetworkStatCardsProps) {
  // ------------------------------------------------------------------
  // 💊 สรุปฝั่งยา — แยกตาม รพ.
  // ------------------------------------------------------------------
  const drugSummary = useMemo(() => {
    const hospitalMap = new Map<string, HospitalSummary>();
    const criticalDrugLines: NetworkOverviewItem[] = [];

    for (const item of drugItems) {
      const existing = hospitalMap.get(item.hospital.id) ?? {
        id: item.hospital.id,
        name: item.hospital.name,
        type: item.hospital.type,
        itemCount: 0,
        criticalCount: 0,
        totalAvailable: 0,
      };

      existing.itemCount += 1;
      existing.totalAvailable += item.available_quantity;

      if (item.stock_status === "RED") {
        existing.criticalCount += 1;
        criticalDrugLines.push(item);
      }

      hospitalMap.set(item.hospital.id, existing);
    }

    const allHospitals = Array.from(hospitalMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "th")
    );
    const criticalHospitals = allHospitals.filter((hospital) => hospital.criticalCount > 0);
    const normalHospitals = allHospitals.filter((hospital) => hospital.criticalCount === 0);

    return { allHospitals, criticalHospitals, normalHospitals, criticalDrugLines };
  }, [drugItems]);

  // ------------------------------------------------------------------
  // 🩸 สรุปฝั่งเลือด — ทั้งแยกตาม รพ. และแยกตามหมู่เลือด x ชนิดคอมโพเนนต์
  // ------------------------------------------------------------------
  const bloodSummary = useMemo(() => {
    const hospitalMap = new Map<string, HospitalSummary>();
    const groupMap = new Map<string, BloodGroupSummaryRow>();

    for (const item of bloodItems) {
      const existingHospital = hospitalMap.get(item.hospital.id) ?? {
        id: item.hospital.id,
        name: item.hospital.name,
        type: item.hospital.type,
        itemCount: 0,
        criticalCount: 0,
        totalAvailable: 0,
      };
      existingHospital.itemCount += 1;
      existingHospital.totalAvailable += item.available_units;
      const isCritical = item.stock_status === "RED";
      if (isCritical) existingHospital.criticalCount += 1;
      hospitalMap.set(item.hospital.id, existingHospital);

      const groupKey = `${item.blood_group}__${item.component_type}`;
      const existingRow = groupMap.get(groupKey) ?? {
        bloodGroup: item.blood_group,
        componentType: item.component_type,
        totalAvailable: 0,
        totalReserved: 0,
        hospitalsReporting: 0,
        criticalHospitals: 0,
      };
      existingRow.totalAvailable += item.available_units;
      existingRow.totalReserved += item.reserved_units;
      existingRow.hospitalsReporting += 1;
      if (isCritical) existingRow.criticalHospitals += 1;
      groupMap.set(groupKey, existingRow);
    }

    const allHospitals = Array.from(hospitalMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "th")
    );
    const criticalHospitals = allHospitals.filter((hospital) => hospital.criticalCount > 0);
    const normalHospitals = allHospitals.filter((hospital) => hospital.criticalCount === 0);

    const groupRows = Array.from(groupMap.values()).sort((a, b) => {
      if (a.bloodGroup !== b.bloodGroup) return a.bloodGroup.localeCompare(b.bloodGroup);
      return a.componentType.localeCompare(b.componentType);
    });
    const criticalGroupRows = groupRows.filter((row) => row.criticalHospitals > 0);

    return { allHospitals, criticalHospitals, normalHospitals, groupRows, criticalGroupRows };
  }, [bloodItems]);

  function toggleCard(card: StatCardType) {
    onSelectCard(selectedCard === card ? null : card);
  }

  const isDrug = itemTab === "drug";
  const allHospitals = isDrug ? drugSummary.allHospitals : bloodSummary.allHospitals;
  const criticalHospitals = isDrug ? drugSummary.criticalHospitals : bloodSummary.criticalHospitals;
  const normalHospitals = isDrug ? drugSummary.normalHospitals : bloodSummary.normalHospitals;
  const fourthCardType: StatCardType = isDrug ? "critical-drugs" : "critical-blood";
  const fourthCardValue = isDrug
    ? drugSummary.criticalDrugLines.length
    : bloodSummary.criticalGroupRows.length;
  const fourthCardLabel = isDrug ? "รายการยาวิกฤตทั้งหมด" : "หมู่เลือดวิกฤตทั้งหมด";

  const selectedTitle =
    selectedCard &&
    (isDrug
      ? {
          all: "รายชื่อโรงพยาบาลในเครือข่าย",
          "critical-hospitals": "รายชื่อโรงพยาบาลสถานะวิกฤต",
          "normal-hospitals": "รายชื่อโรงพยาบาลสถานะปกติ",
          "critical-drugs": "รายการยาวิกฤตทั้งหมด",
          "critical-blood": "หมู่เลือดวิกฤตทั้งหมด",
        }[selectedCard]
      : {
          all: "รายชื่อโรงพยาบาลในเครือข่ายเลือด",
          "critical-hospitals": "รายชื่อโรงพยาบาลสถานะวิกฤต",
          "normal-hospitals": "รายชื่อโรงพยาบาลสถานะปกติ",
          "critical-drugs": "รายการยาวิกฤตทั้งหมด",
          "critical-blood": "สรุปยอดเลือดทั้งเครือข่าย แยกตามหมู่เลือด x ชนิดคอมโพเนนต์",
        }[selectedCard]);

  const selectedHospitals =
    selectedCard === "critical-hospitals"
      ? criticalHospitals
      : selectedCard === "normal-hospitals"
        ? normalHospitals
        : allHospitals;

  const selectedCount =
    selectedCard === "critical-drugs"
      ? drugSummary.criticalDrugLines.length
      : selectedCard === "critical-blood"
        ? bloodSummary.groupRows.length
        : selectedCard
          ? selectedHospitals.length
          : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Building2 size={20} className="text-accent" />}
          label={isDrug ? "โรงพยาบาลในเครือข่าย" : "โรงพยาบาลที่มีคลังเลือด"}
          value={formatNumber(allHospitals.length)}
          accentClassName="bg-accent/15"
          active={selectedCard === "all"}
          onClick={() => toggleCard("all")}
        />
        <StatCard
          icon={<AlertTriangle size={20} className="text-critical" />}
          label="รพ. มีสถานะวิกฤต"
          value={formatNumber(criticalHospitals.length)}
          accentClassName="bg-critical/15"
          active={selectedCard === "critical-hospitals"}
          onClick={() => toggleCard("critical-hospitals")}
        />
        <StatCard
          icon={<CheckCircle2 size={20} className="text-safe" />}
          label="รพ. สถานะปกติ"
          value={formatNumber(normalHospitals.length)}
          accentClassName="bg-safe/15"
          active={selectedCard === "normal-hospitals"}
          onClick={() => toggleCard("normal-hospitals")}
        />
        <StatCard
          icon={
            isDrug ? (
              <Pill size={20} className="text-warning" />
            ) : (
              <Droplet size={20} className="text-warning" />
            )
          }
          label={fourthCardLabel}
          value={formatNumber(fourthCardValue)}
          accentClassName="bg-warning/15"
          active={selectedCard === fourthCardType}
          onClick={() => toggleCard(fourthCardType)}
        />
      </div>

      {selectedCard && (
        <div className="overflow-hidden rounded-xl border border-border bg-panel">
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <div className="text-[13px] font-medium text-text-hi">{selectedTitle}</div>
            <div className="text-[11px] text-text-lo">{formatNumber(selectedCount)} รายการ</div>
          </div>

          {selectedCard === "critical-drugs" ? (
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
              {drugSummary.criticalDrugLines.length === 0 ? (
                <div className="px-3.5 py-4 text-[12px] text-text-lo">ไม่มีรายการยาวิกฤต</div>
              ) : (
                drugSummary.criticalDrugLines.map((item) => (
                  <div
                    key={item.inventory_id}
                    className="grid gap-2 px-3.5 py-3 sm:grid-cols-[1.3fr_1fr_auto] sm:items-center"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-text-hi">
                        {item.drug.generic_name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-text-lo">
                        {item.drug.trade_name} | {item.hospital.name}
                      </div>
                    </div>
                    <div className="text-[12px] text-text-lo">
                      คงเหลือ {formatNumber(item.available_quantity)} / ขั้นต่ำ{" "}
                      {formatNumber(item.safety_stock_level)}
                    </div>
                    <span className="w-fit rounded bg-critical/15 px-2 py-1 text-[11px] text-critical">
                      {stockStatusLabel(item.stock_status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : selectedCard === "critical-blood" ? (
            // 🩸 ตารางสรุปยอดถุงเลือดทั้งเครือข่าย แยกตามหมู่เลือด x ชนิดคอมโพเนนต์
            // (เช่น กรุ๊ป O มี PRC เหลือกี่ถุงในระบบ รวมทุก รพ.) — ตรงจุดสำหรับคนทำงานธนาคารเลือด
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full border-collapse text-left text-[12px]">
                <thead className="sticky top-0 bg-panel">
                  <tr className="text-[11px] uppercase tracking-wide text-text-lo">
                    <th className="px-3.5 py-2 font-medium">หมู่เลือด</th>
                    <th className="px-3.5 py-2 font-medium">ชนิดคอมโพเนนต์</th>
                    <th className="px-3.5 py-2 font-medium">พร้อมจ่าย (รวมทั้งเครือข่าย)</th>
                    <th className="px-3.5 py-2 font-medium">จองแล้ว</th>
                    <th className="px-3.5 py-2 font-medium">รพ. รายงานข้อมูล</th>
                    <th className="px-3.5 py-2 font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bloodSummary.groupRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3.5 py-4 text-[12px] text-text-lo">
                        ไม่มีข้อมูลคลังเลือดในเครือข่าย
                      </td>
                    </tr>
                  ) : (
                    bloodSummary.groupRows.map((row) => (
                      <tr key={`${row.bloodGroup}-${row.componentType}`} className="hover:bg-panel-hover">
                        <td className="px-3.5 py-2.5">
                          <span className="rounded bg-critical/10 px-1.5 py-0.5 font-data font-medium text-critical">
                            {row.bloodGroup}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-text-hi">
                          {componentTypeLabel(row.componentType)}
                        </td>
                        <td className="px-3.5 py-2.5 font-data">
                          <span
                            className={row.criticalHospitals > 0 ? "text-critical" : "text-text-hi"}
                          >
                            {formatNumber(row.totalAvailable)}
                          </span>
                          <span className="text-text-lo"> ถุง</span>
                        </td>
                        <td className="px-3.5 py-2.5 font-data text-text-lo">
                          {formatNumber(row.totalReserved)}
                        </td>
                        <td className="px-3.5 py-2.5 text-text-lo">
                          {formatNumber(row.hospitalsReporting)} แห่ง
                        </td>
                        <td className="px-3.5 py-2.5">
                          {row.criticalHospitals > 0 ? (
                            <span className="w-fit rounded bg-critical/15 px-2 py-1 text-[11px] text-critical">
                              วิกฤต {formatNumber(row.criticalHospitals)} แห่ง
                            </span>
                          ) : (
                            <span className="w-fit rounded bg-safe/15 px-2 py-1 text-[11px] text-safe">
                              ปกติ
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
              {selectedHospitals.length === 0 ? (
                <div className="px-3.5 py-4 text-[12px] text-text-lo">ไม่มีรายการในกลุ่มนี้</div>
              ) : (
                selectedHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="grid gap-2 px-3.5 py-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-text-hi">{hospital.name}</div>
                      <div className="mt-0.5 text-[11px] text-text-lo">
                        รหัส {hospital.id} | ประเภท {hospital.type}
                      </div>
                    </div>
                    <div className="text-[12px] text-text-lo">
                      {isDrug ? "ยาในคลัง" : "รายการเลือดในคลัง"} {formatNumber(hospital.itemCount)}{" "}
                      รายการ | พร้อมใช้ {formatNumber(hospital.totalAvailable)}
                    </div>
                    <span
                      className={`w-fit rounded px-2 py-1 text-[11px] ${
                        hospital.criticalCount > 0
                          ? "bg-critical/15 text-critical"
                          : "bg-safe/15 text-safe"
                      }`}
                    >
                      {hospital.criticalCount > 0
                        ? `วิกฤต ${formatNumber(hospital.criticalCount)} รายการ`
                        : "ปกติ"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
